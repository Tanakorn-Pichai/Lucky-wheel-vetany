// ===== STATE MANAGEMENT =====
let prizes = [
    { name: '100 ฿', color: '#ff6b6b', odds: 1 },
    { name: '50 ฿', color: '#4ecdc4', odds: 1 },
    { name: '1000 ฿', color: '#ffe66d', odds: 1 },
    { name: '20 ฿', color: '#a8e6cf', odds: 1 },
    { name: '10 ฿', color: '#ff8787', odds: 1 },
    { name: '500 ฿', color: '#74b9ff', odds: 1 },
    { name: '5 ฿', color: '#fd79a8', odds: 1 },
    { name: '200 ฿', color: '#fdcb6e', odds: 1 },
];

let spinSpeed = 5;
let isSpinning = false;
let currentRotation = 0;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    renderWheel();
    renderPrizeList();
    setupSpinButton();
});

// ===== PROBABILITY CALCULATION =====
function getTotalOdds() {
    return prizes.reduce((sum, prize) => sum + prize.odds, 0);
}

function getWinnerByOdds() {
    const totalOdds = getTotalOdds();
    let random = Math.random() * totalOdds;
    
    for (let i = 0; i < prizes.length; i++) {
        random -= prizes[i].odds;
        if (random <= 0) {
            return i;
        }
    }
    return 0;
}

// ===== PRIZE MANAGEMENT =====
function addPrize() {
    const prizeInput = document.getElementById('prizeInput');
    const colorInput = document.getElementById('colorInput');
    
    const prizeName = prizeInput.value.trim();
    
    if (!prizeName) {
        alert('กรุณาใส่ชื่อรางวัล');
        return;
    }

    if (prizes.length >= 12) {
        alert('จำนวนรางวัลสูงสุด 12 รางวัล');
        return;
    }

    prizes.push({
        name: prizeName,
        color: colorInput.value,
        odds: 1
    });

    prizeInput.value = '';
    colorInput.value = '#ff6b6b';

    renderWheel();
    renderPrizeList();
}

function removePrize(index) {
    if (prizes.length <= 1) {
        alert('ต้องมีรางวัลอย่างน้อย 1 รางวัล');
        return;
    }

    prizes.splice(index, 1);
    renderWheel();
    renderPrizeList();
}

function updateOdds(index, value) {
    const odds = parseInt(value) || 1;
    if (odds < 1) prizes[index].odds = 1;
    else prizes[index].odds = odds;
    
    renderWheel();
}

function renderPrizeList() {
    const prizeList = document.getElementById('prizeList');
    prizeList.innerHTML = '';

    prizes.forEach((prize, index) => {
        const prizeItem = document.createElement('div');
        prizeItem.className = 'prize-item';
        prizeItem.innerHTML = `
            <div class="prize-color" style="background-color: ${prize.color};"></div>
            <div class="prize-name">${prize.name}</div>
            <div class="prize-odds">
                <label for="odds-${index}">อัตราชนะ (%):</label>
                <input type="number" id="odds-${index}" min="1" max="100" value="${prize.odds}" 
                       onchange="updateOdds(${index}, this.value)"> %
            </div>
            <button onclick="removePrize(${index})">✕</button>
        `;
        prizeList.appendChild(prizeItem);
    });
}

