// ========================
// Template System Logic
// ========================

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
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">尚無範本，請點下方按鈕建立。</p>';
        return;
    }
    
    container.innerHTML = FITNESS_TEMPLATES.map(t => {
        return <div class="card log-item" style="padding: 16px; margin-bottom: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;" onclick="applyTemplate('')">
            <div>
                <h4 style="margin: 0; font-size: 16px;"> + t.name + </h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">包含  + t.exercises.length +  個動作</p>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--card-border);"></i>
        </div>;
    }).join('');
}

window.applyTemplate = function(templateId) {
    const template = FITNESS_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
    }
    
    let workouts = dailyData[selectedLogDate].workouts || [];
    
    let added = 0;
    template.exercises.forEach(ex => {
        if (!workouts.find(w => w.name === ex.name)) {
            workouts.push({
                name: ex.name,
                type: ex.type,
                weight: ex.weight,
                sets: ex.sets,
                reps: ex.reps,
                completed: false
            });
            added++;
        }
    });
    
    dailyData[selectedLogDate].workouts = workouts;
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    
    closeTemplateSelector();
    renderWorkout();
    alert("成功套用範本！新增了 " + added + " 個動作。");
};

window.openTemplateManager = function() {
    closeTemplateSelector();
    renderTemplateManagerList();
    document.getElementById('template-manager-modal').style.display = 'flex';
};

window.closeTemplateManager = function() {
    document.getElementById('template-manager-modal').style.display = 'none';
};

function renderTemplateManagerList() {
    const container = document.getElementById('template-manager-list');
    if (FITNESS_TEMPLATES.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">尚無範本，請點右上角按鈕建立。</p>';
        return;
    }
    
    container.innerHTML = FITNESS_TEMPLATES.map(t => {
        return <div class="card log-item" style="padding: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div style="flex: 1; cursor: pointer;" onclick="openTemplateEdit('')">
                <h4 style="margin: 0; font-size: 16px;"> + t.name + </h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);"> + t.exercises.length +  個動作</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="btn-icon" style="color: var(--accent-primary);" onclick="openTemplateEdit('')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon" style="color: #ff4757;" onclick="deleteTemplate('')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>;
    }).join('');
}

window.createNewTemplate = function() {
    const name = prompt("請輸入新範本名稱 (例如: 推腿日, 胸背日)");
    if (!name || name.trim() === '') return;
    
    const newTemplate = {
        id: 'tpl_' + Date.now(),
        name: name.trim(),
        exercises: []
    };
    
    FITNESS_TEMPLATES.push(newTemplate);
    setAndSync('fitness_templates', JSON.stringify(FITNESS_TEMPLATES));
    
    renderTemplateManagerList();
    openTemplateEdit(newTemplate.id);
};

window.deleteTemplate = function(id) {
    const t = FITNESS_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    if (confirm("確定要刪除範本「" + t.name + "」嗎？")) {
        FITNESS_TEMPLATES = FITNESS_TEMPLATES.filter(x => x.id !== id);
        setAndSync('fitness_templates', JSON.stringify(FITNESS_TEMPLATES));
        renderTemplateManagerList();
    }
};

let editingTemplateId = null;

window.openTemplateEdit = function(id) {
    editingTemplateId = id;
    const template = FITNESS_TEMPLATES.find(t => t.id === id);
    if (!template) return;
    
    document.getElementById('template-edit-title').value = template.name;
    document.getElementById('template-edit-id').value = id;
    
    renderTemplateEditExercises();
    
    document.getElementById('template-edit-modal').style.display = 'flex';
};

window.closeTemplateEdit = function() {
    editingTemplateId = null;
    document.getElementById('template-edit-modal').style.display = 'none';
};

window.saveTemplateEdit = function() {
    if (!editingTemplateId) return;
    const template = FITNESS_TEMPLATES.find(t => t.id === editingTemplateId);
    if (!template) return;
    
    const newName = document.getElementById('template-edit-title').value.trim();
    if (newName) template.name = newName;
    
    setAndSync('fitness_templates', JSON.stringify(FITNESS_TEMPLATES));
    closeTemplateEdit();
    renderTemplateManagerList();
};

