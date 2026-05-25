// ===== SHARED STATE MANAGEMENT =====
const STORAGE_KEY = 'wheelSettings';

let prizes = [
    { name: '100 ฿', color: '#ff6b6b', odds: 1, image: "", useImageBg: false },
    { name: '50 ฿', color: '#4ecdc4', odds: 1, image: "", useImageBg: false },
    { name: '1000 ฿', color: '#ffe66d', odds: 1, image: "", useImageBg: false },
    { name: '20 ฿', color: '#a8e6cf', odds: 1, image: "", useImageBg: false },
    { name: '10 ฿', color: '#ff8787', odds: 1, image: "", useImageBg: false },
    { name: '500 ฿', color: '#74b9ff', odds: 1, image: "", useImageBg: false },
    { name: '5 ฿', color: '#fd79a8', odds: 1, image: "", useImageBg: false },
    { name: '200 ฿', color: '#fdcb6e', odds: 1, image: "", useImageBg: false },
];

let spinSpeed = 5;
let currentRotation = 0;
let prizeImageSize = 64;
let spinCounter = 0;
let guaranteeEnabled = false;
let guaranteeEvery = 20;
let guaranteePrizeIndex = 0;
let guaranteePrizeName = '';
let guaranteeOddsSnapshot = null;
const PERCENT_TOTAL = 100;

function generateUniqueColor(index, total) {
    const hue = Math.round((index * (360 / Math.max(total, 1))) % 360);
    return `hsl(${hue} 82% 66%)`;
}

function applyUniquePrizeColors() {
    const total = prizes.length;
    prizes = prizes.map((prize, index) => ({
        ...prize,
        color: generateUniqueColor(index, total),
        image: prize.image || "",
        useImageBg: Boolean(prize.useImageBg)
    }));
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        prizes = data.prizes || prizes;
        spinSpeed = data.spinSpeed || 5;
        prizeImageSize = data.prizeImageSize || 64;
        spinCounter = Number.isFinite(data.spinCounter) ? data.spinCounter : 0;
        guaranteeEnabled = Boolean(data.guaranteeEnabled);
        guaranteeEvery = Math.max(1, parseInt(data.guaranteeEvery, 10) || 20);
        guaranteePrizeIndex = Number.isFinite(data.guaranteePrizeIndex) ? data.guaranteePrizeIndex : 0;
        guaranteePrizeName = typeof data.guaranteePrizeName === 'string' ? data.guaranteePrizeName : '';
    }
    applyUniquePrizeColors();
}

