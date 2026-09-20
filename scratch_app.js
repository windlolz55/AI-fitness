window.completeAllWorkouts = function() {
    if (!dailyData[selectedLogDate] || !dailyData[selectedLogDate].workouts || dailyData[selectedLogDate].workouts.length === 0) {
        alert("今日尚無訓練紀錄！");
        return;
    }
    
    const loggedWorkouts = dailyData[selectedLogDate].workouts;
    const getCompletedStatus = (ex) => ex.completed === undefined ? true : ex.completed;
    
    let allCompleted = loggedWorkouts.every(w => getCompletedStatus(w));
    
    if (allCompleted) {
        loggedWorkouts.forEach(w => w.completed = false);
    } else {
        loggedWorkouts.forEach(w => w.completed = true);
    }
    
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    renderWorkout();
    if (typeof updateDashboard === 'function') updateDashboard();
};

window.toggleAllCardio = function() {
    if (!dailyData[selectedLogDate] || !dailyData[selectedLogDate].workouts || dailyData[selectedLogDate].workouts.length === 0) {
        return;
    }
    
    const loggedWorkouts = dailyData[selectedLogDate].workouts;
    const cardios = loggedWorkouts.filter(ex => ex.type === 'cardio');
    if (cardios.length === 0) return;
    
    const getCompletedStatus = (ex) => ex.completed === undefined ? true : ex.completed;
    let allLogged = cardios.every(w => getCompletedStatus(w));
    
    if (allLogged) {
        cardios.forEach(w => w.completed = false);
    } else {
        cardios.forEach(w => w.completed = true);
    }
    
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    renderWorkout();
    if (typeof updateDashboard === 'function') updateDashboard();
};

