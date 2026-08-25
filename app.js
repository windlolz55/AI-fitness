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

function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const todayDateStr = formatDate(new Date());
let selectedLogDate = todayDateStr;

if (!dailyData[todayDateStr]) {
    dailyData[todayDateStr] = { water: 0, weight: userProfile.weight || '' };
}

// // Food database is loaded from food_db.js (foodDatabase)

// Initialize 'custom' category dynamically
foodDatabase.categories.unshift({ id: 'custom', name: '我的最愛', icon: 'fa-heart' });

// Load Custom Foods
let customFoods = JSON.parse(localStorage.getItem('customFoods')) || [];
foodDatabase.foods = [...customFoods, ...foodDatabase.foods];

// Load Favorite Foods
let favoriteFoodIds = JSON.parse(localStorage.getItem('favoriteFoodIds')) || [];

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
    
    updateDashboard();
    selectLogDate(todayDateStr);
}

function calculateTargets() {
    if (!userProfile.weight || !userProfile.height || !userProfile.age || !userProfile.activity) {
        TARGET_CALS = 2000;
        TARGET_PRO = 120;
        TARGET_FAT = 65;
        TARGET_CARB = 200;
        TARGET_WATER = 2000;
        return; // Skip advanced calculation if profile is incomplete
    }

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
    
    if (isNaN(TARGET_CALS) || TARGET_CALS <= 0) TARGET_CALS = 2000;
    if (isNaN(TARGET_PRO) || TARGET_PRO <= 0) TARGET_PRO = 120;
    if (isNaN(TARGET_FAT) || TARGET_FAT <= 0) TARGET_FAT = 65;
    if (isNaN(TARGET_CARB) || TARGET_CARB <= 0) TARGET_CARB = 200;
    if (isNaN(TARGET_WATER) || TARGET_WATER <= 0) TARGET_WATER = 2000;

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
    
    // Check API Key
    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    if (!geminiApiKey) {
        document.getElementById('api-key-setup').style.display = 'block';
        document.getElementById('scanner-main-content').style.display = 'none';
    } else {
        document.getElementById('api-key-setup').style.display = 'none';
        document.getElementById('scanner-main-content').style.display = 'block';
        document.getElementById('gemini-api-key').value = geminiApiKey;
    }
    
    // Reset scanner UI
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('camera-icon').style.display = 'block';
    document.getElementById('scan-line').style.display = 'none';
    document.getElementById('scan-result').classList.add('hidden');
    document.getElementById('btn-camera').style.display = 'block';
}

function closeScanner() {
    document.querySelector('[data-target="view-dashboard"]').click();
}

let currentScanItems = [];

function saveGeminiKey() {
    const key = document.getElementById('gemini-api-key').value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        alert("API Key 已儲存！");
        openScanner(); // refresh UI
    } else {
        alert("請輸入有效的 API Key！");
    }
}

async function callGeminiVisionAPI(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            document.getElementById('camera-icon').style.display = 'none';
            const imgPreview = document.getElementById('image-preview');
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
            
            document.getElementById('btn-camera').style.display = 'none';
            const scanLine = document.getElementById('scan-line');
            const scanStatus = document.getElementById('scan-status');
            
            scanLine.style.display = 'block';
            scanLine.style.animation = 'scan 2s linear infinite';
            scanStatus.style.display = 'block';
            
            const base64String = e.target.result.split(',')[1];
            const apiKey = localStorage.getItem('gemini_api_key');
            
            const modelsToTry = ['gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro'];
            let data = null;
            let success = false;
            let lastError = null;
            
            for (const model of modelsToTry) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: "你是一位專業營養師。請分析這張照片中的所有食物，估算常見的一人份重量，並以嚴格的 JSON 陣列格式回傳。不要回傳任何 markdown 語法 (例如 ```json)，只要純 JSON 字串。陣列中的每個物件必須包含：name (食物名稱, 字串), grams (預估克數, 數字), cal (總熱量, 數字), pro (蛋白質, 數字), carb (碳水, 數字), fat (脂肪, 數字)。" },
                                    { inline_data: { mime_type: file.type, data: base64String } }
                                ]
                            }]
                        })
                    });
                    
                    data = await response.json();
                    
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    success = true;
                    break; // break the loop if successful
                } catch (err) {
                    lastError = err;
                    console.warn(`Model ${model} failed:`, err.message);
                    // Continue to next model if it's a server error or not found
                }
            }
            
            try {
                if (!success) {
                    throw lastError;
                }
                
                let jsonText = data.candidates[0].content.parts[0].text;
                // Use regex to strictly find the first [ ... ] block
                const match = jsonText.match(/\[[\s\S]*\]/);
                if (match) {
                    jsonText = match[0];
                } else {
                    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                }
                
                const aiResults = JSON.parse(jsonText);
                currentScanItems = aiResults.map(item => ({
                    id: 'ai_' + Date.now() + Math.random(),
                    name: item.name,
                    grams: item.grams,
                    cal: item.cal,
                    pro: item.pro,
                    carb: item.carb,
                    fat: item.fat,
                    checked: true
                }));
                
                renderScanChecklist();
                scanLine.style.display = 'none';
                scanStatus.style.display = 'none';
                document.getElementById('scan-result').classList.remove('hidden');
                document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
                
            } catch (err) {
                scanLine.style.display = 'none';
                scanStatus.style.display = 'none';
                alert('API 呼叫失敗，請檢查 API Key 或照片格式：\\n' + err.message);
                document.getElementById('btn-camera').style.display = 'block';
            }
        }
        reader.readAsDataURL(file);
    }
}

