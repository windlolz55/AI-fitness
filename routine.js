// Routine System Logic

window.formatWorkoutTargetNote = function(w) {
    if (!w || !w.name) return '';
    const parts = [];
    
    // 重量 (若 > 0)
    if (w.weight !== undefined && w.weight !== null && Number(w.weight) > 0) {
        parts.push(`${w.weight}kg`);
    }
    
    // 組數 (若 > 0)
    if (w.sets !== undefined && w.sets !== null && String(w.sets).trim() !== '' && Number(w.sets) > 0) {
        parts.push(`${w.sets}組`);
    }
    
    // 次數 / 時間
    if (w.reps !== undefined && w.reps !== null && String(w.reps).trim() !== '') {
        const repsStr = String(w.reps).trim();
        if (/[\u4e00-\u9fa5a-zA-Z]$/.test(repsStr)) {
            parts.push(repsStr);
        } else {
            parts.push(`${repsStr}次`);
        }
    }
    
    if (parts.length > 0) {
        return `${w.name} (${parts.join(', ')})：`;
    }
    return `${w.name}：`;
};

window.buildWorkoutsTargetNotesText = function(workouts) {
    if (!Array.isArray(workouts) || workouts.length === 0) return '';
    return workouts.map(w => window.formatWorkoutTargetNote(w)).filter(Boolean).join('\n');
};

window.openRoutinePlanManager = function() {
    document.getElementById('routine-plan-mode').value = fitnessRoutinePlan.mode || 'none';
    renderRoutinePlanSetup();
    
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems) navItems.forEach(nav => nav.classList.remove('active'));
    const views = document.querySelectorAll('.view');
    if (views) views.forEach(v => v.classList.remove('active'));
    
    const view = document.getElementById('view-routine-plan');
    if (view) view.classList.add('active');
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
};

window.closeRoutinePlanManager = function() {
    const views = document.querySelectorAll('.view');
    if (views) views.forEach(v => v.classList.remove('active'));
    
    const profileView = document.getElementById('view-profile');
    if (profileView) profileView.classList.add('active');
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
    
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems) navItems.forEach(nav => {
        if(nav.getAttribute('data-target') === 'view-profile') nav.classList.add('active');
    });
};