function renderWorkout() {
    const container = document.getElementById('workout-list-container');
    if (!container) return;
    
    const d = new Date(selectedLogDate);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    
    const titleEl = document.getElementById('workout-day-title');
    if (titleEl) {
        titleEl.innerText = `${m}/${dt} (星期${days[d.getDay()]}) - 運動紀錄`;
    }
    
    const dailyDataEntry = dailyData[selectedLogDate] || {};
    const loggedWorkouts = dailyDataEntry.workouts || [];
    
    let html = '';
    
    if (loggedWorkouts.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 16px;">📝</div>
                <h3 style="margin-bottom: 8px;">今天還沒有課表</h3>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">從範本庫套用，或自己新增動作吧！</p>
                <button class="btn-primary" style="padding: 12px 24px; border-radius: 12px; font-weight: bold;" onclick="openTemplateSelector()">
                    <i class="fa-solid fa-folder-open" style="margin-right: 8px;"></i> 套用課表範本
                </button>
            </div>
        `;
        
        const completeAllText = document.getElementById('complete-all-text');
        if (completeAllText) completeAllText.parentElement.style.display = 'none';
        
        return;
    }
    
    const nonCardio = loggedWorkouts.filter(ex => ex.type !== 'cardio');
    const cardios = loggedWorkouts.filter(ex => ex.type === 'cardio');
    
    nonCardio.forEach((ex, idx) => {
        let isCompleted = ex.completed === undefined ? true : ex.completed;
        
        let statusHtml = `<div style="font-size: 12px; color: ${isCompleted ? 'var(--accent-secondary)' : 'var(--text-muted)'}; margin-top: 4px;">
            ${isCompleted ? '<i class="fa-solid fa-check"></i> ' : '目標: '}${ex.weight > 0 ? ex.weight + 'kg, ' : ''}${ex.sets}組, ${ex.reps}
        </div>`;
        
        let icon = ex.type === 'time' ? 'fa-stopwatch' : 'fa-dumbbell';
        
        html += `
            <div class="card log-item" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 16px; flex: 1; cursor: pointer; min-width: 0;" onclick="openWorkoutModal('${ex.name}')">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-main); flex-shrink: 0;">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ex.name}</div>
                        ${statusHtml}
                    </div>
                </div>
                <div style="font-size: 28px; color: ${isCompleted ? 'var(--accent-secondary)' : 'var(--card-border)'}; padding: 8px 0 8px 16px; cursor: pointer;" onclick="toggleWorkoutCheck('${ex.name}')">
                    <i class="fa-${isCompleted ? 'solid' : 'regular'} fa-circle-check"></i>
                </div>
            </div>
        `;
    });
    
    if (cardios.length > 0) {
        let allCardioCompleted = true;
        
        cardios.forEach(ex => {
            if (ex.completed === false) allCardioCompleted = false;
        });
        
        let cardioSubHtml = '';
        cardios.forEach(ex => {
            let isCompleted = ex.completed === undefined ? true : ex.completed;
            let statusHtml = `<div style="font-size: 10px; color: ${isCompleted ? 'var(--accent-secondary)' : 'var(--text-muted)'}; margin-top: 4px;">
                ${isCompleted ? '<i class="fa-solid fa-check"></i> ' : ''}${ex.sets}組 ${ex.reps}
            </div>`;
            
            cardioSubHtml += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--card-border);">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer;" onclick="event.stopPropagation(); openWorkoutModal('${ex.name}')">
                        <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--text-main);">
                            <i class="fa-solid fa-person-running"></i>
                        </div>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">${ex.name}</div>
                            ${statusHtml}
                        </div>
                    </div>
                    <div style="font-size: 24px; color: ${isCompleted ? 'var(--accent-secondary)' : 'var(--card-border)'}; cursor: pointer; padding: 4px;" onclick="event.stopPropagation(); toggleWorkoutCheck('${ex.name}')">
                        <i class="fa-${isCompleted ? 'solid' : 'regular'} fa-circle-check"></i>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="card log-item" style="padding: 16px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; cursor: pointer;" onclick="toggleAllCardio()">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(255, 107, 129, 0.1); color: #ff6b81; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                            <i class="fa-solid fa-heart-pulse"></i>
                        </div>
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600;">有氧運動</h4>
                    </div>
                    <div style="font-size: 24px; color: ${allCardioCompleted ? 'var(--accent-secondary)' : 'var(--card-border)'};">
                        <i class="fa-${allCardioCompleted ? 'solid' : 'regular'} fa-circle-check"></i>
                    </div>
                </div>
                ${cardioSubHtml}
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    const completeAllText = document.getElementById('complete-all-text');
    const completeAllIcon = document.getElementById('complete-all-icon');
    if (completeAllText && completeAllIcon) {
        const btn = completeAllText.parentElement;
        btn.style.display = 'flex';
        
        let allCompleted = loggedWorkouts.length > 0 && loggedWorkouts.every(w => w.completed !== false);
        
        if (allCompleted) {
            completeAllText.innerText = "今日已完成";
            completeAllIcon.className = "fa-solid fa-circle-check";
            btn.style.background = "var(--accent-primary)";
            btn.style.color = "var(--bg-main)";
        } else {
            completeAllText.innerText = "今日全完成";
            completeAllIcon.className = "fa-regular fa-circle-check";
            btn.style.background = "rgba(29, 209, 161, 0.1)";
            btn.style.color = "var(--accent-primary)";
        }
    }
}

function toggleWorkoutCheck(name) {
    if (!dailyData[selectedLogDate] || !dailyData[selectedLogDate].workouts) return;
    
    let workouts = dailyData[selectedLogDate].workouts;
    const existingIdx = workouts.findIndex(w => w.name === name);
    
    if (existingIdx >= 0) {
        if (workouts[existingIdx].completed === undefined) {
            workouts[existingIdx].completed = false; // default is true for old ones, so flip to false
        } else {
            workouts[existingIdx].completed = !workouts[existingIdx].completed;
        }
        
        setAndSync('fitness_daily', JSON.stringify(dailyData));
        renderWorkout();
        if (typeof updateDashboard === 'function') updateDashboard();
    }
}

function openWorkoutModal(name) {
    document.getElementById('workout-index-val').value = 0; // dummy value
    document.getElementById('workout-name-val').value = name;
    document.getElementById('workout-modal-title').innerText = name;
    
    document.getElementById('workout-modal-title').style.display = 'block';
    document.getElementById('workout-custom-name-container').style.display = 'none';
    document.getElementById('workout-custom-type-container').style.display = 'none';
    
    const dailyDataEntry = dailyData[selectedLogDate] || {};
    const loggedWorkouts = dailyDataEntry.workouts || [];
    const logged = loggedWorkouts.find(w => w.name === name);
    
    const btnDelete = document.getElementById('btn-delete-workout');
    if (logged) {
        btnDelete.style.display = 'block';
        btnDelete.onclick = function() { deleteWorkoutRecord(name); };
    } else {
        btnDelete.style.display = 'none';
    }
    
    document.getElementById('workout-weight-val').value = logged ? logged.weight : '';
    document.getElementById('workout-sets-val').value = logged ? logged.sets : '';
    document.getElementById('workout-reps-val').value = logged ? logged.reps : '';
    
    let exType = logged ? logged.type : 'weight';
    if (!exType && logged && logged.weight === 0) {
        exType = 'cardio';
    }
    
    if (exType === 'cardio' || exType === 'bodyweight' || exType === 'time') {
        document.getElementById('workout-weight-container').style.display = 'none';
    } else {
        document.getElementById('workout-weight-container').style.display = 'block';
    }
    
    const lastRecordEl = document.getElementById('workout-modal-last-record');
    let lastRecord = null;
    let daysToCheck = 30;
    let curD = new Date(selectedLogDate);
    for (let i=1; i<=daysToCheck; i++) {
        curD.setDate(curD.getDate() - 1);
        let checkDateStr = curD.toLocaleDateString('en-CA');
        if (dailyData[checkDateStr] && dailyData[checkDateStr].workouts) {
            let found = dailyData[checkDateStr].workouts.find(w => w.name === name);
            if (found) {
                lastRecord = found;
                break;
            }
        }
    }
    
    if (lastRecord) {
        lastRecordEl.innerText = `上次紀錄: ${lastRecord.weight > 0 ? lastRecord.weight + 'kg, ' : ''}${lastRecord.sets}組, ${lastRecord.reps}`;
        lastRecordEl.style.display = 'block';
    } else {
        lastRecordEl.style.display = 'none';
    }
    
    const btnSave = document.getElementById('btn-save-workout');
    btnSave.innerText = '儲存';
    
    document.getElementById('workout-update-template-container').style.display = 'none';
    document.getElementById('workout-setup-modal').style.display = 'flex';
}

function confirmWorkoutEdit() {
    let name = document.getElementById('workout-name-val').value;
    const idx = parseInt(document.getElementById('workout-index-val').value);
    
    const weight = parseFloat(document.getElementById('workout-weight-val').value) || 0;
    const sets = parseInt(document.getElementById('workout-sets-val').value) || 0;
    const reps = document.getElementById('workout-reps-val').value.trim();
    
    if (idx === -1) {
        name = document.getElementById('workout-custom-name-val').value.trim();
        if (!name) {
            alert("請輸入動作名稱");
            return;
        }
    }
    
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
    }
    if (!dailyData[selectedLogDate].workouts) {
        dailyData[selectedLogDate].workouts = [];
    }
    
    let workouts = dailyData[selectedLogDate].workouts;
    const existingIdx = workouts.findIndex(w => w.name === name);
    
    if (existingIdx >= 0) {
        workouts[existingIdx] = { ...workouts[existingIdx], name: name, weight: weight, sets: sets, reps: reps };
    } else {
        const customType = document.getElementById('workout-custom-type-val').value || 'weight';
        workouts.push({ name: name, type: customType, weight: weight, sets: sets, reps: reps, completed: true });
    }
    
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    renderWorkout();
    
    closeWorkoutModal();
}

function deleteWorkoutRecord(name) {
    if (confirm(`確定要將「${name}」從今日課表中刪除嗎？`)) {
        if (dailyData[selectedLogDate] && dailyData[selectedLogDate].workouts) {
            dailyData[selectedLogDate].workouts = dailyData[selectedLogDate].workouts.filter(w => w.name !== name);
            setAndSync('fitness_daily', JSON.stringify(dailyData));
            renderWorkout();
        }
    } else {
        return;
    }
    
    closeWorkoutModal();
}
