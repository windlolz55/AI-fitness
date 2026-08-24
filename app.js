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

// // Food database is loaded from food_db.js (foodDatabase)

// Initialize 'common' category dynamically
foodDatabase.categories.unshift({ id: 'common', name: '常吃', icon: 'fa-star' });
// Add first 6 items to common for quick access
const first6 = foodDatabase.foods.slice(0, 6).map(f => ({...f, categoryId: 'common', id: f.id + '_common'}));
foodDatabase.foods = [...first6, ...foodDatabase.foods];

// Mock Scanner DB
const mockFoods = [
    { name: "香煎鮭魚沙拉", cal: 450, pro: 35, carb: 12, fat: 28 },
    { name: "健康糙米飯", cal: 180, pro: 4, carb: 38, fat: 1 },
    { name: "烤雞腿便當", cal: 680, pro: 32, carb: 85, fat: 22 }
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
    
    updateDashboard();
    selectLogDate(todayDateStr);
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
    
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace('/', '月') + '日';
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
    const mealMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' };
    document.getElementById('cart-meal-label').innerHTML = `${mealMap[meal]} <i class="fa-solid fa-caret-up" style="font-size: 10px; margin-left: 2px;"></i>`;
}

function renderDBSidebar() {
    const sidebar = document.getElementById('db-sidebar');
    sidebar.innerHTML = foodDatabase.categories.map(cat => `
        <div class="sidebar-item ${cat.id === activeCategory ? 'active' : ''}" onclick="switchCategory('${cat.id}')">
            ${cat.name}
        </div>
    `).join('');
}

function switchCategory(catId) {
    activeCategory = catId;
    document.getElementById('food-search-input').value = '';
    renderDBSidebar();
    renderDBContent();
}

document.getElementById('food-search-input').addEventListener('input', (e) => {
    renderDBContent(e.target.value);
});

