// State
let userProfile = JSON.parse(localStorage.getItem('fitness_profile')) || {
    gender: 'male', age: 25, height: 170, weight: 70, activity: 1.375, goal: 'maintain'
};
let logs = JSON.parse(localStorage.getItem('fitness_logs')) || [];
let dailyData = JSON.parse(localStorage.getItem('fitness_daily')) || {};

// Constants
let TARGET_CALS = 2000;
let TARGET_PRO = 120;
let TARGET_CARB = 200;
let TARGET_FAT = 65;
let TARGET_WATER = 2000;

const todayDateStr = new Date().toLocaleDateString('en-CA');
let selectedLogDate = todayDateStr;

if (!dailyData[todayDateStr]) {
    dailyData[todayDateStr] = { water: 0, weight: userProfile.weight || '' };
}

// Categories
const dbCategories = [
    { id: 'common', name: '??' },
    { id: 'staple', name: '??' },
    { id: 'meat', name: '????' },
    { id: 'veg', name: '??' },
    { id: 'snack', name: '????' }
];

// Extended Food DB
const commonFoodsDB = [
    { id: 'rice', name: '??', cal: 130, pro: 2.5, carb: 28, fat: 0.3, icon: '??', category: 'staple' },
    { id: 'noodle', name: '?? (??)', cal: 110, pro: 3.5, carb: 23, fat: 0.5, icon: '??', category: 'staple' },
    { id: 'chicken_breast', name: '?????', cal: 115, pro: 24, carb: 0, fat: 1.5, icon: '??', category: 'meat' },
    { id: 'beef_steak', name: '?? (??)', cal: 250, pro: 26, carb: 0, fat: 15, icon: '??', category: 'meat' },
    { id: 'pork', name: '?? (?)', cal: 143, pro: 26, carb: 0, fat: 4, icon: '??', category: 'meat' },
    { id: 'salmon', name: '?? (?)', cal: 208, pro: 20, carb: 0, fat: 13, icon: '??', category: 'meat' },
    { id: 'egg', name: '???', cal: 78, pro: 6, carb: 0.5, fat: 5, icon: '??', category: 'meat' },
    { id: 'cabbage', name: '??? (?)', cal: 50, pro: 1.5, carb: 6, fat: 2, icon: '??', category: 'veg' },
    { id: 'broccoli', name: '???', cal: 34, pro: 2.8, carb: 7, fat: 0.4, icon: '??', category: 'veg' },
    { id: 'sweet_potato', name: '??', cal: 84, pro: 1.6, carb: 27, fat: 0.1, icon: '??', category: 'staple' },
    { id: 'oats', name: '???', cal: 389, pro: 16.9, carb: 66, fat: 6.9, icon: '??', category: 'staple' },
    { id: 'milk', name: '????', cal: 61, pro: 3.2, carb: 4.8, fat: 3.3, icon: '??', category: 'meat' },
    { id: 'soy_milk', name: '????', cal: 33, pro: 3.3, carb: 1.6, fat: 1.6, icon: '??', category: 'snack' },
    { id: 'apple', name: '??', cal: 52, pro: 0.3, carb: 14, fat: 0.2, icon: '??', category: 'veg' },
    { id: 'banana', name: '??', cal: 89, pro: 1.1, carb: 23, fat: 0.3, icon: '??', category: 'veg' },
    { id: 'latte', name: '???? (??)', cal: 40, pro: 2, carb: 3, fat: 2, icon: '?', category: 'snack' }
];

// Add 'common' category to first 6 items for the '???' tab
commonFoodsDB.slice(0, 6).forEach(f => {
    // We duplicate for UI simplicity in rendering
    commonFoodsDB.push({...f, id: f.id+'_c', category: 'common'});
});

// Mock Scanner DB
const mockFoods = [
    { name: "??????", cal: 450, pro: 35, carb: 12, fat: 28 },
    { name: "?????", cal: 180, pro: 4, carb: 38, fat: 1 },
    { name: "?????", cal: 680, pro: 32, carb: 85, fat: 22 }
];

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');

