// ===== ADMIN PAGE STATE =====

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    renderPrizeList();
    renderAdminWheel();
    updateStats();
});

// Listen for manual save button
function savePrizeSettings() {
    saveSettings(true);
    // Update preview
    renderAdminWheel();
    updateStats();
}

// ===== PRIZE LIST RENDERING =====
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
                <label>อัตรา:</label>
                <input type="number" min="0" step="0.1" max="1000" value="${prize.odds}" 
                       onchange="updateOdds(${index}, this.value)">
            </div>
            <button class="btn-remove" onclick="removePrize(${index})">✕</button>
        `;
        prizeList.appendChild(prizeItem);
    });
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

// ===== STATISTICS =====
function updateStats() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;

    const totalOdds = getTotalOdds();
    
    let statsHtml = '<div class="stats-table">';
    statsHtml += '<div class="stats-row header">';
    statsHtml += '<div>รางวัล</div><div>อัตรา</div><div>ความน่าจะเป็น</div>';
    statsHtml += '</div>';

    prizes.forEach((prize) => {
        const odds = parseFloat(prize.odds || 0);
        let probability = '-';
        
        if (odds > 0 && totalOdds > 0) {
            probability = ((odds / totalOdds) * 100).toFixed(2) + '%';
        } else if (odds === 0) {
            probability = 'ไม่ใช้';
        }
        
        const rowClass = odds === 0 ? 'inactive' : '';
        statsHtml += `<div class="stats-row ${rowClass}">`;
        statsHtml += `<div>${prize.name}</div>`;
        statsHtml += `<div>${odds}</div>`;
        statsHtml += `<div>${probability}</div>`;
        statsHtml += '</div>';
    });

    statsHtml += '</div>';
    statsHtml += `<div class="stats-footer">รวมอัตราส่วน: ${totalOdds.toFixed(2)}</div>`;
    
    statsContent.innerHTML = statsHtml;
}