function renderDBContent(searchQuery = '') {
    const list = document.getElementById('db-food-list');
    let filteredFoods = [];
    
    if (searchQuery.trim() !== '') {
        document.getElementById('db-category-title').innerText = '搜尋結果';
        filteredFoods = foodDatabase.foods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Remove duplicates if searching (because 'common' category duplicates items)
        const seenIds = new Set();
        filteredFoods = filteredFoods.filter(f => {
            const rawId = f.id.replace('_common', '');
            if (seenIds.has(rawId)) return false;
            seenIds.add(rawId);
            return true;
        });
    } else {
        const title = foodDatabase.categories.find(c => c.id === activeCategory).name;
        document.getElementById('db-category-title').innerText = title + '類';
        filteredFoods = foodDatabase.foods.filter(f => f.categoryId === activeCategory);
    }
    
    list.innerHTML = filteredFoods.map(food => `
        <div class="food-db-item" onclick="selectFood('${food.id}')">
            <div style="display:flex; align-items:center;">
                <div style="font-size: 32px; margin-right: 12px; width: 48px; height: 48px; background: var(--bg-main); border-radius: 8px; display: flex; align-items: center; justify-content: center;">${food.icon || '🍽️'}</div>
                <div>
                    <h4>${food.name}</h4>
                    <p><span style="color: #ff6b6b; font-weight: 600;">${food.cals}</span> kcal/100g</p>
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
    selectedFood = foodDatabase.foods.find(f => f.id === foodId);
    document.getElementById('setup-food-name').innerText = selectedFood.name;
    document.getElementById('setup-grams').value = 100;
    updateFoodSetup();
    document.getElementById('food-setup-modal').classList.add('open');
}

function closeFoodSetup() {
    document.getElementById('food-setup-modal').classList.remove('open');
    selectedFood = null;
}

// Close setup modal when clicking outside of it
document.addEventListener('click', (e) => {
    const setupModal = document.getElementById('food-setup-modal');
    if (setupModal.classList.contains('open')) {
        // Only close if clicking outside the modal, and not clicking a food item that opens it
        if (!setupModal.contains(e.target) && !e.target.closest('.food-db-item')) {
            closeFoodSetup();
        }
    }
});

document.getElementById('setup-grams').addEventListener('input', updateFoodSetup);

function updateFoodSetup() {
    if(!selectedFood) return;
    const grams = parseFloat(document.getElementById('setup-grams').value) || 0;
    const multi = grams / 100;
    document.getElementById('setup-cal').innerText = Math.round(selectedFood.cals * multi);
    document.getElementById('setup-pro').innerText = Math.round(selectedFood.macros.p * multi);
    document.getElementById('setup-carb').innerText = Math.round(selectedFood.macros.c * multi);
    document.getElementById('setup-fat').innerText = Math.round(selectedFood.macros.f * multi);
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
        cal: Math.round(selectedFood.cals * multi),
        pro: Math.round(selectedFood.macros.p * multi),
        carb: Math.round(selectedFood.macros.c * multi),
        fat: Math.round(selectedFood.macros.f * multi),
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
                    <div style="font-size: 12px; color: var(--text-muted);">${item.cal} ?�卡</div>
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
        
        const mealMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' };
        alert(`已將昨日的 ${mealMap[currentAddingMeal]} 共 ${yestLogs.length} 項食物加入待選餐盤中！請點擊左下角「待選餐盤」確認送出。`);
    } else {
        alert('昨日此餐無任何紀錄。');
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
        title.innerHTML = '<i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>飲水建議';
        content.innerHTML = `
            <p>每日建議飲水量 <strong style="color: var(--accent-secondary); font-size: 16px;">${TARGET_WATER} ml</strong></p>
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px;">
                <p style="margin-bottom: 4px;"><strong>計算公式：</strong></p>
                <p>體重 ${userProfile.weight} kg * 35 ml = <strong>${TARGET_WATER} ml</strong></p>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">* 建議分次小口飲用，若流汗多可適度增加。</p>
        `;
    } else if (type === 'cals') {
        let bmr = 0;
        let bmrFormula = '';
        if (userProfile.gender === 'male') {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
            bmrFormula = `10 * ${userProfile.weight}kg + 6.25 * ${userProfile.height}cm - 5 * ${userProfile.age}歲 + 5 = <strong>${Math.round(bmr)}</strong>`;
        } else {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
            bmrFormula = `10 * ${userProfile.weight}kg + 6.25 * ${userProfile.height}cm - 5 * ${userProfile.age}歲 - 161 = <strong>${Math.round(bmr)}</strong>`;
        }

        let tdee = bmr * parseFloat(userProfile.activity);
        
        let goalText = '維持體重 (無調整)';
        let targetCalText = `${Math.round(tdee)} kcal`;
        if(userProfile.goal === 'lose') {
            goalText = '減脂 (-300 kcal)';
            targetCalText = `${Math.round(tdee)} - 300 = <strong>${TARGET_CALS} kcal</strong>`;
        } else if (userProfile.goal === 'gain') {
            goalText = '增肌 (+300 kcal)';
            targetCalText = `${Math.round(tdee)} + 300 = <strong>${TARGET_CALS} kcal</strong>`;
        }

        title.innerHTML = '<i class="fa-solid fa-calculator" style="color: var(--accent-primary); margin-right: 8px;"></i>目標熱量說明';
        content.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 1: 基礎代謝率 (BMR)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">維持生命所需的最低熱量消耗。使用 Mifflin-St Jeor 公式：</p>
                    <p>${bmrFormula}</p>
                </div>
                
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 2: 每日總消耗熱量 (TDEE)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">BMR 乘上活動係數得出每日總消耗熱量。</p>
                    <p>${Math.round(bmr)} * ${userProfile.activity} (活動係數) = <strong>${Math.round(tdee)} kcal</strong></p>
                </div>

                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 3: 目標熱量</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">根據目標調整總熱量：${goalText}</p>
                    <p>${targetCalText}</p>
                </div>
            </div>
        `;
    } else if (type === 'macros') {
        title.innerHTML = '<i class="fa-solid fa-calculator" style="color: var(--accent-primary); margin-right: 8px;"></i>目標營養素說明';
        content.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">三大營養素分配</p>
                    <p style="color: var(--text-muted); margin-bottom: 8px;">以體重為基準，並用碳水填滿剩餘熱量。</p>
                    
                    <p style="margin-bottom: 4px;"><strong>蛋白 (體重 * 1.8)</strong> ${userProfile.weight} * 1.8</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--pro-color);">${TARGET_PRO} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_PRO * 4} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>脂肪 (體重 * 0.9)</strong> ${userProfile.weight} * 0.9</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--fat-color);">${TARGET_FAT} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_FAT * 9} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>碳水 (熱量填滿)</strong></p>
                    <p style="margin-bottom: 4px; font-size: 11px;">(${TARGET_CALS} - ${TARGET_PRO * 4} - ${TARGET_FAT * 9}) ÷ 4</p>
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
    const baseDate = new Date(selectedLogDate || todayDateStr);
    const currentDayOfWeek = baseDate.getDay();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    
    let html = '';
    for(let i=0; i<7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - currentDayOfWeek + i);
        
        const dateStr = d.toLocaleDateString('en-CA');
        const dayName = (dateStr === todayDateStr) ? '今' : days[i];
        const dateNum = d.getDate();
        
        const activeClass = (dateStr === selectedLogDate) ? 'active' : '';
        html += `
            <div class="date-item ${activeClass}" onclick="selectLogDate('${dateStr}')" style="height: 48px;">
                <span style="font-size: 11px;">${dayName}</span>
                <span style="font-size: 16px; font-weight: 600; margin-top: 2px;">${dateNum}</span>
            </div>
        `;
    }
    strip.innerHTML = html;
}