// Init
function init() {
    // Theme setup
    const savedTheme = localStorage.getItem('fitness_theme') || 'light';
    const themeToggle = document.getElementById('theme-toggle');
    if(savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('fitness_theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('fitness_theme', 'light');
        }
    });

    document.getElementById('date-display').innerText = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
    
    calculateTargets();
    setupNavigation();
    setupProfile();
    setupDailyTracking();
    setupScanner();
    
    renderDateStrip();
    updateDashboard();
    renderLogs();
}

function calculateTargets() {
    let bmr;
    if (userProfile.gender === 'male') {
        bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
    } else {
        bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
    }

    let tdee = bmr * parseFloat(userProfile.activity);
    
    if (userProfile.goal === 'lose') TARGET_CALS = Math.round(tdee - 300);
    else if (userProfile.goal === 'gain') TARGET_CALS = Math.round(tdee + 300);
    else TARGET_CALS = Math.round(tdee);

    TARGET_PRO = Math.round(userProfile.weight * 1.8);
    TARGET_FAT = Math.round(userProfile.weight * 0.9);
    
    let remainingCals = TARGET_CALS - (TARGET_PRO * 4) - (TARGET_FAT * 9);
    TARGET_CARB = Math.max(0, Math.round(remainingCals / 4));
    TARGET_WATER = userProfile.weight * 35;

    // Update Profile UI
    const bmrEl = document.getElementById('analysis-bmr');
    if (bmrEl) bmrEl.innerText = Math.round(bmr);
    const tdeeEl = document.getElementById('analysis-tdee');
    if (tdeeEl) tdeeEl.innerText = Math.round(tdee);
    document.getElementById('water-target').innerText = TARGET_WATER;
    document.getElementById('cal-target').innerText = TARGET_CALS;
}

// Navigation
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) view.classList.add('active');
            });
            
            if (targetId === 'view-dashboard') updateDashboard();
        });
    });
}

function openScanner() {
    closeFoodDB();
    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));
    document.getElementById('view-scanner').classList.add('active');
}
function closeScanner() {
    document.querySelector('[data-target="view-dashboard"]').click();
}

// Dashboard Updates
function updateDashboard() {
    // Calculate today's totals
    let todayEaten = 0, todayPro = 0, todayCarb = 0, todayFat = 0;
    logs.forEach(log => {
        if(log.date === todayDateStr || !log.date) {
            todayEaten += log.cal;
            todayPro += log.pro;
            todayCarb += log.carb;
            todayFat += log.fat;
        }
    });

    let remaining = TARGET_CALS - todayEaten;

    document.getElementById('cal-eaten').innerText = todayEaten;
    document.getElementById('cal-remaining').innerText = remaining;
    
    // Ring Math (circumference = 440)
    const ringFill = document.getElementById('cal-ring');
    let percent = Math.min(todayEaten / TARGET_CALS, 1);
    ringFill.style.strokeDashoffset = 440 - (440 * percent);

    // Macros Text
    document.getElementById('val-carb').innerText = todayCarb;
    document.getElementById('tar-carb').innerText = TARGET_CARB;
    document.getElementById('val-pro').innerText = todayPro;
    document.getElementById('tar-pro').innerText = TARGET_PRO;
    document.getElementById('val-fat').innerText = todayFat;
    document.getElementById('tar-fat').innerText = TARGET_FAT;

    // Macro Bars
    document.getElementById('bar-carb').style.width = Math.min((todayCarb / TARGET_CARB) * 100, 100) + '%';
    document.getElementById('bar-pro').style.width = Math.min((todayPro / TARGET_PRO) * 100, 100) + '%';
    document.getElementById('bar-fat').style.width = Math.min((todayFat / TARGET_FAT) * 100, 100) + '%';
}

// Food DB Logic
let currentAddingMeal = 'snack';
let selectedFood = null;
let currentCart = [];
let activeCategory = 'common';

