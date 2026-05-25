// ===== ADMIN PAGE STATE =====

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    try {
        loadSettings();
    } catch (error) {
        // Keep page usable even if stored data is malformed.
        console.error('loadSettings failed:', error);
    }

    const speedInput = document.getElementById('spinSpeed');
    const speedValue = document.getElementById('speedValue');
    if (speedInput && speedValue) {
        speedInput.value = spinSpeed;
        speedValue.textContent = spinSpeed;
    }

    const imageSizeInput = document.getElementById('imageSize');
    const imageSizeValue = document.getElementById('imageSizeValue');
    if (imageSizeInput && imageSizeValue) {
        imageSizeInput.value = prizeImageSize;
        imageSizeValue.textContent = prizeImageSize;
    }

    renderPrizeList();
    renderAdminWheel();
    updateStats();
    // One more pass after layout to avoid race conditions with initial state sync.
    setTimeout(renderPrizeList, 0);
});

function savePrizeSettings() {
    saveSettings(true);
    renderAdminWheel();
    updateStats();
}

// ===== PRIZE LIST RENDERING =====
function renderPrizeList() {
    const prizeList = document.getElementById('prizeList');
    if (!prizeList) return;

    prizeList.innerHTML = '';

    prizes.forEach((prize, index) => {
        const safeName = prize.name || '';
        const prizeItem = document.createElement('div');
        prizeItem.className = 'prize-item';
        prizeItem.innerHTML = `
            <div class="prize-color" style="background-color: ${prize.color};"></div>
            <div class="prize-name">${safeName}</div>
            <div class="prize-image-row">
                <input class="prize-image-input" type="file" accept="image/*" onchange="updatePrizeImageFile(${index}, this)">
                <button type="button" class="btn-image-clear" onclick="clearPrizeImage(${index})">ลบรูป</button>
            </div>
            ${prize.image ? `<img class="prize-image-preview" src="${prize.image}" alt="${safeName}">` : ''}
            <div class="prize-bg-toggle">
                <label><input type="checkbox" ${prize.useImageBg ? 'checked' : ''} onchange="updateUseImageBg(${index}, this.checked)"> ใช้รูปเป็นพื้นหลังช่อง</label>
            </div>
            <div class="prize-odds">
                <label>อัตราชนะ (%):</label>
                <input type="number" min="0" step="0.01" max="100" value="${Number(prize.odds || 0).toFixed(2)}" onchange="updateOdds(${index}, this.value)">
            </div>
            <button class="btn-remove" onclick="removePrize(${index})">✕</button>
        `;
        prizeList.appendChild(prizeItem);
    });

    // Hard-sync guarantee select from the same prizes source used to render cards.
    const guaranteeSelect = document.getElementById('guaranteePrizeIndex');
    if (guaranteeSelect) {
        guaranteeSelect.innerHTML = '';
        if (Array.isArray(prizes) && prizes.length > 0) {
            prizes.forEach((prize, index) => {
                const option = document.createElement('option');
                option.value = String(index);
                option.textContent = `${index + 1}. ${prize.name || `รางวัล ${index + 1}`}`;
                guaranteeSelect.appendChild(option);
            });
            guaranteeSelect.disabled = false;
            if (guaranteePrizeName) {
                const byName = prizes.findIndex((p) => (p.name || '') === guaranteePrizeName);
                if (byName >= 0) guaranteePrizeIndex = byName;
            }
            if (!Number.isFinite(guaranteePrizeIndex) || guaranteePrizeIndex < 0 || guaranteePrizeIndex >= prizes.length) {
                guaranteePrizeIndex = 0;
            }
            guaranteeSelect.value = String(guaranteePrizeIndex);
        } else {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'ยังไม่มีรางวัล';
            guaranteeSelect.appendChild(emptyOption);
            guaranteeSelect.disabled = true;
        }
    }

    renderGuaranteeControls();
}

function renderGuaranteeControls() {
    const enabled = document.getElementById('guaranteeEnabled');
    const every = document.getElementById('guaranteeEvery');
    const prizeSelect = document.getElementById('guaranteePrizeIndex');
    const debugEl = document.getElementById('guaranteeDebug');
    if (!enabled || !every || !prizeSelect) return;

    enabled.checked = Boolean(guaranteeEnabled);
    every.value = guaranteeEvery || 20;

    prizeSelect.innerHTML = '';

    if (!Array.isArray(prizes) || prizes.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'ยังไม่มีรางวัล';
        prizeSelect.appendChild(emptyOption);
        prizeSelect.disabled = true;
        if (debugEl) debugEl.textContent = 'debug -> prizes:0';
        return;
    }

    prizeSelect.disabled = false;

    prizes.forEach((prize, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = `${index + 1}. ${prize.name || `รางวัล ${index + 1}`}`;
        prizeSelect.appendChild(option);
    });

    if (guaranteePrizeName) {
        const byName = prizes.findIndex((p) => (p.name || '') === guaranteePrizeName);
        if (byName >= 0) guaranteePrizeIndex = byName;
    }

    if (!Number.isFinite(guaranteePrizeIndex) || guaranteePrizeIndex < 0 || guaranteePrizeIndex >= prizes.length) {
        guaranteePrizeIndex = 0;
    }

    prizeSelect.value = String(guaranteePrizeIndex);

    if (debugEl) {
        debugEl.textContent = `debug -> prizes:${prizes.length}, selected:${guaranteePrizeIndex}`;
    }
}