function saveSettings(showAlert = true) {
    const data = {
        prizes: prizes,
        spinSpeed: spinSpeed,
        prizeImageSize: prizeImageSize,
        spinCounter: spinCounter,
        guaranteeEnabled: guaranteeEnabled,
        guaranteeEvery: guaranteeEvery,
        guaranteePrizeIndex: guaranteePrizeIndex,
        guaranteePrizeName: guaranteePrizeName,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (showAlert) {
        alert('บันทึกตั้งค่าเรียบร้อย!');
    }
    
    // Broadcast change to other tabs/windows
    window.dispatchEvent(new CustomEvent('wheelSettingsChanged', { detail: data }));
}

// ===== PROBABILITY CALCULATION =====
function getTotalOdds() {
    return prizes.reduce((sum, prize) => sum + parseFloat(prize.odds || 0), 0);
}

function getWinnerByOdds() {
    let random = Math.random() * PERCENT_TOTAL;
    let cumulative = 0;

    for (let i = 0; i < prizes.length; i++) {
        const odds = Math.max(0, parseFloat(prizes[i].odds || 0));
        cumulative += odds;
        if (random < cumulative) return i;
    }

    for (let i = 0; i < prizes.length; i++) {
        if (parseFloat(prizes[i].odds || 0) > 0) return i;
    }
    return 0;
}

function getGuaranteedWinnerIndex() {
    if (!guaranteeEnabled) return -1;
    if (guaranteeEvery <= 0) return -1;
    if ((spinCounter + 1) !== guaranteeEvery) return -1;
    if (!Array.isArray(prizes) || prizes.length === 0) return -1;
    if (guaranteePrizeName) {
        const byName = prizes.findIndex((p) => (p.name || '') === guaranteePrizeName);
        if (byName >= 0) return byName;
    }
    const safeIndex = Math.max(0, Math.min(prizes.length - 1, parseInt(guaranteePrizeIndex, 10) || 0));
    return safeIndex;
}

function registerSpinResult() {
    spinCounter += 1;
    if (guaranteeEnabled && guaranteeEvery > 0 && spinCounter >= guaranteeEvery) {
        spinCounter = 0;
    }
    saveSettings(false);
}

function applyGuaranteedOddsForSpin(index) {
    if (!Array.isArray(prizes) || prizes.length === 0) return false;
    if (index < 0 || index >= prizes.length) return false;

    guaranteeOddsSnapshot = prizes.map((prize) => parseFloat(prize.odds || 0));
    prizes.forEach((prize, i) => {
        prize.odds = i === index ? 100 : 0;
    });
    saveSettings(false);
    return true;
}

function restoreOddsAfterGuaranteedSpin() {
    if (!Array.isArray(guaranteeOddsSnapshot) || guaranteeOddsSnapshot.length !== prizes.length) {
        guaranteeOddsSnapshot = null;
        return;
    }

    prizes.forEach((prize, i) => {
        prize.odds = Math.max(0, parseFloat(guaranteeOddsSnapshot[i] || 0));
    });
    guaranteeOddsSnapshot = null;
    saveSettings(false);
}

function updateGuaranteeSettings() {
    const enabledInput = document.getElementById('guaranteeEnabled');
    const everyInput = document.getElementById('guaranteeEvery');
    const prizeInput = document.getElementById('guaranteePrizeIndex');
    if (!enabledInput || !everyInput || !prizeInput) return;

    const prevEnabled = guaranteeEnabled;
    const prevEvery = guaranteeEvery;
    const prevPrizeIndex = guaranteePrizeIndex;
    const prevPrizeName = guaranteePrizeName;

    guaranteeEnabled = Boolean(enabledInput.checked);
    guaranteeEvery = Math.max(1, parseInt(everyInput.value, 10) || 20);
    guaranteePrizeIndex = Math.max(0, Math.min(prizes.length - 1, parseInt(prizeInput.value, 10) || 0));
    guaranteePrizeName = prizes[guaranteePrizeIndex] ? (prizes[guaranteePrizeIndex].name || '') : '';

    // Start a fresh counting cycle when guarantee config is changed.
    if (
        prevEnabled !== guaranteeEnabled ||
        prevEvery !== guaranteeEvery ||
        prevPrizeIndex !== guaranteePrizeIndex ||
        prevPrizeName !== guaranteePrizeName
    ) {
        spinCounter = 0;
    }

    saveSettings(false);
}

// ===== PRIZE MANAGEMENT =====
function addPrize() {
    const prizeInput = document.getElementById('prizeInput');
    
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
        color: '#000000',
        odds: 1, image: "" });
    applyUniquePrizeColors();

    prizeInput.value = '';

    saveSettings(false);

    if (typeof renderAdminWheel === 'function') {
        renderAdminWheel();
    }
    if (typeof renderPrizeList === 'function') {
        renderPrizeList();
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Notify display page of changes
    if (typeof notifyDisplayPageOfChanges === 'function') {
        notifyDisplayPageOfChanges();
    }
}

