// ========================
// Template System Logic
// ========================
window.FITNESS_TEMPLATES = [];
try {
    const stored = localStorage.getItem('fitness_templates');
    if (stored) {
        window.FITNESS_TEMPLATES = JSON.parse(stored);
    }
} catch (e) {
    console.error("Failed to load templates", e);
}

window.openTemplateSelector = function() {
    renderTemplateSelector();
    document.getElementById('template-selector-modal').style.display = 'flex';
};

window.closeTemplateSelector = function() {
    document.getElementById('template-selector-modal').style.display = 'none';
};

function renderTemplateSelector() {
    const container = document.getElementById('template-list-container');
    if (FITNESS_TEMPLATES.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">尚無範本，請先建立。</p>';
        return;
    }
    
    let html = '';
    FITNESS_TEMPLATES.forEach((tpl, idx) => {
        let tagsHtml = '';
        if (tpl.tags && tpl.tags.length > 0) {
            tagsHtml = tpl.tags.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 10px; color: var(--text-muted);">${t}</span>`).join('');
        }
        
        html += `
            <div class="card log-item" style="padding: 16px; margin-bottom: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;" onclick="applyTemplate(${idx})">
                <div>
                    <h4 style="margin: 0; font-size: 16px;">${tpl.title}</h4>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">${tpl.exercises.length} 個動作</p>
                    <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
                        ${tagsHtml}
                    </div>
                </div>
                <div style="color: var(--accent-primary); font-size: 20px;">
                    <i class="fa-solid fa-download"></i>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.applyTemplate = function(idx) {
    const tpl = FITNESS_TEMPLATES[idx];
    if (!tpl) return;
    
    if (confirm(`確定要將「${tpl.title}」的動作套用至今日嗎？\n(這會將動作追加到今日清單)`)) {
        if (!dailyData[selectedLogDate]) {
            dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
        }
        if (!dailyData[selectedLogDate].workouts) {
            dailyData[selectedLogDate].workouts = [];
        }
        
        let addedCount = 0;
        tpl.exercises.forEach(ex => {
            const alreadyExists = dailyData[selectedLogDate].workouts.find(w => w.name === ex.name);
            if (!alreadyExists) {
                dailyData[selectedLogDate].workouts.push({
                    name: ex.name,
                    type: ex.type || 'weight',
                    weight: ex.weight || 0,
                    sets: ex.sets || 0,
                    reps: ex.reps || '',
                    completed: false
                });
                addedCount++;
            }
        });
        
        setAndSync('fitness_daily', JSON.stringify(dailyData));
        
        if (typeof renderWorkout === 'function') renderWorkout();
        if (typeof updateDashboard === 'function') updateDashboard();
        
        closeTemplateSelector();
        alert(`已成功追加 ${addedCount} 個動作至今日課表！`);
    }
};

window.openTemplateManager = function() {
    renderTemplateManager();
    document.getElementById('template-manager-modal').style.display = 'flex';
};

window.closeTemplateManager = function() {
    document.getElementById('template-manager-modal').style.display = 'none';
};

function renderTemplateManager() {
    const container = document.getElementById('template-manager-list');
    
    if (FITNESS_TEMPLATES.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <p style="color: var(--text-muted);">目前沒有任何課表範本</p>
                <button class="btn-primary" style="margin-top: 16px; padding: 12px 24px; border-radius: 12px;" onclick="openTemplateEditor(-1)">
                    <i class="fa-solid fa-plus"></i> 新增第一個範本
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    FITNESS_TEMPLATES.forEach((tpl, idx) => {
        let tagsHtml = '';
        if (tpl.tags && tpl.tags.length > 0) {
            tagsHtml = tpl.tags.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 10px; color: var(--text-muted);">${t}</span>`).join('');
        }
        
        html += `
            <div class="card log-item" style="padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1; cursor: pointer;" onclick="openTemplateEditor(${idx})">
                    <h4 style="margin: 0; font-size: 16px;">${tpl.title}</h4>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">${tpl.exercises.length} 個動作</p>
                    <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
                        ${tagsHtml}
                    </div>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="color: var(--text-muted); cursor: pointer; padding: 8px;" onclick="openTemplateEditor(${idx})">
                        <i class="fa-solid fa-pen"></i>
                    </div>
                    <div style="color: #ff6b81; cursor: pointer; padding: 8px;" onclick="deleteTemplate(${idx})">
                        <i class="fa-solid fa-trash"></i>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <button class="btn-secondary" style="width: 100%; padding: 16px; border-radius: 12px; margin-top: 16px;" onclick="openTemplateEditor(-1)">
            <i class="fa-solid fa-plus" style="color: var(--accent-primary);"></i> 新增課表範本
        </button>
    `;
    
    container.innerHTML = html;
}