// ===== WHEEL RENDERING FOR PREVIEW =====
function renderAdminWheel() {
    const wheel = document.getElementById('previewWheel');
    if (!wheel) return;

    wheel.innerHTML = '';

    const segmentCount = prizes.length;
    if (segmentCount <= 0) {
        wheel.innerHTML = '<div style="color: white; text-align: center;">ยังไม่มีรางวัล</div>';
        return;
    }

    const segmentDegrees = 360 / segmentCount;

    let conicStops = [];
    let currentDegree = 0;

    prizes.forEach((prize) => {
        conicStops.push(`${prize.color} ${currentDegree}deg ${currentDegree + segmentDegrees}deg`);
        currentDegree += segmentDegrees;
    });

    wheel.style.background = `conic-gradient(from 0deg, ${conicStops.join(', ')})`;
    wheel.style.setProperty('--segment-image-size', `${prizeImageSize}px`);
    wheel.style.border = '8px solid white';
    wheel.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.2), 0 10px 40px rgba(0, 0, 0, 0.3)';

    currentDegree = 0;
    prizes.forEach((prize) => {
        if (prize.image && prize.useImageBg) {
            const seg = document.createElement('div');
            seg.className = 'segment-bg-image';
            seg.style.backgroundImage = `url("${prize.image}")`;
            seg.style.setProperty('--start', `${currentDegree}deg`);
            seg.style.setProperty('--end', `${currentDegree + segmentDegrees}deg`);
            wheel.appendChild(seg);
        }
        currentDegree += segmentDegrees;
    });

    currentDegree = 0;
    prizes.forEach((prize, index) => {
        const midDegree = currentDegree + segmentDegrees / 2;
        const textAngle = midDegree - 90;

        const numberDiv = document.createElement('div');
        numberDiv.className = 'number';
        numberDiv.style.setProperty('--i', index + 1);
        numberDiv.style.setProperty('--angle', `${textAngle}deg`);
        numberDiv.style.transform = `rotate(${textAngle}deg)`;

        const content = document.createElement('div');
        content.className = 'segment-content';
        content.style.transform = `translateX(var(--label-radius, 130px)) rotate(${-textAngle}deg)`;

        if (prize.image) {
            const img = document.createElement('img');
            img.className = 'segment-image';
            img.src = prize.image;
            img.alt = prize.name || `Prize ${index + 1}`;
            img.onerror = () => { img.remove(); };
            content.appendChild(img);
        }

        const span = document.createElement('span');
        span.textContent = prize.name || `รางวัล ${index + 1}`;
        content.appendChild(span);

        numberDiv.appendChild(content);
        wheel.appendChild(numberDiv);

        currentDegree += segmentDegrees;
    });
}

// ===== STATISTICS =====
function updateStats() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;

    const totalOdds = getTotalOdds();

    let statsHtml = '<div class="stats-table">';
    statsHtml += '<div class="stats-row header">';
    statsHtml += '<div>รางวัล</div><div>อัตราชนะ (%)</div><div>สถานะ</div>';
    statsHtml += '</div>';

    prizes.forEach((prize, index) => {
        const odds = parseFloat(prize.odds || 0);
        const winRatePercent = odds.toFixed(2) + '%';
        const status = odds > 0 ? 'ใช้งาน' : 'ไม่ใช้งาน';
        const rowClass = odds === 0 ? 'inactive' : '';

        statsHtml += `<div class="stats-row ${rowClass}">`;
        statsHtml += `<div>${prize.name || `รางวัล ${index + 1}`}</div>`;
        statsHtml += `<div>${winRatePercent}</div>`;
        statsHtml += `<div>${status}</div>`;
        statsHtml += '</div>';
    });

    statsHtml += '</div>';
    const totalClass = Math.abs(totalOdds - 100) <= 0.0001 ? 'ok' : 'warning';
    statsHtml += `<div class="stats-footer ${totalClass}">รวมเปอร์เซ็นต์: ${totalOdds.toFixed(2)}% (ต้องเท่ากับ 100%)</div>`;

    statsContent.innerHTML = statsHtml;
}