function openFoodDB(meal) {
    currentAddingMeal = meal;
    currentCart = [];
    updateCartUI();
    
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace('/', '?') + '?';
    document.getElementById('db-date-title').innerText = dateStr;
    document.getElementById('db-meal-selector').value = meal;
    changeAddingMeal(meal);
    
    activeCategory = 'common';
    renderDBSidebar();
    renderDBContent();

    document.getElementById('food-db-modal').classList.remove('hidden');
}

function changeAddingMeal(meal) {
    currentAddingMeal = meal;
    const mealMap = { breakfast: '??', lunch: '??', dinner: '??', snack: '??' };
    document.getElementById('cart-meal-label').innerHTML = `${mealMap[meal]} <i class="fa-solid fa-caret-up" style="font-size: 10px; margin-left: 2px;"></i>`;
}

function renderDBSidebar() {
    const sidebar = document.getElementById('db-sidebar');
    sidebar.innerHTML = dbCategories.map(cat => `
        <div class="sidebar-item ${cat.id === activeCategory ? 'active' : ''}" onclick="switchCategory('${cat.id}')">
            ${cat.name}
        </div>
    `).join('');
}

function switchCategory(catId) {
    activeCategory = catId;
    renderDBSidebar();
    renderDBContent();
}

function renderDBContent() {
    const title = dbCategories.find(c => c.id === activeCategory).name;
    document.getElementById('db-category-title').innerText = title + '??';
    
    const list = document.getElementById('db-food-list');
    const filteredFoods = commonFoodsDB.filter(f => f.category === activeCategory);
    
    list.innerHTML = filteredFoods.map(food => `
        <div class="food-db-item" onclick="selectFood('${food.id}')">
            <div style="display:flex; align-items:center;">
                <div style="font-size: 32px; margin-right: 12px; width: 48px; height: 48px; background: var(--bg-main); border-radius: 8px; display: flex; align-items: center; justify-content: center;">${food.icon}</div>
                <div>
                    <h4>${food.name}</h4>
                    <p><span style="color: #ff6b6b; font-weight: 600;">${food.cal}</span> kcal/100g</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: var(--accent-primary); border-radius: 50%;"></div>
                <button class="btn-add"><i class="fa-solid fa-plus" style="font-size: 12px;"></i></button>
            </div>
        </div>
    `).join('');
}

function closeFoodDB() {
    document.getElementById('food-db-modal').classList.add('hidden');
}

function selectFood(foodId) {
    selectedFood = commonFoodsDB.find(f => f.id === foodId);
    document.getElementById('setup-food-name').innerText = selectedFood.name;
    document.getElementById('setup-grams').value = 100;
    updateFoodSetup();
    document.getElementById('food-setup-modal').classList.add('open');
}

function closeFoodSetup() {
    document.getElementById('food-setup-modal').classList.remove('open');
    selectedFood = null;
}

document.getElementById('setup-grams').addEventListener('input', updateFoodSetup);

function updateFoodSetup() {
    if(!selectedFood) return;
    const grams = parseFloat(document.getElementById('setup-grams').value) || 0;
    const multi = grams / 100;
    document.getElementById('setup-cal').innerText = Math.round(selectedFood.cal * multi);
    document.getElementById('setup-pro').innerText = Math.round(selectedFood.pro * multi);
    document.getElementById('setup-carb').innerText = Math.round(selectedFood.carb * multi);
    document.getElementById('setup-fat').innerText = Math.round(selectedFood.fat * multi);
}

document.getElementById('btn-add-food').addEventListener('click', () => {
    if(!selectedFood) return;
    const grams = parseFloat(document.getElementById('setup-grams').value) || 0;
    const multi = grams / 100;

    const newLog = {
        id: Date.now() + Math.random(),
        img: '', 
        time: new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'}),
        date: todayDateStr,
        meal: currentAddingMeal,
        name: `${selectedFood.name} (${grams}g)`,
        cal: Math.round(selectedFood.cal * multi),
        pro: Math.round(selectedFood.pro * multi),
        carb: Math.round(selectedFood.carb * multi),
        fat: Math.round(selectedFood.fat * multi)
    };

    currentCart.push(newLog);
    updateCartUI();
    closeFoodSetup();
});

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    if(currentCart.length > 0) {
        badge.innerText = currentCart.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
        closeCartModal();
    }
}