window.deleteTemplate = function(idx) {
    const tpl = FITNESS_TEMPLATES[idx];
    if (confirm(`確定要刪除範本「${tpl.title}」嗎？\n(這不會影響已記錄在歷史中的資料)`)) {
        FITNESS_TEMPLATES.splice(idx, 1);
        setAndSync('fitness_templates', JSON.stringify(FITNESS_TEMPLATES));
        renderTemplateManager();
    }
};

window.openTemplateEditor = function(idx) {
    document.getElementById('template-edit-idx').value = idx;
    const container = document.getElementById('template-edit-exercises');
    container.innerHTML = '';
    
    if (idx === -1) {
        document.getElementById('template-edit-title').value = '新課表範本';
        document.getElementById('template-edit-tags').value = '';
        document.getElementById('template-editor-modal-title').innerText = '新增課表範本';
    } else {
        const tpl = FITNESS_TEMPLATES[idx];
        document.getElementById('template-edit-title').value = tpl.title;
        document.getElementById('template-edit-tags').value = (tpl.tags || []).join(', ');
        document.getElementById('template-editor-modal-title').innerText = '編輯範本';
        
        tpl.exercises.forEach((ex, exIdx) => {
            appendExerciseToEditor(ex, exIdx);
        });
    }
    
    document.getElementById('template-editor-modal').style.display = 'flex';
};

window.closeTemplateEditor = function() {
    document.getElementById('template-editor-modal').style.display = 'none';
};

window.saveTemplate = function() {
    const idx = parseInt(document.getElementById('template-edit-idx').value);
    const title = document.getElementById('template-edit-title').value.trim();
    const tagsStr = document.getElementById('template-edit-tags').value.trim();
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
    
    if (!title) {
        alert("請輸入範本名稱");
        return;
    }
    
    const exercises = [];
    const exItems = document.querySelectorAll('.template-ex-item');
    exItems.forEach(item => {
        exercises.push({
            name: item.dataset.name,
            type: item.dataset.type,
            weight: parseFloat(item.querySelector('.ex-weight').value) || 0,
            sets: parseInt(item.querySelector('.ex-sets').value) || 0,
            reps: item.querySelector('.ex-reps').value.trim() || ''
        });
    });
    
    if (idx === -1) {
        FITNESS_TEMPLATES.push({
            title: title,
            tags: tags,
            exercises: exercises
        });
    } else {
        FITNESS_TEMPLATES[idx] = {
            title: title,
            tags: tags,
            exercises: exercises
        };
    }
    
    setAndSync('fitness_templates', JSON.stringify(FITNESS_TEMPLATES));
    closeTemplateEditor();
    renderTemplateManager();
};