function renderScanChecklist() {
    const list = document.getElementById('scan-checklist');
    list.innerHTML = currentScanItems.map((item, index) => `
        <label style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleScanItem(${index})" style="width: 20px; height: 20px; accent-color: var(--accent-primary);">
                <div>
                    <div style="font-weight: 600;">${item.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">約 ${item.grams}g</div>
                </div>
            </div>
            <div style="font-weight: 600; color: var(--accent-primary);">${item.cal} kcal</div>
        </label>
    `).join('');
}

function toggleScanItem(index) {
    currentScanItems[index].checked = !currentScanItems[index].checked;
}

function confirmScanResults() {
    try {
        const selectedItems = currentScanItems.filter(item => item.checked);
        if(selectedItems.length === 0) {
            alert("請至少勾選一項食物！");
            return;
        }
        
        const mealType = document.getElementById('scan-meal-type').value;
        const now = new Date();
        
        // Convert to log format and unshift to logs
        const newLogs = selectedItems.map(item => ({
            id: Date.now() + Math.floor(Math.random() * 1000),
            date: todayDateStr,
            time: now.toTimeString().substring(0,5),
            meal: mealType,
            name: item.name,
            grams: item.grams,
            cal: item.cal,
            pro: item.pro,
            carb: item.carb,
            fat: item.fat
        }));
        
        logs.unshift(...newLogs);
        localStorage.setItem('fitness_logs', JSON.stringify(logs));
        
        // Update UI and close
        renderLogs();
        if (typeof updateDashboard === 'function') updateDashboard();
        
        alert(`成功加入 ${selectedItems.length} 項食物！`);
        
        closeScanner();
        
        // Ensure Dashboard is visible
        const dashboardBtn = document.querySelector('[data-target="view-dashboard"]');
        if (dashboardBtn) dashboardBtn.click();
        
    } catch (e) {
        alert("確認時發生錯誤: " + e.message);
        console.error(e);
    }
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

    document.getElementById('cal-eaten').innerText = Math.round(todayEaten);
    document.getElementById('cal-remaining').innerText = Math.round(remaining);
    
    // Ring Math (circumference = 440)
    const ringFill = document.getElementById('cal-ring');
    let percent = Math.min(todayEaten / TARGET_CALS, 1);
    ringFill.style.strokeDashoffset = 440 - (440 * percent);

    // Macros Text
    document.getElementById('val-carb').innerText = Math.round(todayCarb * 10) / 10;
    document.getElementById('tar-carb').innerText = TARGET_CARB;
    document.getElementById('val-pro').innerText = Math.round(todayPro * 10) / 10;
    document.getElementById('tar-pro').innerText = TARGET_PRO;
    document.getElementById('val-fat').innerText = Math.round(todayFat * 10) / 10;
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
let activeCategory = 'custom';

function openFoodDB(meal) {
    currentAddingMeal = meal;
    currentCart = [];
    updateCartUI();
    
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace('/', '月') + '日';
    document.getElementById('db-date-title').innerText = dateStr;
    document.getElementById('db-meal-selector').value = meal;
    changeAddingMeal(meal);
    
    activeCategory = 'custom';
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
    } else {
        const title = foodDatabase.categories.find(c => c.id === activeCategory).name;
        document.getElementById('db-category-title').innerText = title + '類';
        
        if (activeCategory === 'custom') {
            filteredFoods = foodDatabase.foods.filter(f => f.categoryId === 'custom' || favoriteFoodIds.includes(f.id));
        } else {
            filteredFoods = foodDatabase.foods.filter(f => f.categoryId === activeCategory);
        }
    }
    
    list.innerHTML = filteredFoods.map(food => {
        const isFav = favoriteFoodIds.includes(food.id) || food.categoryId === 'custom';
        return `
        <div class="food-db-item" onclick="selectFood('${food.id}')">
            <div style="display:flex; align-items:center;">
                <div style="font-size: 32px; margin-right: 12px; width: 48px; height: 48px; background: var(--bg-main); border-radius: 8px; display: flex; align-items: center; justify-content: center;">${food.icon || '🍽️'}</div>
                <div>
                    <h4>${food.name}</h4>
                    <p><span style="color: #ff6b6b; font-weight: 600;">${food.cals}</span> kcal/100g</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button style="background:transparent; border:none; padding:4px; font-size:16px;" onclick="toggleFavorite(event, '${food.id}')">
                    ${isFav ? '<i class="fa-solid fa-heart" style="color:#ff6b6b;"></i>' : '<i class="fa-regular fa-heart" style="color:#ccc;"></i>'}
                </button>
                <div style="width: 8px; height: 8px; background: var(--accent-primary); border-radius: 50%;"></div>
                <button class="btn-add"><i class="fa-solid fa-plus" style="font-size: 12px;"></i></button>
            </div>
        </div>
    `}).join('');
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

function toggleFavorite(e, id) {
    e.stopPropagation();
    // Cannot unfavorite a purely custom food unless we delete it entirely
    const food = foodDatabase.foods.find(f => f.id === id);
    if(food && food.categoryId === 'custom') {
        alert('這是您建立的自訂食物，預設會在我的最愛中喔！');
        return;
    }
    
    if (favoriteFoodIds.includes(id)) {
        favoriteFoodIds = favoriteFoodIds.filter(fId => fId !== id);
    } else {
        favoriteFoodIds.push(id);
    }
    localStorage.setItem('favoriteFoodIds', JSON.stringify(favoriteFoodIds));
    renderDBContent(document.getElementById('food-search-input').value);
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
        
        const dateStr = formatDate(d);
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
            <div class="meal-group-header" style="margin-bottom: 12px; align-items: center;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>飲水</h3>
                </div>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <button class="btn-icon" style="width:24px;height:24px;font-size:12px;background:var(--bg-main);" onclick="updateLogWater(-250)">-</button>
                    <div class="total-cal" style="color: var(--accent-secondary); font-weight: 600; font-size: 16px; min-width: 80px; text-align: center;">${waterAmount} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">/ ${TARGET_WATER} ml</span></div>
                    <button class="btn-icon" style="width:24px;height:24px;font-size:12px;background:var(--bg-main);" onclick="updateLogWater(250)">+</button>
                </div>
            </div>
            <div style="height: 8px; background: var(--card-border); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; background: var(--accent-secondary); width: ${waterPercent}%; border-radius: 4px; transition: width 0.3s;"></div>
            </div>
        </div>
    `;

    // Weight Log Card
    const weightAmount = (dailyData[selectedLogDate] && dailyData[selectedLogDate].weight) ? dailyData[selectedLogDate].weight : (userProfile.weight || 0);

    html += `
        <div class="meal-group-card" style="margin-bottom: 16px;">
            <div class="meal-group-header" style="margin-bottom: 0; align-items: center;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-weight-scale" style="color: var(--accent-primary); margin-right: 8px;"></i>體重</h3>
                </div>
                <div style="display:flex; align-items:center; gap: 8px;">
                    <button class="btn-icon" style="width:24px;height:24px;font-size:12px;background:var(--bg-main);" onclick="updateLogWeight(-0.1)">-</button>
                    <div class="total-cal" style="color: var(--accent-primary); font-weight: 600; font-size: 16px; min-width: 70px; text-align: center;">${parseFloat(weightAmount).toFixed(1)} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">kg</span></div>
                    <button class="btn-icon" style="width:24px;height:24px;font-size:12px;background:var(--bg-main);" onclick="updateLogWeight(0.1)">+</button>
                </div>
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
                    const dbFood = foodDatabase.foods.find(f => f.name.includes(baseName));
                    if(dbFood) icon = dbFood.icon;

                    itemsHTML += `
                        <div class="meal-item">
                            <div class="meal-item-icon">${icon}</div>
                            <div class="meal-item-info">
                                <div class="meal-item-name">${baseName}</div>
                                <div class="meal-item-desc">${desc}</div>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 8px;">
                                    <span><i class="fa-solid fa-wheat-awn" style="color: #f1fa8c; font-size: 9px;"></i> ${Math.round(item.carb*10)/10}g</span>
                                    <span><i class="fa-solid fa-drumstick-bite" style="color: #ff79c6; font-size: 9px;"></i> ${Math.round(item.pro*10)/10}g</span>
                                    <span><i class="fa-solid fa-droplet" style="color: #ff5555; font-size: 9px;"></i> ${Math.round(item.fat*10)/10}g</span>
                                </div>
                            </div>
                            <div class="meal-item-cal" style="display:flex; align-items:center; gap:12px;">
                                <span>${item.cal}kcal</span>
                                <button class="btn-icon" style="color: #ff5555; width:28px; height:28px; font-size:14px; background:var(--bg-main);" onclick="deleteLogItem(${item.id})">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
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


// Global scope
window.openFoodDB = openFoodDB;
window.closeFoodDB = closeFoodDB;
window.selectFood = selectFood;
window.closeFoodSetup = closeFoodSetup;
window.openScanner = openScanner;
window.closeScanner = closeScanner;
window.callGeminiVisionAPI = callGeminiVisionAPI;
window.saveGeminiKey = saveGeminiKey;
window.toggleScanItem = toggleScanItem;
window.confirmScanResults = confirmScanResults;
window.switchCategory = switchCategory;
window.toggleFavorite = toggleFavorite;

// Custom Food Logic
function openCustomFood() {
    document.getElementById('custom-food-modal').style.display = 'flex';
}

function closeCustomFood() {
    document.getElementById('custom-food-modal').style.display = 'none';
}

function saveCustomFood() {
    const name = document.getElementById('cf-name').value.trim();
    const cals = parseFloat(document.getElementById('cf-cal').value);
    const p = parseFloat(document.getElementById('cf-pro').value) || 0;
    const c = parseFloat(document.getElementById('cf-carb').value) || 0;
    const f = parseFloat(document.getElementById('cf-fat').value) || 0;

    if (!name) {
        alert("請填寫食物名稱！");
        return;
    }
    if (isNaN(cals) || cals < 0) {
        alert("請填寫正確的熱量數值！");
        return;
    }

    const newFood = {
        id: 'cf_' + Date.now(),
        categoryId: 'custom',
        name: name,
        cals: cals,
        macros: { p, c, f },
        icon: '❤️'
    };

    // Save to local custom foods
    customFoods.push(newFood);
    localStorage.setItem('customFoods', JSON.stringify(customFoods));
    
    // Inject into runtime database at the top
    foodDatabase.foods.unshift(newFood);
    
    // Reset form
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-cal').value = '';
    document.getElementById('cf-pro').value = '';
    document.getElementById('cf-carb').value = '';
    document.getElementById('cf-fat').value = '';
    
    closeCustomFood();
    
    // Switch to Custom category to see it
    switchCategory('custom');
}

window.openCustomFood = openCustomFood;
window.closeCustomFood = closeCustomFood;
window.saveCustomFood = saveCustomFood;
window.commitCart = commitCart;
window.selectLogDate = selectLogDate;
window.showInfo = showInfo;
window.closeInfoModal = closeInfoModal;
window.copyYesterdayMeal = copyYesterdayMeal;
window.changeAddingMeal = changeAddingMeal;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.removeCartItem = removeCartItem;

window.deleteLogItem = function(id) {
    if (!confirm("確定要刪除這筆紀錄嗎？")) return;
    logs = logs.filter(log => log.id !== id);
    localStorage.setItem('fitness_logs', JSON.stringify(logs));
    updateDashboard();
    renderLogs();
};

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

window.updateLogWater = function(delta) {
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70 };
    }
    
    let currentWater = parseInt(dailyData[selectedLogDate].water || 0);
    currentWater = Math.max(0, currentWater + delta);
    
    dailyData[selectedLogDate].water = currentWater;
    localStorage.setItem('fitness_daily', JSON.stringify(dailyData));
    
    if (selectedLogDate === todayDateStr) {
        document.getElementById('water-val').innerText = currentWater;
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
// Init called at the end of the file
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
    try {
        const year = calendarBaseDate.getFullYear();
        const month = calendarBaseDate.getMonth();
        
        const titleEl = document.getElementById('calendar-month-title');
        if (titleEl) {
            titleEl.innerText = year + '年 ' + String(month + 1).padStart(2, '0') + '月';
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        
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
            
            html += `<div style="cursor: pointer;" onclick="selectLogDate('${dStr}'); closeCalendarModal();"><div style="${circleStyle}"><span style="${textStyle}">${day}</span></div>${dotHtml}</div>`;
        }
        grid.innerHTML = html;
    } catch(e) {
        alert("Render calendar error: " + e.message);
    }
}

window.openCalendarModal = openCalendarModal;
window.closeCalendarModal = closeCalendarModal;
window.changeCalendarMonth = changeCalendarMonth;

// Start app
try {
    init();
} catch (e) {
    alert("Startup error: " + e.message + "\\n" + e.stack);
}