function openCartModal() {
    if(currentCart.length === 0) return;
    
    const container = document.getElementById('cart-items-container');
    let html = '';
    currentCart.forEach((item, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--card-border);">
                <div>
                    <div style="font-size: 15px; font-weight: 500;">${item.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${item.cal} ???</div>
                </div>
                <button class="btn-icon" style="color: #ff4757; border:none; width:32px; height:32px;" onclick="removeCartItem(${index})"><i class="fa-solid fa-minus-circle" style="font-size:20px;"></i></button>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCartModal() {
    document.getElementById('cart-modal').classList.add('hidden');
}

function removeCartItem(index) {
    currentCart.splice(index, 1);
    updateCartUI();
    if(currentCart.length > 0) {
        openCartModal();
    }
}

function commitCart() {
    if(currentCart.length > 0) {
        logs.unshift(...currentCart.reverse());
        localStorage.setItem('fitness_logs', JSON.stringify(logs));
        renderLogs();
        updateDashboard();
    }
    closeFoodDB();
    document.querySelector('[data-target="view-log"]').click();
}

function copyYesterdayMeal() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yestStr = d.toLocaleDateString('en-CA');
    
    const yestLogs = logs.filter(log => (log.date || todayDateStr) === yestStr && log.meal === currentAddingMeal);
    
    if(yestLogs.length > 0) {
        yestLogs.forEach(log => {
            currentCart.push({
                ...log,
                id: Date.now() + Math.random(),
                date: todayDateStr
            });
        });
        updateCartUI();
        
        const mealMap = { breakfast: '??', lunch: '??', dinner: '??', snack: '??' };
        alert(`????? ${mealMap[currentAddingMeal]} ? ${yestLogs.length} ????????????????????????????`);
    } else {
        alert('??????????');
    }
}


// Daily Tracking
function setupDailyTracking() {
    const waterVal = document.getElementById('water-val');
    const inputDailyWeight = document.getElementById('daily-weight');

    waterVal.innerText = dailyData[todayDateStr].water;
    inputDailyWeight.value = dailyData[todayDateStr].weight;

    document.getElementById('btn-water-plus').addEventListener('click', () => {
        dailyData[todayDateStr].water += 250; 
        updateDailyData();
    });

    document.getElementById('btn-water-minus').addEventListener('click', () => {
        dailyData[todayDateStr].water = Math.max(0, dailyData[todayDateStr].water - 250);
        updateDailyData();
    });

    inputDailyWeight.addEventListener('input', (e) => {
        dailyData[todayDateStr].weight = e.target.value;
        updateDailyData();
    });
}

function updateDailyData() {
    document.getElementById('water-val').innerText = dailyData[todayDateStr].water;
    localStorage.setItem('fitness_daily', JSON.stringify(dailyData));
}

// Info Modals
function showInfo(type) {
    const title = document.getElementById('info-modal-title');
    const content = document.getElementById('info-modal-content');
    
    if (type === 'water') {
        title.innerHTML = '<i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>????';
        content.innerHTML = `
            <p>??????? <strong style="color: var(--accent-secondary); font-size: 16px;">${TARGET_WATER} ml</strong></p>
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px;">
                <p style="margin-bottom: 4px;"><strong>?????</strong></p>
                <p>?? ${userProfile.weight} kg * 35 ml = <strong>${TARGET_WATER} ml</strong></p>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">* ???????????????????</p>
        `;
    } else if (type === 'macros') {
        let bmr = 0;
        let bmrFormula = '';
        if (userProfile.gender === 'male') {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
            bmrFormula = `10 * ${userProfile.weight}kg + 6.25 * ${userProfile.height}cm - 5 * ${userProfile.age}? + 5 = <strong>${Math.round(bmr)}</strong>`;
        } else {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
            bmrFormula = `10 * ${userProfile.weight}kg + 6.25 * ${userProfile.height}cm - 5 * ${userProfile.age}? - 161 = <strong>${Math.round(bmr)}</strong>`;
        }

        let tdee = bmr * parseFloat(userProfile.activity);
        
        let goalText = '???? (???)';
        let targetCalText = `${Math.round(tdee)} kcal`;
        if(userProfile.goal === 'lose') {
            goalText = '?? (-300 kcal)';
            targetCalText = `${Math.round(tdee)} - 300 = <strong>${TARGET_CALS} kcal</strong>`;
        } else if (userProfile.goal === 'gain') {
            goalText = '?? (+300 kcal)';
            targetCalText = `${Math.round(tdee)} + 300 = <strong>${TARGET_CALS} kcal</strong>`;
        }

        title.innerHTML = '<i class="fa-solid fa-calculator" style="color: var(--accent-primary); margin-right: 8px;"></i>?????????';
        content.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 1: ????? (BMR)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">???????????????? Mifflin-St Jeor ???</p>
                    <p>${bmrFormula}</p>
                </div>
                
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 2: ??????? (TDEE)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">BMR ????????????????</p>
                    <p>${Math.round(bmr)} * ${userProfile.activity} (????) = <strong>${Math.round(tdee)} kcal</strong></p>
                </div>

                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 3: ????</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">??????????${goalText}</p>
                    <p>${targetCalText}</p>
                </div>
                
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 4: ???????</p>
                    <p style="color: var(--text-muted); margin-bottom: 8px;">??????????????????</p>
                    
                    <p style="margin-bottom: 4px;"><strong>?? (?? * 1.8)</strong> ${userProfile.weight} * 1.8</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--pro-color);">${TARGET_PRO} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_PRO * 4} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>?? (?? * 0.9)</strong> ${userProfile.weight} * 0.9</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--fat-color);">${TARGET_FAT} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_FAT * 9} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>?? (????)</strong></p>
                    <p style="margin-bottom: 4px; font-size: 11px;">(${TARGET_CALS} - ${TARGET_PRO * 4} - ${TARGET_FAT * 9}) ? 4</p>
                    <p style="margin-bottom: 4px; text-align: right;">= <strong style="color: var(--carb-color);">${TARGET_CARB} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_CARB * 4} kcal)</span></p>
                </div>
            </div>
        `;
    }
    
    document.getElementById('info-modal').classList.remove('hidden');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
}

// Logs Rendering
function renderDateStrip() {
    const strip = document.getElementById('date-strip');
    const baseDate = new Date();
    const days = ['?', '?', '?', '?', '?', '?', '?'];
    
    let html = '';
    for(let i=6; i>=0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        
        const dateStr = d.toLocaleDateString('en-CA');
        const dayName = i === 0 ? '?' : days[d.getDay()];
        
        const activeClass = (dateStr === selectedLogDate) ? 'active' : '';
        html += `<div class="date-item ${activeClass}" onclick="selectLogDate('${dateStr}')">${dayName}</div>`;
    }
    strip.innerHTML = html;
}

function selectLogDate(dateStr) {
    selectedLogDate = dateStr;
    renderDateStrip();
    renderLogs();
    
    if (dateStr === todayDateStr) {
        document.getElementById('log-view-title').innerText = '???? (??)';
    } else {
        const d = new Date(dateStr);
        document.getElementById('log-view-title').innerText = `???? (${d.getMonth()+1}/${d.getDate()})`;
    }
}

function renderLogs() {
    const container = document.getElementById('all-logs');
    const mealMap = { breakfast: '??', lunch: '??', dinner: '??', snack: '??' };
    
    let html = '';

    // Water Log Card
    const waterAmount = (dailyData[selectedLogDate] && dailyData[selectedLogDate].water) ? dailyData[selectedLogDate].water : 0;
    const waterPercent = Math.min((waterAmount / TARGET_WATER) * 100, 100);

    html += `
        <div class="meal-group-card" style="margin-bottom: 16px;">
            <div class="meal-group-header" style="margin-bottom: 12px;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>??</h3>
                </div>
                <div class="total-cal" style="color: var(--accent-secondary); font-weight: 600; font-size: 16px;">${waterAmount} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">/ ${TARGET_WATER} ml</span></div>
            </div>
            <div style="height: 8px; background: var(--card-border); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background: var(--accent-secondary); width: ${waterPercent}%; border-radius: 4px;"></div>
            </div>
        </div>
    `;

    // Weight Log Card
    const weightAmount = (dailyData[selectedLogDate] && dailyData[selectedLogDate].weight) ? dailyData[selectedLogDate].weight : (userProfile.weight || 0);

    html += `
        <div class="meal-group-card" style="margin-bottom: 16px;">
            <div class="meal-group-header" style="margin-bottom: 0;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-weight-scale" style="color: var(--accent-primary); margin-right: 8px;"></i>??</h3>
                </div>
                <div class="total-cal" style="color: var(--accent-primary); font-weight: 600; font-size: 16px;">${parseFloat(weightAmount).toFixed(1)} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">kg</span></div>
            </div>
        </div>
    `;

    const dayLogs = logs.filter(log => (log.date || todayDateStr) === selectedLogDate);
    
    if (dayLogs.length === 0) {
        html += `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">????????</p>`;
        container.innerHTML = html;
        return;
    }

    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
    dayLogs.forEach(log => {
        grouped[log.meal || 'snack'].push(log);
    });

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        if(grouped[meal].length > 0) {
            let mealCal = 0;
            let itemsHTML = '';
            grouped[meal].forEach(item => {
                    mealCal += item.cal;
                    
                    let icon = '???';
                    let desc = '1?';
                    if(item.name.includes('(')) {
                        let match = item.name.match(/\(([^)]+)\)/);
                        if(match) desc = match[1];
                    }
                    const baseName = item.name.split(' (')[0];
                    const dbFood = commonFoodsDB.find(f => f.name.includes(baseName));
                    if(dbFood) icon = dbFood.icon;

                    itemsHTML += `
                        <div class="meal-item">
                            <div class="meal-item-icon">${icon}</div>
                            <div class="meal-item-info">
                                <div class="meal-item-name">${baseName}</div>
                                <div class="meal-item-desc">${desc}</div>
                            </div>
                            <div class="meal-item-cal">${item.cal}kcal <i class="fa-solid fa-chevron-right" style="font-size:10px; margin-left:4px; color:var(--text-muted);"></i></div>
                        </div>
                    `;
                });
                
                let suggestStr = '';
                if(meal === 'breakfast' || meal === 'dinner') {
                    suggestStr = `?? ${Math.round(TARGET_CALS * 0.25)} - ${Math.round(TARGET_CALS * 0.35)} kcal`;
                } else if(meal === 'lunch') {
                    suggestStr = `?? ${Math.round(TARGET_CALS * 0.35)} - ${Math.round(TARGET_CALS * 0.45)} kcal`;
                }
                
                html += `
                    <div class="meal-group-card">
                        <div class="meal-group-header">
                            <div style="display:flex; align-items:baseline;">
                                <h3>${mealMap[meal]}</h3>
                                <span class="suggestion">${suggestStr}</span>
                            </div>
                            <div class="total-cal">${mealCal}kcal <i class="fa-solid fa-chevron-right" style="font-size:12px; margin-left:4px;"></i></div>
                        </div>
                        ${itemsHTML}
                    </div>
                `;
        }
    });

    container.innerHTML = html;
}