// ===== WHEEL RENDERING =====
function renderWheel() {
    const wheel = document.getElementById('wheel');
    wheel.innerHTML = '';

    const totalOdds = getTotalOdds();
    
    // Create conic gradient colors
    let conicStops = [];
    let currentDegree = 0;

    prizes.forEach((prize) => {
        const segmentDegrees = (prize.odds / totalOdds) * 360;
        conicStops.push(`${prize.color} ${currentDegree}deg ${currentDegree + segmentDegrees}deg`);
        currentDegree += segmentDegrees;
    });

    wheel.style.background = `conic-gradient(from 0deg, ${conicStops.join(', ')})`;
    wheel.style.border = '8px solid white';
    wheel.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.2), 0 10px 40px rgba(0, 0, 0, 0.3)';

    // Create number segments positioned around the wheel
    currentDegree = 0;
    prizes.forEach((prize, index) => {
        const segmentDegrees = (prize.odds / totalOdds) * 360;
        const midDegree = currentDegree + segmentDegrees / 2;

        const numberDiv = document.createElement('div');
        numberDiv.className = 'number';
        numberDiv.style.setProperty('--i', index + 1);
        numberDiv.style.setProperty('--angle', `${midDegree}deg`);
        numberDiv.style.transform = `rotate(${midDegree}deg)`;

        const span = document.createElement('span');
        span.textContent = prize.name;
        span.style.transform = `rotate(${-midDegree}deg)`;

        numberDiv.appendChild(span);
        wheel.appendChild(numberDiv);

        currentDegree += segmentDegrees;
    });

    // Update animation
    const style = document.getElementById('wheelStyle') || document.createElement('style');
    style.id = 'wheelStyle';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(3600deg); }
        }
        
        .wheel.spinning {
            animation: spin ${spinSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
    `;
    if (!document.getElementById('wheelStyle')) {
        document.head.appendChild(style);
    }
}

// ===== SPIN FUNCTIONALITY =====
function setupSpinButton() {
    const spinBtn = document.querySelector('.spinner-btn');
    spinBtn.addEventListener('click', spinWheel);
}

function spinWheel() {
    if (isSpinning) return;

    const wheel = document.getElementById('wheel');
    const resultDisplay = document.getElementById('resultDisplay');

    isSpinning = true;

    resultDisplay.classList.remove('show');

    wheel.classList.remove('spinning');
    void wheel.offsetWidth;
    wheel.classList.add('spinning');

    // Get winner based on odds
    const randomIndex = getWinnerByOdds();
    const totalOdds = getTotalOdds();
    
    let segmentStart = 0;
    for (let i = 0; i < randomIndex; i++) {
        segmentStart += (prizes[i].odds / totalOdds) * 360;
    }
    
    const segmentDegrees = (prizes[randomIndex].odds / totalOdds) * 360;
    const randomAngle = Math.random() * segmentDegrees;
    const targetRotation = currentRotation + 3600 + segmentStart + randomAngle;

    setTimeout(() => {
        wheel.classList.remove('spinning');
        currentRotation = targetRotation % 360;
        wheel.style.transform = `rotate(${currentRotation}deg)`;

        const winningPrize = prizes[randomIndex];
        resultDisplay.innerHTML = `🎉 ${winningPrize.name} 🎉`;
        resultDisplay.classList.add('show');

        isSpinning = false;
    }, spinSpeed * 1000);
}

// ===== SETTINGS =====
function updateSpeed() {
    const speedInput = document.getElementById('spinSpeed');
    const speedValue = document.getElementById('speedValue');
    
    spinSpeed = parseInt(speedInput.value);
    speedValue.textContent = spinSpeed;

    const style = document.getElementById('wheelStyle');
    if (style) {
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(3600deg); }
            }
            
            .wheel.spinning {
                animation: spin ${spinSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            }
        `;
    }
}

function resetWheel() {
    if (confirm('คุณต้องการรีเซ็ตวงล้อหรือไม่?')) {
        prizes = [
            { name: '100 ฿', color: '#ff6b6b', odds: 1 },
            { name: '50 ฿', color: '#4ecdc4', odds: 1 },
            { name: '1000 ฿', color: '#ffe66d', odds: 1 },
            { name: '20 ฿', color: '#a8e6cf', odds: 1 },
            { name: '10 ฿', color: '#ff8787', odds: 1 },
            { name: '500 ฿', color: '#74b9ff', odds: 1 },
            { name: '5 ฿', color: '#fd79a8', odds: 1 },
            { name: '200 ฿', color: '#fdcb6e', odds: 1 },
        ];

        spinSpeed = 5;
        currentRotation = 0;
        isSpinning = false;

        const wheel = document.getElementById('wheel');
        const resultDisplay = document.getElementById('resultDisplay');
        const speedInput = document.getElementById('spinSpeed');
        const speedValue = document.getElementById('speedValue');

        wheel.classList.remove('spinning');
        wheel.style.transform = 'rotate(0deg)';
        resultDisplay.classList.remove('show');
        speedInput.value = 5;
        speedValue.textContent = '5';

        renderWheel();
        renderPrizeList();
        updateSpeed();
    }
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isSpinning) {
        event.preventDefault();
        spinWheel();
    }
});
