// ===== SHARED STATE MANAGEMENT =====
const STORAGE_KEY = 'wheelSettings';

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
let currentRotation = 0;

function generateUniqueColor(index, total) {
    const hue = Math.round((index * (360 / Math.max(total, 1))) % 360);
    return `hsl(${hue} 82% 66%)`;
}

function applyUniquePrizeColors() {
    const total = prizes.length;
    prizes = prizes.map((prize, index) => ({
        ...prize,
        color: generateUniqueColor(index, total)
    }));
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        prizes = data.prizes || prizes;
        spinSpeed = data.spinSpeed || 5;
    }
    applyUniquePrizeColors();
}

function saveSettings(showAlert = true) {
    const data = {
        prizes: prizes,
        spinSpeed: spinSpeed,
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
    const minPlayableOdds = 1;
    const eligibleTotal = prizes.reduce((sum, prize) => {
        const odds = parseFloat(prize.odds || 0);
        return odds >= minPlayableOdds ? sum + odds : sum;
    }, 0);
    if (eligibleTotal <= 0) return 0;
    
    let random = Math.random() * eligibleTotal;
    
    for (let i = 0; i < prizes.length; i++) {
        const odds = parseFloat(prizes[i].odds || 0);
        if (odds < minPlayableOdds) continue;

        random -= odds;
        if (random <= 0) {
            return i;
        }
    }

    for (let i = 0; i < prizes.length; i++) {
        if (parseFloat(prizes[i].odds || 0) >= minPlayableOdds) return i;
    }

    return 0;
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
        odds: 1
    });
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
    const odds = parseFloat(value) || 0;
    if (odds < 0) prizes[index].odds = 0;
    else prizes[index].odds = odds;
    
    // Auto-save to localStorage
    saveSettings();
    
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

function updateSpeed() {
    const speedInput = document.getElementById('spinSpeed');
    const speedValue = document.getElementById('speedValue');
    
    spinSpeed = parseInt(speedInput.value);
    speedValue.textContent = spinSpeed;
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
        applyUniquePrizeColors();

        spinSpeed = 5;
        currentRotation = 0;

        const speedInput = document.getElementById('spinSpeed');
        const speedValue = document.getElementById('speedValue');

        speedInput.value = 5;
        speedValue.textContent = '5';

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
