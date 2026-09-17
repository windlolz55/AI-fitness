// Routine System Logic

window.openRoutinePlanManager = function() {
    document.getElementById('routine-plan-mode').value = fitnessRoutinePlan.mode || 'none';
    renderRoutinePlanSetup();
    document.getElementById('routine-plan-modal').style.display = 'flex';
};

window.closeRoutinePlanManager = function() {
    document.getElementById('routine-plan-modal').style.display = 'none';
};

function getTemplateOptionsHtml(selectedValue) {
    let options = `<option value="">-- 請選擇範本 --</option>`;
    if (window.FITNESS_TEMPLATES) {
        window.FITNESS_TEMPLATES.forEach((tpl, idx) => {
            const isSelected = (String(idx) === String(selectedValue)) ? 'selected' : '';
            options += `<option value="${idx}" ${isSelected}>${tpl.title}</option>`;
        });
    }
    return options;
}

window.renderRoutinePlanSetup = function() {
    const mode = document.getElementById('routine-plan-mode').value;
    const container = document.getElementById('routine-plan-setup-container');
    const schedule = fitnessRoutinePlan.schedule || {};
    
    let html = '';
    
    if (mode === 'none') {
        html = `<div class="card" style="padding: 16px; text-align: center; color: var(--text-muted);">
            目前無分化計畫。你可以隨時在「運動」分頁手動套用課表。
        </div>`;
    } 
    else if (mode === 'non-split') {
        html = `
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px; color: var(--accent-primary);">全身訓練 (週一、三、五)</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">適合新手，高頻率刺激全身肌肉，週二、四、六、日固定休息。</p>
                <label style="font-size: 12px; color: var(--text-muted);">選擇全身課表範本</label>
                <select id="routine-tpl-1" class="input-field">
                    ${getTemplateOptionsHtml(schedule['1'])}
                </select>
            </div>
        `;
    }
    else if (mode === 'two-split') {
        html = `
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px; color: var(--accent-primary);">雙分化 (一二、四五)</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">適合大眾，上下半身或推拉交替，週三、六、日固定休息。</p>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; color: var(--text-muted);">訓練 A (週一、週四)</label>
                    <select id="routine-tpl-A" class="input-field">
                        ${getTemplateOptionsHtml(schedule['A'])}
                    </select>
                </div>
                
                <div>
                    <label style="font-size: 12px; color: var(--text-muted);">訓練 B (週二、週五)</label>
                    <select id="routine-tpl-B" class="input-field">
                        ${getTemplateOptionsHtml(schedule['B'])}
                    </select>
                </div>
            </div>
        `;
    }
    else if (mode === 'three-split') {
        let startDate = fitnessRoutinePlan.cycleStartDate;
        if (!startDate) {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            startDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
        }
        
        html = `
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px; color: var(--accent-primary);">三分化 (做3休1)</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">4天一個循環，無縫接軌不卡星期幾。請依序設定推、拉、腿。</p>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; color: var(--text-muted);">循環起始日 (第1天)</label>
                    <input type="date" id="routine-start-date" class="input-field" value="${startDate}">
                    <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">系統會從這天開始算 4 天循環。若想重新開始，可隨時將它設回今天。</p>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; color: var(--text-muted);">第 1 天 (例如：背部)</label>
                    <select id="routine-tpl-1" class="input-field">
                        ${getTemplateOptionsHtml(schedule['1'])}
                    </select>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; color: var(--text-muted);">第 2 天 (例如：胸部)</label>
                    <select id="routine-tpl-2" class="input-field">
                        ${getTemplateOptionsHtml(schedule['2'])}
                    </select>
                </div>
                
                <div>
                    <label style="font-size: 12px; color: var(--text-muted);">第 3 天 (例如：腿部)</label>
                    <select id="routine-tpl-3" class="input-field">
                        ${getTemplateOptionsHtml(schedule['3'])}
                    </select>
                </div>
                
                <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center; color: var(--text-muted); font-size: 14px;">
                    第 4 天：固定休息 🎉
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
};

window.saveRoutinePlan = function() {
    const mode = document.getElementById('routine-plan-mode').value;
    const schedule = {};
    let cycleStartDate = null;
    
    if (mode === 'non-split') {
        const val = document.getElementById('routine-tpl-1').value;
        if (!val) return alert('請選擇全身課表範本！');
        schedule['1'] = val;
    } 
    else if (mode === 'two-split') {
        const valA = document.getElementById('routine-tpl-A').value;
        const valB = document.getElementById('routine-tpl-B').value;
        if (!valA || !valB) return alert('請完整選擇訓練 A 和 B 的範本！');
        schedule['A'] = valA;
        schedule['B'] = valB;
    }
    else if (mode === 'three-split') {
        const val1 = document.getElementById('routine-tpl-1').value;
        const val2 = document.getElementById('routine-tpl-2').value;
        const val3 = document.getElementById('routine-tpl-3').value;
        if (!val1 || !val2 || !val3) return alert('請完整選擇三天的範本！');
        schedule['1'] = val1;
        schedule['2'] = val2;
        schedule['3'] = val3;
        cycleStartDate = document.getElementById('routine-start-date').value;
        if (!cycleStartDate) return alert('請設定起始日！');
    }
    
    fitnessRoutinePlan = {
        mode: mode,
        schedule: schedule,
        cycleStartDate: cycleStartDate
    };
    
    if (typeof setAndSync === 'function') {
        setAndSync('fitness_routine_plan', JSON.stringify(fitnessRoutinePlan));
    }
    
    alert('分化訓練計畫儲存成功！');
    closeRoutinePlanManager();
    
    if (typeof renderWorkout === 'function') {
        renderWorkout();
    }
};

window.getTodayRoutineInfo = function(targetDateStr) {
    if (!fitnessRoutinePlan || fitnessRoutinePlan.mode === 'none') return null;
    
    const d = new Date(targetDateStr);
    const dayOfWeek = d.getDay();
    const mode = fitnessRoutinePlan.mode;
    const schedule = fitnessRoutinePlan.schedule || {};
    
    let templateIdx = null;
    
    if (mode === 'non-split') {
        if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
            templateIdx = schedule['1'];
        }
    } 
    else if (mode === 'two-split') {
        if (dayOfWeek === 1 || dayOfWeek === 4) {
            templateIdx = schedule['A'];
        } else if (dayOfWeek === 2 || dayOfWeek === 5) {
            templateIdx = schedule['B'];
        }
    } 
    else if (mode === 'three-split') {
        if (!fitnessRoutinePlan.cycleStartDate) return null;
        
        const start = new Date(fitnessRoutinePlan.cycleStartDate);
        start.setHours(0,0,0,0);
        const current = new Date(targetDateStr);
        current.setHours(0,0,0,0);
        
        const diffTime = current - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return null;
        }
        
        const dayInCycle = (diffDays % 4) + 1;
        
        if (dayInCycle >= 1 && dayInCycle <= 3) {
            templateIdx = schedule[String(dayInCycle)];
        }
    }
    
    if (templateIdx !== null && window.FITNESS_TEMPLATES && window.FITNESS_TEMPLATES[templateIdx]) {
        return {
            idx: templateIdx,
            template: window.FITNESS_TEMPLATES[templateIdx]
        };
    }
    
    return null;
};