function getAutoApplyCheckboxHtml(isChecked) {
    return `
        <div style="margin-top: 16px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="const cb = document.getElementById('routine-auto-apply'); if (cb && event.target !== cb) { cb.checked = !cb.checked; }">
            <div>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-bolt" style="color: var(--accent-primary);"></i> 每日自動帶入課表
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">每天進入運動分頁時，自動填入當日課表，不用手動點選</div>
            </div>
            <input type="checkbox" id="routine-auto-apply" ${isChecked ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: var(--accent-primary); cursor: pointer;">
        </div>
    `;
}

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
    const autoApply = fitnessRoutinePlan.autoApply !== false;
    
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
                <select id="routine-tpl-1" class="input-field" style="margin-bottom: 8px;">
                    ${getTemplateOptionsHtml(schedule['1'])}
                </select>
                ${getAutoApplyCheckboxHtml(autoApply)}
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
                
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 12px; color: var(--text-muted);">訓練 B (週二、週五)</label>
                    <select id="routine-tpl-B" class="input-field">
                        ${getTemplateOptionsHtml(schedule['B'])}
                    </select>
                </div>
                ${getAutoApplyCheckboxHtml(autoApply)}
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
                
                <div style="margin-bottom: 16px;">
                    <label style="font-size: 12px; color: var(--text-muted);">第 3 天 (例如：腿部)</label>
                    <select id="routine-tpl-3" class="input-field">
                        ${getTemplateOptionsHtml(schedule['3'])}
                    </select>
                </div>
                
                <div style="margin-top: 16px; margin-bottom: 8px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center; color: var(--text-muted); font-size: 14px;">
                    第 4 天：固定休息 🎉
                </div>
                ${getAutoApplyCheckboxHtml(autoApply)}
            </div>
        `;
    }
    
    container.innerHTML = html;
};

window.saveRoutinePlan = function() {
    const mode = document.getElementById('routine-plan-mode').value;
    const schedule = {};
    let cycleStartDate = null;
    let autoApply = true;
    const autoApplyEl = document.getElementById('routine-auto-apply');
    if (autoApplyEl) {
        autoApply = autoApplyEl.checked;
    }
    
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
        cycleStartDate: cycleStartDate,
        autoApply: autoApply
    };
    
    if (typeof setAndSync === 'function') {
        setAndSync('fitness_routine_plan', JSON.stringify(fitnessRoutinePlan));
    }

    // 若啟用自動套入，且當前所選日期無紀錄且非休息日，立即自動帶入
    if (autoApply && typeof checkAndAutoApplyRoutine === 'function') {
        const curDate = (typeof selectedLogDate !== 'undefined') ? selectedLogDate : (typeof getTodayDateStr === 'function' ? getTodayDateStr() : '');
        if (curDate) {
            checkAndAutoApplyRoutine(curDate);
        }
    }
    
    alert('分化訓練計畫儲存成功！');
    closeRoutinePlanManager();
    
    if (typeof renderWorkout === 'function') {
        renderWorkout();
    }
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
};

window.getTodayRoutineInfo = function(targetDateStr) {
    if (!fitnessRoutinePlan || fitnessRoutinePlan.mode === 'none') return null;
    
    let d;
    if (typeof targetDateStr === 'string' && targetDateStr.includes('-')) {
        const parts = targetDateStr.split('-');
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
        d = new Date(targetDateStr);
    }
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
        
        let start;
        if (typeof fitnessRoutinePlan.cycleStartDate === 'string' && fitnessRoutinePlan.cycleStartDate.includes('-')) {
            const sp = fitnessRoutinePlan.cycleStartDate.split('-');
            start = new Date(parseInt(sp[0], 10), parseInt(sp[1], 10) - 1, parseInt(sp[2], 10));
        } else {
            start = new Date(fitnessRoutinePlan.cycleStartDate);
        }
        start.setHours(0,0,0,0);
        const current = new Date(d);
        current.setHours(0,0,0,0);
        
        const diffTime = current.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        // 支援歷史日期負數循環 (4天一循環)
        const dayInCycle = (((diffDays % 4) + 4) % 4) + 1;
        
        if (dayInCycle >= 1 && dayInCycle <= 3) {
            templateIdx = schedule[String(dayInCycle)];
        }
    }
    
    if (templateIdx !== null && templateIdx !== '' && window.FITNESS_TEMPLATES && window.FITNESS_TEMPLATES[templateIdx]) {
        return {
            idx: templateIdx,
            template: window.FITNESS_TEMPLATES[templateIdx],
            isRestDay: false
        };
    }
    
    return { isRestDay: true };
};

window.checkAndAutoApplyRoutine = function(targetDateStr) {
    if (!targetDateStr) {
        targetDateStr = (typeof getTodayDateStr === 'function') ? getTodayDateStr() : new Date().toISOString().split('T')[0];
    }
    if (!fitnessRoutinePlan || fitnessRoutinePlan.mode === 'none') {
        return false;
    }
    if (fitnessRoutinePlan.autoApply === false) {
        return false;
    }

    const dayEntry = (typeof dailyData !== 'undefined') ? dailyData[targetDateStr] : null;
    // 使用者主動清空過，不重複自動帶入
    if (dayEntry && dayEntry.manualCleared) {
        return false;
    }
    // 已經有動作紀錄，不覆蓋
    if (dayEntry && Array.isArray(dayEntry.workouts) && dayEntry.workouts.length > 0) {
        return false;
    }

    const info = getTodayRoutineInfo(targetDateStr);
    if (!info || info.isRestDay || !info.template || !Array.isArray(info.template.exercises) || info.template.exercises.length === 0) {
        return false;
    }

    if (typeof dailyData !== 'undefined') {
        if (!dailyData[targetDateStr]) {
            const defaultWeight = (typeof userProfile !== 'undefined' && userProfile && userProfile.weight) ? userProfile.weight : 70;
            dailyData[targetDateStr] = { water: 0, weight: defaultWeight, burned: 0, burnedTime: 0 };
        }
        if (!dailyData[targetDateStr].workouts) {
            dailyData[targetDateStr].workouts = [];
        }

        dailyData[targetDateStr].routineName = info.template.title;
        dailyData[targetDateStr].manualCleared = false;

        const newWorkouts = [];
        info.template.exercises.forEach(ex => {
            newWorkouts.push({
                name: ex.name,
                type: ex.type || 'weight',
                weight: ex.weight || 0,
                sets: ex.sets || 0,
                reps: ex.reps || '',
                completed: false
            });
        });
        dailyData[targetDateStr].workouts = newWorkouts;
        if (!dailyData[targetDateStr].workoutNote || !dailyData[targetDateStr].workoutNote.trim()) {
            if (typeof window.buildWorkoutsTargetNotesText === 'function') {
                dailyData[targetDateStr].workoutNote = window.buildWorkoutsTargetNotesText(newWorkouts);
            }
        }

        if (typeof setAndSync === 'function') {
            setAndSync('fitness_daily', JSON.stringify(dailyData));
        } else {
            localStorage.setItem('fitness_daily', JSON.stringify(dailyData));
        }
        return true;
    }

    return false;
};

// ─── Previous Routine Note Reminder Logic ────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

window.hasMeaningfulWorkoutNote = function(noteStr, workouts) {
    if (!noteStr || typeof noteStr !== 'string') return false;
    let text = noteStr.trim();
    if (!text) return false;
    
    // 若有 workouts，過濾掉系統自動預填的「動作名稱 (目標...)：」或「動作名稱：」骨架
    if (Array.isArray(workouts) && workouts.length > 0) {
        let stripped = text;
        workouts.forEach(w => {
            if (w && w.name) {
                const re = new RegExp(escapeRegex(w.name) + '\\s*(\\([^)]*\\)|（[^）]*）)?\\s*[:：]?', 'g');
                stripped = stripped.replace(re, '');
            }
        });
        stripped = stripped.replace(/[\s\r\n:：]+/g, '');
        return stripped.length > 0;
    }
    
    return text.replace(/[\s\r\n:：]+/g, '').length > 0;
};

window.formatPrevNoteDate = function(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const dayName = days[d.getDay()];
        return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)} (週${dayName})`;
    }
    return dateStr;
};