document.getElementById('btn-clear').addEventListener('click', () => {
    if(confirm('??????????????')) {
        logs = [];
        localStorage.removeItem('fitness_logs');
        renderLogs();
        updateDashboard();
    }
});


// Profile Logic
function setupProfile() {
    const g = document.getElementById('gender');
    const a = document.getElementById('age');
    const h = document.getElementById('height');
    const w = document.getElementById('weight');
    const act = document.getElementById('activity');
    const goal = document.getElementById('goal');

    g.value = userProfile.gender;
    a.value = userProfile.age;
    h.value = userProfile.height;
    w.value = userProfile.weight;
    act.value = userProfile.activity;
    goal.value = userProfile.goal;

    document.getElementById('btn-save-profile').addEventListener('click', () => {
        userProfile = {
            gender: g.value,
            age: parseInt(a.value),
            height: parseInt(h.value),
            weight: parseInt(w.value),
            activity: parseFloat(act.value),
            goal: goal.value
        };
        localStorage.setItem('fitness_profile', JSON.stringify(userProfile));
        calculateTargets();
        updateDashboard();
        document.getElementById('profile-analysis').style.display = 'block';
        alert('???????????????');
    });
}

// Scanner (Kept intact)
function setupScanner() {
    const fileInput = document.getElementById('file-input');
    const btnCamera = document.getElementById('btn-camera');
    const imagePreview = document.getElementById('image-preview');
    const scanLine = document.getElementById('scan-line');
    const cameraIcon = document.getElementById('camera-icon');
    const scanResult = document.getElementById('scan-result');
    let currentScanData = null;

    btnCamera.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                cameraIcon.style.display = 'none';
                scanResult.classList.add('hidden');
                btnCamera.style.display = 'none';
                scanLine.style.display = 'block';
                
                scanLine.style.animation = 'scan 2s infinite linear';
                
                setTimeout(processMockAI, 2000);
            };
            reader.readAsDataURL(file);
        }
    });

    function processMockAI() {
        currentScanData = mockFoods[Math.floor(Math.random() * mockFoods.length)];
        scanLine.style.display = 'none';
        
        const hour = new Date().getHours();
        let defaultMeal = 'snack';
        if(hour >= 5 && hour < 10) defaultMeal = 'breakfast';
        else if(hour >= 10 && hour < 15) defaultMeal = 'lunch';
        else if(hour >= 17 && hour < 21) defaultMeal = 'dinner';
        document.getElementById('scan-meal-type').value = defaultMeal;

        document.getElementById('result-name').innerText = currentScanData.name;
        document.getElementById('res-cal').innerText = currentScanData.cal;
        document.getElementById('res-pro').innerText = currentScanData.pro;
        document.getElementById('res-carb').innerText = currentScanData.carb;
        
        scanResult.classList.remove('hidden');
    }

    document.getElementById('btn-save-log').addEventListener('click', () => {
        if (currentScanData) {
            const newLog = {
                id: Date.now(),
                img: imagePreview.src,
                time: new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'}),
                date: todayDateStr,
                meal: document.getElementById('scan-meal-type').value,
                ...currentScanData
            };
            logs.unshift(newLog);
            localStorage.setItem('fitness_logs', JSON.stringify(logs));
            
            closeScanner();
            renderLogs();
            
            // reset scanner
            fileInput.value = '';
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            cameraIcon.style.display = 'block';
            scanResult.classList.add('hidden');
            btnCamera.style.display = 'block';
        }
    });
}

