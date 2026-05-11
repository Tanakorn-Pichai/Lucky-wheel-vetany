// ===== DISPLAY PAGE STATE =====
let isSpinning = false;
let lastUpdateTime = 0;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    renderWheel();
    setupSpinButton();
    monitorSettingsChanges();
});

// ===== MONITOR SETTINGS CHANGES =====
function monitorSettingsChanges() {
    // Listen for storage changes (when admin page saves)
    window.addEventListener('storage', function(event) {
        if (event.key === STORAGE_KEY) {
            loadSettings();
            renderWheel();
        }
    });
    
    // Listen for custom event from admin page
    window.addEventListener('wheelSettingsChanged', function(event) {
        loadSettings();
        renderWheel();
    });
    
    // Periodic check for updates (fallback)
    setInterval(function() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.timestamp && data.timestamp > lastUpdateTime) {
                lastUpdateTime = data.timestamp;
                loadSettings();
                renderWheel();
            }
        }
    }, 500);
}

// ===== NOTIFICATION FUNCTION =====
function notifyDisplayPageOfChanges() {
    // This is called from admin when making changes
    // Display page will auto-detect via event listener
}

// ===== WHEEL RENDERING =====
function renderWheel() {
    const wheel = document.getElementById('wheel');
    wheel.innerHTML = '';

    const totalOdds = getTotalOdds();
    const segmentCount = prizes.length;
    
    if (segmentCount <= 0) {
        wheel.innerHTML = '<div style="color: white; text-align: center;">ยังไม่มีรางวัล</div>';
        return;
    }
    const segmentDegrees = 360 / segmentCount;
    
    // Create conic gradient colors
    let conicStops = [];
    let currentDegree = 0;

    prizes.forEach((prize) => {
        conicStops.push(`${prize.color} ${currentDegree}deg ${currentDegree + segmentDegrees}deg`);
        currentDegree += segmentDegrees;
    });

    wheel.style.background = `conic-gradient(from 0deg, ${conicStops.join(', ')})`;
    wheel.style.border = '8px solid white';
    wheel.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.2), 0 10px 40px rgba(0, 0, 0, 0.3)';

    // Create number segments positioned around the wheel
    currentDegree = 0;
    prizes.forEach((prize, index) => {
        const midDegree = currentDegree + segmentDegrees / 2;
        const textAngle = midDegree - 90;
        const numberDiv = document.createElement('div');
        numberDiv.className = 'number';
        numberDiv.style.setProperty('--i', index + 1);
        numberDiv.style.setProperty('--angle', `${textAngle}deg`);
        numberDiv.style.transform = `rotate(${textAngle}deg)`;

        const span = document.createElement('span');
        span.textContent = prize.name;
        span.style.transform = `translateX(var(--label-radius, 130px)) rotate(${-textAngle}deg)`;

        numberDiv.appendChild(span);
        wheel.appendChild(numberDiv);

        currentDegree += segmentDegrees;
    });
}

// ===== SPIN FUNCTIONALITY =====
function setupSpinButton() {
    const spinBtn = document.querySelector('.spinner-btn');
    if (spinBtn) {
        spinBtn.addEventListener('click', spinWheel);
    }
}

function getPointedPrizeIndex(rotationDeg) {
    if (!prizes.length) return 0;
    const segmentDegrees = 360 / prizes.length;
    const normalized = ((rotationDeg % 360) + 360) % 360;
    const pointedAngle = (360 - normalized) % 360;
    return Math.floor(pointedAngle / segmentDegrees) % prizes.length;
}

function findNextPlayableIndex(startIndex) {
    const minPlayableOdds = 1;
    for (let i = 0; i < prizes.length; i++) {
        const idx = (startIndex + i) % prizes.length;
        if (parseFloat(prizes[idx].odds || 0) >= minPlayableOdds) return idx;
    }
    return startIndex;
}

function getRotationToCenterIndex(fromRotation, index) {
    const segmentDegrees = 360 / prizes.length;
    const targetOnSegment = (segmentDegrees * index) + (segmentDegrees * 0.62);
    const pointerAngle = 0;
    const normalizedFrom = ((fromRotation % 360) + 360) % 360;
    const desiredRotation = ((pointerAngle - targetOnSegment) % 360 + 360) % 360;
    const deltaToTarget = ((desiredRotation - normalizedFrom) % 360 + 360) % 360;
    return fromRotation + deltaToTarget;
}

function spinWheel() {
    if (isSpinning) return;

    const wheel = document.getElementById('wheel');
    const resultDisplay = document.getElementById('resultDisplay');
    const totalOdds = getTotalOdds();

    if (totalOdds <= 0) {
        alert('ยังไม่มีรางวัล');
        return;
    }

    isSpinning = true;
    resultDisplay.classList.remove('show');

    // Get winner based on odds
    let randomIndex = getWinnerByOdds();
    randomIndex = findNextPlayableIndex(randomIndex);
    
    // Visual wheel segments are equal-size; odds are only for picking winner
    const segmentDegrees = 360 / prizes.length;
    const segmentStart = segmentDegrees * randomIndex;
    const edgePadding = segmentDegrees * 0.18;
    const randomInSegment = edgePadding + (Math.random() * (segmentDegrees - edgePadding * 2));
    const targetOnSegment = segmentStart + randomInSegment;
    // conic-gradient starts at top (0deg), so top pointer is 0deg in our segment map
    const pointerAngle = 0;
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    const desiredRotation = ((pointerAngle - targetOnSegment) % 360 + 360) % 360;
    const deltaToTarget = ((desiredRotation - normalizedCurrent) % 360 + 360) % 360;
    const extraSpins = 8 * 360;
    const targetRotation = currentRotation + extraSpins + deltaToTarget;

    wheel.style.transition = `transform ${spinSpeed}s cubic-bezier(0.12, 0.78, 0.22, 1)`;
    wheel.style.transform = `rotate(${targetRotation}deg)`;

    setTimeout(() => {
        currentRotation = targetRotation;
        const pointedIndex = getPointedPrizeIndex(currentRotation);
        const finalIndex = findNextPlayableIndex(pointedIndex);

        if (finalIndex !== pointedIndex) {
            currentRotation = getRotationToCenterIndex(currentRotation, finalIndex);
            wheel.style.transition = 'transform 1s ease-out';
            wheel.style.transform = `rotate(${currentRotation}deg)`;
        }

        setTimeout(() => {
            const winningPrize = prizes[finalIndex];
            resultDisplay.innerHTML = `🎉 ${winningPrize.name} 🎉`;
            resultDisplay.classList.add('show');
            isSpinning = false;
        }, finalIndex !== pointedIndex ? 1000 : 0);
    }, spinSpeed * 1000);
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isSpinning) {
        event.preventDefault();
        spinWheel();
    }
});