function selectLogDate(dateStr) {
    selectedLogDate = dateStr;
    renderDateStrip();
    renderLogs();
    
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    document.getElementById('log-view-title').innerText = `飲食紀錄 (${m}/${dt})`;
}

function renderLogs() {
    const container = document.getElementById('all-logs');
    const mealMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心' };
    
    let html = '';

    // Water Log Card
    const waterAmount = (dailyData[selectedLogDate] && dailyData[selectedLogDate].water) ? dailyData[selectedLogDate].water : 0;
    const waterPercent = Math.min((waterAmount / TARGET_WATER) * 100, 100);

    html += `
        <div class="meal-group-card" style="margin-bottom: 16px;">
            <div class="meal-group-header" style="margin-bottom: 12px;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>飲水</h3>
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
                    <h3><i class="fa-solid fa-weight-scale" style="color: var(--accent-primary); margin-right: 8px;"></i>體重</h3>
                </div>
                <div class="total-cal" style="color: var(--accent-primary); font-weight: 600; font-size: 16px;">${parseFloat(weightAmount).toFixed(1)} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">kg</span></div>
            </div>
        </div>
    `;

    const dayLogs = logs.filter(log => (log.date || todayDateStr) === selectedLogDate);
    
    if (dayLogs.length === 0) {
        html += `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">今天尚無飲食紀錄</p>`;
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
                    
                    let icon = '🍽️';
                    let desc = '1項';
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
                    suggestStr = `建議 ${Math.round(TARGET_CALS * 0.25)} - ${Math.round(TARGET_CALS * 0.35)} kcal`;
                } else if(meal === 'lunch') {
                    suggestStr = `建議 ${Math.round(TARGET_CALS * 0.35)} - ${Math.round(TARGET_CALS * 0.45)} kcal`;
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
    if(confirm('確定要清空今天的飲食紀錄嗎？')) {
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
        alert('儲存成功！已重新計算目標熱量。');
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
        labels.push(d.getDate() + '日');
        
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
                label: '體重 (kg)',
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
    
    document.getElementById('calendar-month-title').innerText = year + '年 ' + String(month + 1).padStart(2, '0') + '月';
    
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