function getCleanExName(name) {
    if (!name) return '';
    return name.split('(')[0].split('（')[0].trim();
}

window.getPreviousRoutineNote = function(targetDateStr) {
    if (typeof dailyData === 'undefined' || !dailyData) return null;
    if (!targetDateStr) {
        targetDateStr = (typeof selectedLogDate !== 'undefined') ? selectedLogDate : (typeof getTodayDateStr === 'function' ? getTodayDateStr() : '');
    }
    if (!targetDateStr) return null;

    // 1. 取得目標日期的課表名稱或排定分化課表
    let currentRoutineName = dailyData[targetDateStr]?.routineName || '';
    const curRoutineInfo = (typeof getTodayRoutineInfo === 'function') ? getTodayRoutineInfo(targetDateStr) : null;
    if (!currentRoutineName && curRoutineInfo && curRoutineInfo.template && curRoutineInfo.template.title) {
        currentRoutineName = curRoutineInfo.template.title;
    }

    const currentWorkouts = dailyData[targetDateStr]?.workouts || [];
    const cleanCurrentNames = new Set(currentWorkouts.map(w => getCleanExName(w.name)));

    // 當天既無課表名稱又無動作時，無法比對課表
    if (!currentRoutineName && cleanCurrentNames.size === 0) {
        return null;
    }

    // 2. 取得所有嚴格早於 targetDateStr 的歷史日期，由近到遠（降序）排序
    const historyDates = Object.keys(dailyData)
        .filter(d => d < targetDateStr)
        .sort((a, b) => b.localeCompare(a));

    // 3. 找出「上一次真正有執行這個課表的日子」
    // 關鍵：必須是有運動紀錄（workouts > 0）的日子，跳過純喝水/體重日！
    let lastMatchingDateStr = null;

    for (const dStr of historyDates) {
        const entry = dailyData[dStr];
        // 必須實際有運動紀錄，才算課表執行日！
        if (!entry || !Array.isArray(entry.workouts) || entry.workouts.length === 0) {
            continue;
        }

        let isSameRoutine = false;
        let histRoutineName = entry.routineName || '';
        const histRoutineInfo = (typeof getTodayRoutineInfo === 'function') ? getTodayRoutineInfo(dStr) : null;
        if (!histRoutineName && histRoutineInfo && histRoutineInfo.template && histRoutineInfo.template.title) {
            histRoutineName = histRoutineInfo.template.title;
        }

        // 比對 A: 分化課表範本 index 相同且非休息日
        if (curRoutineInfo && histRoutineInfo && !curRoutineInfo.isRestDay && !histRoutineInfo.isRestDay && curRoutineInfo.idx !== undefined && String(curRoutineInfo.idx) === String(histRoutineInfo.idx)) {
            isSameRoutine = true;
        }
        // 比對 B: 課表名稱相同 (例如「全身訓練」或「胸肩三頭推」)
        else if (currentRoutineName && histRoutineName && currentRoutineName === histRoutineName) {
            isSameRoutine = true;
        }
        // 比對 C: 動作重疊度 (乾淨動作名稱重疊 >= 40% 或至少1個相同動作)
        else if (cleanCurrentNames.size > 0 && entry.workouts.length > 0) {
            let matchCount = 0;
            entry.workouts.forEach(hw => {
                if (cleanCurrentNames.has(getCleanExName(hw.name))) {
                    matchCount++;
                }
            });
            if (matchCount >= 1 && (matchCount / Math.min(cleanCurrentNames.size, entry.workouts.length)) >= 0.3) {
                isSameRoutine = true;
            }
        }

        if (isSameRoutine) {
            lastMatchingDateStr = dStr;
            break; // 鎖定最近一次真正練這個課表的日子！
        }
    }

    // 若歷史上沒有執行過這個課表
    if (!lastMatchingDateStr) {
        return {
            hasMatch: false,
            hasNote: false,
            date: null,
            formattedDate: '',
            routineName: currentRoutineName,
            note: ''
        };
    }

    // 4. 檢查「這最近一次執行日」是否有寫註記
    const lastEntry = dailyData[lastMatchingDateStr];
    let displayRoutineName = lastEntry?.routineName || currentRoutineName;
    const formatted = formatPrevNoteDate(lastMatchingDateStr);

    if (!lastEntry || !lastEntry.workoutNote || !lastEntry.workoutNote.trim()) {
        return {
            hasMatch: true,
            hasNote: false,
            date: lastMatchingDateStr,
            formattedDate: formatted,
            routineName: displayRoutineName,
            note: ''
        };
    }

    const lastWorkouts = lastEntry.workouts || [];
    if (!hasMeaningfulWorkoutNote(lastEntry.workoutNote, lastWorkouts)) {
        return {
            hasMatch: true,
            hasNote: false,
            date: lastMatchingDateStr,
            formattedDate: formatted,
            routineName: displayRoutineName,
            note: ''
        };
    }

    return {
        hasMatch: true,
        hasNote: true,
        date: lastMatchingDateStr,
        formattedDate: formatted,
        routineName: displayRoutineName,
        note: lastEntry.workoutNote.trim()
    };
};