// Global scope
window.openFoodDB = openFoodDB;
window.closeFoodDB = closeFoodDB;
window.selectFood = selectFood;
window.closeFoodSetup = closeFoodSetup;
window.openScanner = openScanner;
window.closeScanner = closeScanner;
window.switchCategory = switchCategory;
window.commitCart = commitCart;
window.selectLogDate = selectLogDate;
window.showInfo = showInfo;
window.closeInfoModal = closeInfoModal;
window.copyYesterdayMeal = copyYesterdayMeal;
window.changeAddingMeal = changeAddingMeal;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.removeCartItem = removeCartItem;

window.updateLogWeight = function(delta) {
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70 };
    }
    
    let currentWeight = parseFloat(dailyData[selectedLogDate].weight || userProfile.weight || 70);
    currentWeight = Math.round((currentWeight + delta) * 10) / 10;
    
    dailyData[selectedLogDate].weight = currentWeight;
    localStorage.setItem('fitness_daily', JSON.stringify(dailyData));
    
    // If modifying today's weight, sync it back to profile and dashboard
    if (selectedLogDate === todayDateStr) {
        document.getElementById('weight-val').innerText = currentWeight.toFixed(1);
        userProfile.weight = currentWeight;
        localStorage.setItem('fitness_profile', JSON.stringify(userProfile));
        calculateTargets();
    }
    
    renderLogs();
};