function appendExerciseToEditor(ex, exIdx) {
    const container = document.getElementById('template-edit-exercises');
    const div = document.createElement('div');
    div.className = 'card log-item template-ex-item';
    div.style.padding = '12px';
    div.style.marginBottom = '8px';
    div.dataset.name = ex.name;
    div.dataset.type = ex.type;
    
    let isWeight = ex.type !== 'cardio' && ex.type !== 'bodyweight' && ex.type !== 'time';
    
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: bold; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px;" title="${ex.name}">${ex.name}</div>
            <div style="color: #ff6b81; cursor: pointer; padding: 4px; flex-shrink: 0;" onclick="this.parentElement.parentElement.remove()">
                <i class="fa-solid fa-times"></i>
            </div>
        </div>
        <div style="display: flex; gap: 8px;">
            <div style="flex: 1; visibility: ${isWeight ? 'visible' : 'hidden'};">
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">重量(kg)</div>
                <input type="number" class="ex-weight" value="${ex.weight || ''}" placeholder="0" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--bg-main); color: var(--text-main); font-size: 14px;">
            </div>
            <div style="flex: 1;">
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">組數</div>
                <input type="number" class="ex-sets" value="${ex.sets || ''}" placeholder="0" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--bg-main); color: var(--text-main); font-size: 14px;">
            </div>
            <div style="flex: 1;">
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">次數</div>
                <input type="text" class="ex-reps" value="${ex.reps || ''}" placeholder="0" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--card-border); background: var(--bg-main); color: var(--text-main); font-size: 14px;">
            </div>
        </div>
    `;
    container.appendChild(div);
}

// Exercise Library logic for adding to Templates OR daily routine
let currentExerciseTab = 'weight';
let exerciseLibraryTarget = 'daily'; // 'daily' or 'template'

window.switchExerciseTab = function(tab) {
    currentExerciseTab = tab;
    
    const btnWeight = document.getElementById('ex-tab-weight');
    const btnCardio = document.getElementById('ex-tab-cardio');
    
    if (tab === 'weight') {
        btnWeight.className = 'btn-primary';
        btnCardio.className = 'btn-secondary';
    } else {
        btnWeight.className = 'btn-secondary';
        btnCardio.className = 'btn-primary';
    }
    
    renderExerciseLibrary();
};

window.openExerciseLibrary = function(target = 'daily') {
    exerciseLibraryTarget = target;
    document.getElementById('exercise-library-modal').style.display = 'flex';
    renderExerciseLibrary();
};

window.closeExerciseLibrary = function() {
    document.getElementById('exercise-library-modal').style.display = 'none';
};

window.renderExerciseLibrary = function() {
    const container = document.getElementById('exercise-library-list');
    container.innerHTML = '';
    
    if (typeof EXERCISE_DB === 'undefined') {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">無法載入動作庫 (exercise_db.js 未載入)</p>';
        return;
    }
    
    const filteredDB = EXERCISE_DB.filter(cat => cat.tab === currentExerciseTab);
    
    filteredDB.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.style.marginBottom = '16px';
        
        const catTitle = document.createElement('h3');
        catTitle.style.fontSize = '14px';
        catTitle.style.color = 'var(--text-muted)';
        catTitle.style.marginBottom = '8px';
        catTitle.innerText = cat.category;
        catDiv.appendChild(catTitle);
        
        const exercisesContainer = document.createElement('div');
        exercisesContainer.style.display = 'flex';
        exercisesContainer.style.flexWrap = 'wrap';
        exercisesContainer.style.gap = '8px';
        
        cat.exercises.forEach(ex => {
            const pill = document.createElement('button');
            pill.className = 'btn-secondary';
            pill.style.padding = '8px 14px';
            pill.style.borderRadius = '20px';
            pill.style.fontSize = '13px';
            pill.style.display = 'flex';
            pill.style.alignItems = 'center';
            pill.style.gap = '6px';
            pill.style.border = '1px solid var(--card-border)';
            pill.style.background = 'var(--card-bg)';
            pill.innerHTML = `<i class="fa-solid fa-plus" style="color: var(--accent-primary);"></i> ${ex.name}`;
            pill.onclick = () => addExerciseAction(ex);
            exercisesContainer.appendChild(pill);
        });
        
        catDiv.appendChild(exercisesContainer);
        container.appendChild(catDiv);
    });
};

function addExerciseAction(ex) {
    if (exerciseLibraryTarget === 'template') {
        // Add to template editor
        appendExerciseToEditor(ex, 0);
        closeExerciseLibrary();
    } else {
        // Add directly to today's daily data
        if (confirm(`確定要將「${ex.name}」加入今日課表嗎？`)) {
            if (!dailyData[selectedLogDate]) {
                dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
            }
            if (!dailyData[selectedLogDate].workouts) {
                dailyData[selectedLogDate].workouts = [];
            }
            
            const existing = dailyData[selectedLogDate].workouts.find(w => w.name === ex.name);
            if (!existing) {
                dailyData[selectedLogDate].workouts.push({
                    name: ex.name,
                    type: ex.type || 'weight',
                    weight: ex.weight || 0,
                    sets: ex.sets || 0,
                    reps: ex.reps || '',
                    completed: false
                });
                setAndSync('fitness_daily', JSON.stringify(dailyData));
                if (typeof renderWorkout === 'function') renderWorkout();
            } else {
                alert('這個動作已經在今日課表中了！');
            }
            closeExerciseLibrary();
        }
    }
}
