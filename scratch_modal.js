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
        lastRecordEl.innerText = '上次紀錄: ' + (lastRecord.weight > 0 ? lastRecord.weight + 'kg, ' : '') + lastRecord.sets + '組, ' + lastRecord.reps;
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
    if (confirm('確定要將「' + name + '」從今日課表中刪除嗎？')) {
        if (dailyData[selectedLogDate] && dailyData[selectedLogDate].workouts) {
            dailyData[selectedLogDate].workouts = dailyData[selectedLogDate].workouts.filter(w => w.name !== name);
            setAndSync('fitness_daily', JSON.stringify(dailyData));
        }
    } else {
        return;
    }
    
    closeWorkoutModal();
}