let weightChartInstance = null;

function openWeightTrend() {
    document.getElementById('weight-trend-modal').classList.remove('hidden');
    
    const ctx = document.getElementById('weightChart').getContext('2d');
    const labels = [];
    const data = [];
    
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
        let d = new Date(today);
        d.setDate(d.getDate() - i);
        let dStr = d.toLocaleDateString('en-CA');
        labels.push(d.getDate() + '?');
        
        let w = dailyData[dStr] ? dailyData[dStr].weight : null;
        data.push(w);
    }
    
    let lastValid = userProfile.weight || 70;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === null) {
            data[i] = lastValid;
        } else {
            lastValid = data[i];
        }
    }

    if (weightChartInstance) {
        weightChartInstance.destroy();
    }
    
    weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '?? (kg)',
                data: data,
                borderColor: '#ffb86c',
                backgroundColor: 'rgba(255, 184, 108, 0.2)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffb86c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: Math.floor(Math.min(...data)) - 2,
                    max: Math.ceil(Math.max(...data)) + 2
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function closeWeightTrend() {
    document.getElementById('weight-trend-modal').classList.add('hidden');
}

window.openWeightTrend = openWeightTrend;
window.closeWeightTrend = closeWeightTrend;

// Keyframes
const style = document.createElement('style');
style.innerHTML = `@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`;
document.head.appendChild(style);