window.renderPrevNoteAlert = function(targetDateStr) {
    const toggleBtn = document.getElementById('btn-prev-note-toggle');
    if (!toggleBtn) return;

    // 不論如何都常駐顯示「上次註記」按鈕
    toggleBtn.style.display = 'inline-flex';

    const prevInfo = getPreviousRoutineNote(targetDateStr);
    if (prevInfo && prevInfo.hasNote) {
        // 上次有註記：高亮提醒 + 燈泡亮起 + 呼吸燈動畫
        toggleBtn.className = 'prev-note-btn has-note';
        toggleBtn.innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #fff;"></i> 上次註記`;
        toggleBtn.title = `上次 (${prevInfo.formattedDate}) 有運動註記，點擊查看`;
        toggleBtn.setAttribute('data-prev-date', prevInfo.date);
    } else {
        // 上次無註記：一般樣式，不發光
        toggleBtn.className = 'prev-note-btn';
        toggleBtn.innerHTML = `<i class="fa-regular fa-note-sticky"></i> 上次註記`;
        toggleBtn.title = prevInfo && prevInfo.hasMatch ? `上次執行此課表 (${prevInfo.formattedDate}) 未填寫註記` : '上次註記';
        toggleBtn.removeAttribute('data-prev-date');
    }
};