function renderTemplateEditExercises() {
    const container = document.getElementById('template-edit-exercises');
    const template = FITNESS_TEMPLATES.find(t => t.id === editingTemplateId);
    if (!template) return;
    
    if (template.exercises.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">尚無動作，請點擊新增。</p>';
        return;
    }
    
    container.innerHTML = template.exercises.map((ex, idx) => {
        let icon = ex.weight > 0 ? 'fa-dumbbell' : 'fa-person-running';
        if (ex.type === 'cardio') icon = 'fa-heart-pulse';
        
        return <div class="card log-item" style="padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--text-main);">
                    <i class="fa-solid  + icon + "></i>
                </div>
                <div>
                    <div style="font-weight: 500; font-size: 15px;"> + ex.name + </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"> + ex.sets + 組  + ex.reps + (ex.weight > 0 ?  ( + ex.weight + kg) : '') + </div>
                </div>
            </div>
            <button class="btn-icon" style="color: #ff4757; font-size: 16px;" onclick="removeExerciseFromTemplate( + idx + )"><i class="fa-solid fa-trash"></i></button>
        </div>;
    }).join('');
}

window.removeExerciseFromTemplate = function(idx) {
    if (!editingTemplateId) return;
    const template = FITNESS_TEMPLATES.find(t => t.id === editingTemplateId);
    if (!template) return;
    
    if (confirm("確定移除「" + template.exercises[idx].name + "」嗎？")) {
        template.exercises.splice(idx, 1);
        renderTemplateEditExercises();
    }
};

window.openTemplateExerciseSelector = function() {
    window.exerciseLibraryContext = { type: 'template' };
    openExerciseLibrary();
};

// Override addExerciseToRoutine
window.addExerciseToRoutine = function(ex) {
    let targetType = 'daily';
    if (window.exerciseLibraryContext && window.exerciseLibraryContext.type) {
        targetType = window.exerciseLibraryContext.type;
    }
    
    if (targetType === 'template') {
        if (!editingTemplateId) return;
        const template = FITNESS_TEMPLATES.find(t => t.id === editingTemplateId);
        if (!template) return;
        
        const exists = template.exercises.find(e => e.name === ex.name);
        if (exists) {
            alert(ex.name + ' 已經在範本中囉！');
            return;
        }
        
        let defaultWeight = 0;
        let defaultSets = ex.defaultSets !== undefined ? ex.defaultSets : 4;
        let defaultReps = ex.defaultReps !== undefined ? ex.defaultReps : '10下';
        if (ex.type === 'time' && ex.defaultReps === undefined) defaultReps = '1分';
        if (ex.type === 'cardio' && ex.defaultReps === undefined) defaultReps = '30分';
        
        template.exercises.push({
            name: ex.name,
            type: ex.type,
            weight: defaultWeight,
            sets: defaultSets,
            reps: defaultReps
        });
        
        renderTemplateEditExercises();
        closeExerciseLibrary();
        
    } else {
        // Daily
        if (!confirm("確定要將「" + ex.name + "」加至今天的紀錄嗎？")) {
            return;
        }
        
        if (!dailyData[selectedLogDate]) {
            dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
        }
        if (!dailyData[selectedLogDate].workouts) {
            dailyData[selectedLogDate].workouts = [];
        }
        
        let workouts = dailyData[selectedLogDate].workouts;
        const exists = workouts.find(e => e.name === ex.name);
        if (exists) {
            alert(ex.name + ' 已經在今天的紀錄中囉！');
            return;
        }
        
        let defaultWeight = 0;
        let defaultSets = ex.defaultSets !== undefined ? ex.defaultSets : 4;
        let defaultReps = ex.defaultReps !== undefined ? ex.defaultReps : '10下';
        if (ex.type === 'time' && ex.defaultReps === undefined) defaultReps = '1分';
        if (ex.type === 'cardio' && ex.defaultReps === undefined) defaultReps = '30分';
        
        workouts.push({
            name: ex.name,
            type: ex.type,
            weight: defaultWeight,
            sets: defaultSets,
            reps: defaultReps,
            completed: false
        });
        
        setAndSync('fitness_daily', JSON.stringify(dailyData));
        renderWorkout();
        closeExerciseLibrary();
    }
};

// Clean up old window.exerciseLibraryContext when manually opening
const oldOpenExLib = window.openExerciseLibrary;
window.openExerciseLibrary = function() {
    if (document.getElementById('template-edit-modal').style.display === 'none') {
        window.exerciseLibraryContext = { type: 'daily' };
    }
    document.getElementById('exercise-library-modal').style.display = 'flex';
    switchExerciseTab('weight');
};