init();

// Calendar Modal Logic
let calendarBaseDate = new Date();

function openCalendarModal() {
    document.getElementById('calendar-modal').classList.remove('hidden');
    renderCalendar();
}

function closeCalendarModal() {
    document.getElementById('calendar-modal').classList.add('hidden');
}

function changeCalendarMonth(delta) {
    calendarBaseDate.setMonth(calendarBaseDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = calendarBaseDate.getFullYear();
    const month = calendarBaseDate.getMonth();
    
    document.getElementById('calendar-month-title').innerText = year + '? ' + String(month + 1).padStart(2, '0') + '?';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendar-grid');
    let html = '';
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = year + '-' + String(month+1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        
        let isSelected = (dStr === selectedLogDate);
        let isToday = (dStr === todayDateStr);
        let hasLogs = logs.some(log => (log.date || todayDateStr) === dStr);
        
        let dotHtml = hasLogs ? '<div style="width: 4px; height: 4px; background: var(--accent-secondary); border-radius: 50%; margin: 4px auto 0;"></div>' : '<div style="width: 4px; height: 4px; margin: 4px auto 0;"></div>';
        
        let circleStyle = 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto; border-radius: 50%;';
        let textStyle = 'color: var(--text-main); font-size: 14px;';
        
        if (isSelected) {
            circleStyle += ' background: var(--accent-primary);';
            textStyle = 'color: white; font-size: 14px; font-weight: 600;';
        } else if (isToday) {
            textStyle = 'color: var(--accent-primary); font-size: 14px; font-weight: 600;';
        }
        
        html += '<div style="cursor: pointer;" onclick="selectLogDate(\'' + dStr + '\'); closeCalendarModal();"><div style="' + circleStyle + '"><span style="' + textStyle + '">' + day + '</span></div>' + dotHtml + '</div>';
    }
    grid.innerHTML = html;
}

window.openCalendarModal = openCalendarModal;
window.closeCalendarModal = closeCalendarModal;
window.changeCalendarMonth = changeCalendarMonth;