window.openPrevNoteModal = function() {
    const curDate = (typeof selectedLogDate !== 'undefined') ? selectedLogDate : (typeof getTodayDateStr === 'function' ? getTodayDateStr() : '');
    const prevInfo = getPreviousRoutineNote(curDate);

    if (!prevInfo || !prevInfo.hasMatch) {
        alert('歷史紀錄中尚未執行過此課表');
        return;
    }

    if (!prevInfo.hasNote) {
        alert(`上次執行此課表（${prevInfo.formattedDate}）未填寫運動註記`);
        return;
    }

    const modal = document.getElementById('prev-workout-note-modal');
    const titleEl = document.getElementById('prev-note-modal-title');
    const dateEl = document.getElementById('prev-note-modal-date');
    const contentEl = document.getElementById('prev-note-modal-content');

    if (modal && titleEl && dateEl && contentEl) {
        titleEl.innerText = prevInfo.routineName ? `上次「${prevInfo.routineName}」註記` : '上次此課表註記';
        dateEl.innerText = `訓練日期：${prevInfo.formattedDate}`;
        contentEl.innerText = prevInfo.note;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
};

window.closePrevNoteModal = function() {
    const modal = document.getElementById('prev-workout-note-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
};

window.copyPrevNoteToToday = function() {
    const noteEl = document.getElementById('workout-daily-note');
    if (!noteEl) return;
    const curDate = (typeof selectedLogDate !== 'undefined') ? selectedLogDate : (typeof getTodayDateStr === 'function' ? getTodayDateStr() : '');
    const prevInfo = getPreviousRoutineNote(curDate);
    if (!prevInfo || !prevInfo.note) return;

    const insertBlock = `【上次註記 (${prevInfo.formattedDate})】\n${prevInfo.note}`;
    if (noteEl.value.trim().length > 0) {
        if (noteEl.value.includes(prevInfo.note.trim())) {
            alert('今日註記中已包含上次筆記內容！');
            closePrevNoteModal();
            return;
        }
        noteEl.value = insertBlock + '\n\n' + noteEl.value;
    } else {
        noteEl.value = insertBlock;
    }
    
    if (typeof adjustNoteHeight === 'function') adjustNoteHeight(noteEl);
    if (typeof handleWorkoutNoteInput === 'function') handleWorkoutNoteInput(noteEl.value);
    
    closePrevNoteModal();
    alert('已成功帶入上次課表註記！');
    noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    noteEl.focus();
};