function removePrize(index) {
    if (prizes.length <= 1) {
        alert('ต้องมีรางวัลอย่างน้อย 1 รางวัล');
        return;
    }

    prizes.splice(index, 1);
    applyUniquePrizeColors();
    
    saveSettings(false);
    
    if (typeof renderAdminWheel === 'function') {
        renderAdminWheel();
    }
    if (typeof renderPrizeList === 'function') {
        renderPrizeList();
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Notify display page of changes
    if (typeof notifyDisplayPageOfChanges === 'function') {
        notifyDisplayPageOfChanges();
    }
}

function updateOdds(index, value) {
    let newOdds = parseFloat(value);
    if (Number.isNaN(newOdds)) newOdds = 0;
    newOdds = Math.max(0, Math.min(100, newOdds));

    // Keep total percentage at 100 by auto-adjusting other prizes proportionally.
    const otherIndexes = prizes.map((_, i) => i).filter(i => i !== index);
    const otherTotal = otherIndexes.reduce((sum, i) => sum + Math.max(0, parseFloat(prizes[i].odds || 0)), 0);
    const remaining = Math.max(0, 100 - newOdds);

    prizes[index].odds = newOdds;

    if (otherIndexes.length > 0) {
        if (otherTotal > 0) {
            otherIndexes.forEach((i) => {
                const current = Math.max(0, parseFloat(prizes[i].odds || 0));
                prizes[i].odds = (current / otherTotal) * remaining;
            });
        } else {
            const even = remaining / otherIndexes.length;
            otherIndexes.forEach((i) => {
                prizes[i].odds = even;
            });
        }
    }
    
    // Auto-save to localStorage
    saveSettings();
    
    if (typeof renderPrizeList === 'function') {
        renderPrizeList();
    }
    if (typeof renderAdminWheel === 'function') {
        renderAdminWheel();
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Notify display page of changes
    if (typeof notifyDisplayPageOfChanges === 'function') {
        notifyDisplayPageOfChanges();
    }
}

function updatePrizeImage(index, value) {
    prizes[index].image = (value || '').trim();
    saveSettings(false);

    if (typeof renderAdminWheel === 'function') {
        renderAdminWheel();
    }
    if (typeof renderWheel === 'function') {
        renderWheel();
    }
}

function updatePrizeImageFile(index, input) {
    const file = input && input.files ? input.files[0] : null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพ');
        input.value = '';
        return;
    }

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        alert('ไฟล์รูปใหญ่เกินไป (สูงสุด 2MB)');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        updatePrizeImage(index, event.target.result || '');
        if (typeof renderPrizeList === 'function') {
            renderPrizeList();
        }
    };
    reader.readAsDataURL(file);
}

function clearPrizeImage(index) {
    updatePrizeImage(index, '');
    if (typeof renderPrizeList === 'function') {
        renderPrizeList();
    }
}

function updateUseImageBg(index, checked) {
    prizes[index].useImageBg = Boolean(checked);
    saveSettings(false);
    if (typeof renderPrizeList === 'function') renderPrizeList();
    if (typeof renderAdminWheel === 'function') renderAdminWheel();
    if (typeof renderWheel === 'function') renderWheel();
}

function updateSpeed() {
    const speedInput = document.getElementById('spinSpeed');
    const speedValue = document.getElementById('speedValue');
    
    spinSpeed = parseInt(speedInput.value);
    speedValue.textContent = spinSpeed;
}

function updateImageSize() {
    const imageSizeInput = document.getElementById('imageSize');
    const imageSizeValue = document.getElementById('imageSizeValue');
    if (!imageSizeInput || !imageSizeValue) return;

    prizeImageSize = parseInt(imageSizeInput.value, 10) || 64;
    imageSizeValue.textContent = prizeImageSize;

    saveSettings(false);

    if (typeof renderAdminWheel === 'function') renderAdminWheel();
    if (typeof renderWheel === 'function') renderWheel();
}

function resetWheel() {
    if (confirm('คุณต้องการรีเซ็ตวงล้อหรือไม่?')) {
        prizes = [
            { name: '100 ฿', color: '#ff6b6b', odds: 1, image: "" },
            { name: '50 ฿', color: '#4ecdc4', odds: 1, image: "" },
            { name: '1000 ฿', color: '#ffe66d', odds: 1, image: "" },
            { name: '20 ฿', color: '#a8e6cf', odds: 1, image: "" },
            { name: '10 ฿', color: '#ff8787', odds: 1, image: "" },
            { name: '500 ฿', color: '#74b9ff', odds: 1, image: "" },
            { name: '5 ฿', color: '#fd79a8', odds: 1, image: "" },
            { name: '200 ฿', color: '#fdcb6e', odds: 1, image: "" },
        ];
        applyUniquePrizeColors();

        spinSpeed = 5;
        prizeImageSize = 64;
        spinCounter = 0;
        guaranteeEnabled = false;
        guaranteeEvery = 20;
        guaranteePrizeIndex = 0;
        currentRotation = 0;

        const speedInput = document.getElementById('spinSpeed');
        const speedValue = document.getElementById('speedValue');

        speedInput.value = 5;
        speedValue.textContent = '5';

        const imageSizeInput = document.getElementById('imageSize');
        const imageSizeValue = document.getElementById('imageSizeValue');
        if (imageSizeInput && imageSizeValue) {
            imageSizeInput.value = 64;
            imageSizeValue.textContent = '64';
        }

        if (typeof renderAdminWheel === 'function') {
            renderAdminWheel();
        }
        if (typeof renderPrizeList === 'function') {
            renderPrizeList();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', loadSettings);

