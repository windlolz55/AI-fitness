// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBr2YDukv10alEJMleNnSx7dA34jI65HVg",
  authDomain: "ai-fitness-app-e5bd5.firebaseapp.com",
  projectId: "ai-fitness-app-e5bd5",
  storageBucket: "ai-fitness-app-e5bd5.firebasestorage.app",
  messagingSenderId: "532114144149",
  appId: "1:532114144149:web:47731895202060009d949c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// Persistence removed to prevent iOS Safari multi-tab IndexedDB lockups

// Auth State Observer
auth.onAuthStateChanged((user) => {
    document.getElementById('global-loader').style.display = 'none';
    
    if (user) {
        document.getElementById('view-auth').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // Setup Firestore listener for this user
        setupFirestoreListener(user.uid);
    } else {
        document.getElementById('view-auth').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        
        if (typeof unsubscribeFirestore === 'function') unsubscribeFirestore();
    }
});

// Fix iOS PWA background suspension: force refresh when app comes to foreground
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && auth.currentUser) {
        console.log("App resumed. Forcing sync...");
        db.collection('users').doc(auth.currentUser.uid).get({source: 'server'}).then(doc => {
            if (doc.exists) {
                const data = doc.data();
                let changed = false;
                
                const currentProfileStr = JSON.stringify(typeof userProfile !== 'undefined' ? userProfile : {});
                if (data.fitness_profile && data.fitness_profile !== currentProfileStr) {
                    userProfile = JSON.parse(data.fitness_profile);
                    changed = true;
                }
                
                const currentLogsStr = JSON.stringify(typeof logs !== 'undefined' ? logs : []);
                if (data.fitness_logs && data.fitness_logs !== currentLogsStr) {
                    logs = JSON.parse(data.fitness_logs);
                    changed = true;
                }
                
                const currentDailyStr = JSON.stringify(typeof dailyData !== 'undefined' ? dailyData : {});
                if (data.fitness_daily && data.fitness_daily !== currentDailyStr) {
                    dailyData = JSON.parse(data.fitness_daily);
                    changed = true;
                }
                
                const currentRoutinesStr = JSON.stringify(typeof WORKOUT_ROUTINES !== 'undefined' ? WORKOUT_ROUTINES : {});
                if (data.fitness_routines && data.fitness_routines !== currentRoutinesStr) {
                    WORKOUT_ROUTINES = JSON.parse(data.fitness_routines);
                    changed = true;
                }
                
                const currentCustomFoodsStr = JSON.stringify(typeof customFoods !== 'undefined' ? customFoods : []);
                if (data.customFoods && data.customFoods !== currentCustomFoodsStr) {
                    customFoods = JSON.parse(data.customFoods);
                    changed = true;
                }
                
                const currentFavoriteFoodIdsStr = JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []);
                if (data.favoriteFoodIds && data.favoriteFoodIds !== currentFavoriteFoodIdsStr) {
                    favoriteFoodIds = JSON.parse(data.favoriteFoodIds);
                    changed = true;
                }
                
                if (changed) {
                    const keys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'];
                    keys.forEach(k => {
                        try { if (data[k]) localStorage.setItem(k, data[k]); } catch(e) {}
                    });
                    if (typeof calculateTargets === 'function') calculateTargets();
                    if (typeof setupProfile === 'function') setupProfile();
                    if (typeof updateDashboard === 'function') updateDashboard();
                    if (typeof renderLogs === 'function') renderLogs();
                    if (typeof renderWorkout === 'function') renderWorkout();
                    if (typeof updateDailyData === 'function') updateDailyData();
                }
            }
        }).catch(err => console.error("Resume sync failed:", err));
        
        // Also restart listener to ensure websocket is alive
        setupFirestoreListener(auth.currentUser.uid);
    }
});

function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    
    if (!email || !password) {
        errorEl.innerText = '隢撓?乩縑蝞梯?撖Ⅳ';
        errorEl.style.display = 'block';
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => { errorEl.style.display = 'none'; })
        .catch((error) => {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        });
}

function handleSignup() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    
    if (!email || !password) {
        errorEl.innerText = '隢撓?乩縑蝞梯?撖Ⅳ';
        errorEl.style.display = 'block';
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => { errorEl.style.display = 'none'; })
        .catch((error) => {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
        });
}

async function handleLogout() {
    if (confirm("確定要登出嗎？")) {
        const btn = document.querySelector('[onclick="handleLogout()"]');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在同步並登出...';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
        }

        try {
            const savePromise = saveToFirestore();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 1500));
            await Promise.race([savePromise, timeoutPromise]);
        } catch (e) {
            console.warn("Logout save skipped or failed:", e);
        }

        try {
            await auth.signOut();
        } catch (e) {
            console.warn("SignOut failed, but clearing local data anyway:", e);
        }

        const syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'last_updated'];
        syncableKeys.forEach(k => localStorage.removeItem(k));
        window.location.reload();
    }
}

let unsubscribeFirestore = null;

function saveToFirestore() {
    const user = auth.currentUser;
    if (!user) return Promise.resolve();
    
    return db.collection('users').doc(user.uid).set({
        fitness_profile: JSON.stringify(typeof userProfile !== 'undefined' ? userProfile : {}) || '{}',
        fitness_logs: JSON.stringify(typeof logs !== 'undefined' ? logs : []) || '[]',
        fitness_daily: JSON.stringify(typeof dailyData !== 'undefined' ? dailyData : {}) || '{}',
        fitness_routines: JSON.stringify(typeof WORKOUT_ROUTINES !== 'undefined' ? WORKOUT_ROUTINES : {}) || '{}',
        customFoods: JSON.stringify(typeof customFoods !== 'undefined' ? customFoods : []) || '[]',
        favoriteFoodIds: JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []) || '[]',
        fitness_theme: document.body.getAttribute('data-theme') || 'light',
        last_updated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => {
        console.error("Firestore save failed:", err);
        alert("?脩垢摮?憭望?嚗? + err.message + "\n憒??典?憟質??餃嚗?蝔?2蝘??餃嚗誑?葉?瑚??喋?);
    });
}

window.setAndSync = function(key, value) {
    try {
        localStorage.setItem(key, value);
        localStorage.setItem('pending_sync_time', Date.now().toString());
    } catch(e) {
        console.warn('localStorage setItem failed, bypassing for cloud sync:', e);
    }
    const syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'];
    if (syncableKeys.includes(key) && auth.currentUser) {
        return saveToFirestore();
    }
    return Promise.resolve();
};

function setupFirestoreListener(uid) {
    if (typeof unsubscribeFirestore === 'function') unsubscribeFirestore();
    
    unsubscribeFirestore = db.collection('users').doc(uid).onSnapshot((doc) => {
        if (doc.exists) {
            // If local storage was written in the last 3 seconds, ignore cloud data to prevent overwriting local data
            const pendingSyncTime = parseInt(localStorage.getItem('pending_sync_time') || '0');
            if (Date.now() - pendingSyncTime < 3000) {
                console.log("Recent local write detected. Ignoring cloud reflection...");
                return;
            }

            const data = doc.data();
            let changed = false;
            
            // Compare and update only if different from current memory state
            const currentProfileStr = JSON.stringify(typeof userProfile !== 'undefined' ? userProfile : {});
            if (data.fitness_profile && data.fitness_profile !== currentProfileStr) {
                userProfile = JSON.parse(data.fitness_profile);
                changed = true;
            }
            
            const currentLogsStr = JSON.stringify(typeof logs !== 'undefined' ? logs : []);
            if (data.fitness_logs && data.fitness_logs !== currentLogsStr) {
                logs = JSON.parse(data.fitness_logs);
                changed = true;
            }
            
            const currentDailyStr = JSON.stringify(typeof dailyData !== 'undefined' ? dailyData : {});
            if (data.fitness_daily && data.fitness_daily !== currentDailyStr) {
                dailyData = JSON.parse(data.fitness_daily);
                changed = true;
            }
            
            const currentRoutinesStr = JSON.stringify(typeof WORKOUT_ROUTINES !== 'undefined' ? WORKOUT_ROUTINES : {});
            if (data.fitness_routines && data.fitness_routines !== currentRoutinesStr) {
                WORKOUT_ROUTINES = JSON.parse(data.fitness_routines);
                changed = true;
            }
            
            const currentCustomFoodsStr = JSON.stringify(typeof customFoods !== 'undefined' ? customFoods : []);
            if (data.customFoods && data.customFoods !== currentCustomFoodsStr) {
                customFoods = JSON.parse(data.customFoods);
                changed = true;
            }
            
            const currentFavoriteFoodIdsStr = JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []);
            if (data.favoriteFoodIds && data.favoriteFoodIds !== currentFavoriteFoodIdsStr) {
                favoriteFoodIds = JSON.parse(data.favoriteFoodIds);
                changed = true;
            }
            
            // Best-effort save to localStorage (bypass quota crashes)
            const keys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'];
            keys.forEach(k => {
                try { if (data[k]) localStorage.setItem(k, data[k]); } catch(e) {}
            });
            
            // Apply Theme
            const savedTheme = data.fitness_theme || 'light';
            const themeToggle = document.getElementById('theme-toggle');
            if (savedTheme !== document.body.getAttribute('data-theme')) {
                if (savedTheme === 'dark') {
                    document.body.setAttribute('data-theme', 'dark');
                    if (themeToggle) themeToggle.checked = true;
                } else {
                    document.body.removeAttribute('data-theme');
                    if (themeToggle) themeToggle.checked = false;
                }
            }
            
            // Re-render UI ONLY if something actually changed from the cloud
            if (changed) {
                if (typeof calculateTargets === 'function') calculateTargets();
                if (typeof setupProfile === 'function') setupProfile();
                if (typeof updateDashboard === 'function') updateDashboard();
                if (typeof renderLogs === 'function') renderLogs();
                if (typeof renderWorkout === 'function') renderWorkout();
                if (typeof updateDailyData === 'function') updateDailyData();
            }
            
        } else {
            saveToFirestore();
        }
    }, (err) => {
        console.error("Error fetching data:", err);
    });
}

window.manualSync = async function() {
    if (auth.currentUser) {
        alert("甇?敺蝡臬撥?嗆????啗???..");
        try {
            const doc = await db.collection('users').doc(auth.currentUser.uid).get({source: 'server'});
            if (doc.exists) {
                const data = doc.data();
                
                userProfile = (data.fitness_profile ? JSON.parse(data.fitness_profile) : null) || {
                    gender: 'male', age: 25, height: 170, weight: 70, activity: 1.375, goal: 'maintain'
                };
                logs = (data.fitness_logs ? JSON.parse(data.fitness_logs) : null) || [];
                dailyData = (data.fitness_daily ? JSON.parse(data.fitness_daily) : null) || {};
                WORKOUT_ROUTINES = (data.fitness_routines ? JSON.parse(data.fitness_routines) : null) || (typeof defaultRoutines !== 'undefined' ? defaultRoutines : {});
                customFoods = (data.customFoods ? JSON.parse(data.customFoods) : null) || [];
                favoriteFoodIds = (data.favoriteFoodIds ? JSON.parse(data.favoriteFoodIds) : null) || [];
                
                const keys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'];
                keys.forEach(k => {
                    try { if (data[k]) localStorage.setItem(k, data[k]); } catch(e) {}
                });
                
                if (typeof calculateTargets === 'function') calculateTargets();
                if (typeof setupProfile === 'function') setupProfile();
                if (typeof updateDashboard === 'function') updateDashboard();
                if (typeof renderLogs === 'function') renderLogs();
                if (typeof renderWorkout === 'function') renderWorkout();
                if (typeof updateDailyData === 'function') updateDailyData();
                
                alert("?郊摰?嚗?);
            } else {
                alert("?脩垢瘝??函?鞈???);
            }
        } catch(e) {
            console.error(e);
            alert("?郊憭望?嚗? + e.message);
        }
    } else {
        alert("隢??餃嚗?);
    }
};

// State
let isApplyingCloudData = false;

let userProfile = JSON.parse(localStorage.getItem('fitness_profile')) || {
    gender: 'male', age: 25, height: 170, weight: 70, activity: 1.375, goal: 'maintain'
};
let logs = JSON.parse(localStorage.getItem('fitness_logs')) || [];
let dailyData = JSON.parse(localStorage.getItem('fitness_daily')) || {};

// Workout Routines
let defaultRoutines = {
    1: { title: "摰隡 ??", exercises: [] },
    2: { title: "??嚗??詨? 嚗??飢", exercises: [
        { name: "?株???", type: "weight", weight: 18, sets: 6, reps: '' },
        { name: "撟單?舀?", type: "time", weight: 0, sets: 4, reps: '1??' },
        { name: "?臭???", type: "cardio", weight: 0, sets: 4, reps: '50銝? },
        { name: "???", type: "cardio", weight: 0, sets: 4, reps: '50銝? },
        { name: "??銝?", type: "cardio", weight: 0, sets: 4, reps: '撌血??0銝? },
        { name: "??頝?(?翰???", type: "cardio", weight: 0, sets: 4, reps: '撌血??0銝? }
    ]},
    3: { title: "??嚗???嚗?鈭", exercises: [
        { name: "擃?舀楛頩?, type: "weight", weight: 18, sets: 4, reps: '' },
        { name: "?唳??交", type: "weight", weight: 18, sets: 4, reps: '' },
        { name: "蝡尿??銝?", type: "weight", weight: 18, sets: 4, reps: '' },
        { name: "銝?隡?箄澈", type: "bodyweight", weight: 0, sets: 4, reps: '' },
        { name: "?葉敶?", type: "weight", weight: 13, sets: 3, reps: '8銝? }
    ]},
    4: { ref: 2 },
    5: { ref: 3 },
    6: { ref: 2 },
    0: { ref: 3 }
};
let WORKOUT_ROUTINES = JSON.parse(localStorage.getItem('fitness_routines')) || defaultRoutines;

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
foodDatabase.categories.unshift({ id: 'custom', name: '?????, icon: 'fluent-emoji-flat:red-heart', color: '#ff6b6b' });

// Load Custom Foods
let customFoods = JSON.parse(localStorage.getItem('customFoods')) || [];
foodDatabase.foods = [...customFoods, ...foodDatabase.foods];

// Load Favorite Foods
let favoriteFoodIds = JSON.parse(localStorage.getItem('favoriteFoodIds')) || [];

// Mock Scanner DB
const mockFoods = [
    { name: "擐?擙剝?瘝?", cal: 450, pro: 35, carb: 12, fat: 28 },
    { name: "?亙熒蝟掖憌?, cal: 180, pro: 4, carb: 38, fat: 1 },
    { name: "?日??蹂噶??, cal: 680, pro: 32, carb: 85, fat: 22 }
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
            setAndSync('fitness_theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            setAndSync('fitness_theme', 'light');
        }
    });

    document.getElementById('date-display').innerText = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
    

    calculateTargets();
    setupNavigation();
    setupProfile();
    setupDailyTracking();
    
    updateDashboard();
    updateDailyData();
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
    
    let pace = userProfile.pace || 'standard';
    
    // ? 皜? (Cut / Fat Loss)
    if (userProfile.goal === 'cut' || userProfile.goal === 'lose') {
        if (pace === 'conservative') {
            TARGET_CALS = Math.round(tdee * 0.9); // -10%
        } else {
            TARGET_CALS = Math.round(tdee * 0.85); // -15%
        }
        TARGET_PRO = Math.round(userProfile.weight * 2.0);
        TARGET_FAT = Math.round(userProfile.weight * 0.9);
    } 
    // ? 憓? (Lean Bulk)
    else if (userProfile.goal === 'bulk' || userProfile.goal === 'gain') {
        if (pace === 'conservative') {
            TARGET_CALS = Math.round(tdee * 1.05); // +5%
        } else {
            TARGET_CALS = Math.round(tdee * 1.10); // +10%
        }
        TARGET_PRO = Math.round(userProfile.weight * 1.8);
        TARGET_FAT = Math.round(userProfile.weight * 0.9);
    } 
    // ?? 憓?皜? (Body Recomposition)
    else if (userProfile.goal === 'recomp') {
        TARGET_CALS = Math.round(tdee * 0.95); // -5%
        TARGET_PRO = Math.round(userProfile.weight * 2.2);
        TARGET_FAT = Math.round(userProfile.weight * 0.8);
    } 
    // ?? 蝬剜??曄? (Maintenance)
    else { 
        TARGET_CALS = Math.round(tdee);
        TARGET_PRO = Math.round(userProfile.weight * 1.8);
        TARGET_FAT = Math.round(userProfile.weight * 0.9);
    }

    // ?雿??函???(Safety Limits)
    let minCals = (userProfile.gender === 'female') ? 1200 : 1500;
    if (TARGET_CALS < minCals) TARGET_CALS = minCals;
    
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
    const ct = document.getElementById('cal-target');
    if (ct) ct.innerText = TARGET_CALS;
}

// ========================
// Workout Logic
// ========================

function renderWorkout() {
    const d = new Date(selectedLogDate);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
    
    // resolve routine ref
    let routine = WORKOUT_ROUTINES[dayOfWeek];
    if (routine.ref !== undefined) {
        routine = WORKOUT_ROUTINES[routine.ref];
    }
    
    const titleEl = document.getElementById('workout-day-title');
    if (titleEl) {
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        const days = ['??, '銝', '鈭?, '銝?, '??, '鈭?, '??];
        titleEl.innerText = `${m}/${dt} (??${days[dayOfWeek]}) - ${routine.title}`;
    }
    
    const container = document.getElementById('workout-list-container');
    if (!container) return;
    
    if (routine.exercises.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 40px; margin-bottom: 16px;">??</div>
                <h3 style="margin-bottom: 8px;">隞予摰隡</h3>
                <p style="color: var(--text-muted); font-size: 14px;">霈??末憟賣敺拙嚗?/p>
            </div>
        `;
        return;
    }
    
    const dailyDataEntry = dailyData[selectedLogDate] || {};
    const loggedWorkouts = dailyDataEntry.workouts || [];
    
    let html = '';
    
    // Track which ones are rendered so we don't render them twice
    const renderedNames = new Set();
    
    // 1. Render Template Exercises
    routine.exercises.forEach((ex, idx) => {
        renderedNames.add(ex.name);
        const logged = loggedWorkouts.find(w => w.name === ex.name);
        let statusHtml = '';
        if (logged) {
            statusHtml = `<div style="font-size: 12px; color: var(--accent-secondary); margin-top: 4px;">
                <i class="fa-solid fa-check"></i> ${logged.weight > 0 ? logged.weight + 'kg, ' : ''}${logged.sets}蝯? ${logged.reps}
            </div>`;
        } else {
            statusHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                ?格?: ${ex.weight > 0 ? ex.weight + 'kg, ' : ''}${ex.sets}蝯? ${ex.reps}
            </div>`;
        }
        
        let icon = ex.type === 'cardio' ? 'fa-heart-pulse' : (ex.type === 'time' ? 'fa-stopwatch' : 'fa-dumbbell');
        
        html += `
            <div class="card log-item" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 12px;">
                <!-- Left: Details (Click to edit) -->
                <div style="display: flex; align-items: center; gap: 16px; flex: 1; cursor: pointer;" onclick="openWorkoutModal('${ex.name}')">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-main);">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 500; font-size: 16px;">${ex.name}</div>
                        ${statusHtml}
                    </div>
                </div>
                <!-- Right: Checkbox -->
                <div style="font-size: 28px; color: ${logged ? 'var(--accent-secondary)' : 'var(--card-border)'}; padding: 8px 0 8px 16px; cursor: pointer;" onclick="toggleWorkoutCheck('${ex.name}')">
                    <i class="fa-${logged ? 'solid' : 'regular'} fa-circle-check"></i>
                </div>
            </div>
        `;
    });
    
    // 2. Render Custom Logged Exercises
    loggedWorkouts.forEach(logged => {
        if (!renderedNames.has(logged.name)) {
            let statusHtml = `<div style="font-size: 12px; color: var(--accent-secondary); margin-top: 4px;">
                <i class="fa-solid fa-check"></i> ${logged.weight > 0 ? logged.weight + 'kg, ' : ''}${logged.sets}蝯? ${logged.reps}
            </div>`;
            
            // For custom, if weight is 0, we assume it's cardio
            let icon = logged.weight > 0 ? 'fa-dumbbell' : 'fa-heart-pulse';
            
            html += `
                <div class="card log-item" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 12px;">
                    <!-- Left: Details (Click to edit) -->
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1; cursor: pointer;" onclick="openWorkoutModal('${logged.name}')">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-main);">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 500; font-size: 16px;">${logged.name}</div>
                            ${statusHtml}
                        </div>
                    </div>
                    <!-- Right: Checkbox -->
                    <div style="font-size: 28px; color: var(--accent-secondary); padding: 8px 0 8px 16px; cursor: pointer;" onclick="toggleWorkoutCheck('${logged.name}')">
                        <i class="fa-solid fa-circle-check"></i>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

function toggleWorkoutCheck(name) {
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
    }
    if (!dailyData[selectedLogDate].workouts) {
        dailyData[selectedLogDate].workouts = [];
    }
    
    let workouts = dailyData[selectedLogDate].workouts;
    const existingIdx = workouts.findIndex(w => w.name === name);
    
    if (existingIdx >= 0) {
        // Logged -> Unlog
        workouts.splice(existingIdx, 1);
    } else {
        // Unlogged -> Log with default values from template or last record
        const d = new Date(selectedLogDate);
        const dayOfWeek = d.getDay();
        let routineKey = dayOfWeek;
        if (WORKOUT_ROUTINES[dayOfWeek].ref !== undefined) {
            routineKey = WORKOUT_ROUTINES[dayOfWeek].ref;
        }
        const templateEx = WORKOUT_ROUTINES[routineKey].exercises.find(e => e.name === name);
        
        let weight = templateEx ? templateEx.weight : 0;
        let sets = templateEx ? templateEx.sets : 0;
        let reps = templateEx ? templateEx.reps : '';
        
        workouts.push({ name, weight, sets, reps });
    }
    
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    renderWorkout();
}

function openWorkoutModal(name) {
    const d = new Date(selectedLogDate);
    const dayOfWeek = d.getDay();
    let routine = WORKOUT_ROUTINES[dayOfWeek];
    if (routine.ref !== undefined) routine = WORKOUT_ROUTINES[routine.ref];
    
    const templateEx = routine.exercises.find(e => e.name === name);
    
    document.getElementById('workout-index-val').value = 0; // dummy value to indicate not a new custom
    document.getElementById('workout-name-val').value = name;
    document.getElementById('workout-modal-title').innerText = name;
    
    // Hide custom fields, show title
    document.getElementById('workout-modal-title').style.display = 'block';
    document.getElementById('workout-custom-name-container').style.display = 'none';
    document.getElementById('workout-custom-type-container').style.display = 'none';
    
    // Look up today's logged data
    const dailyDataEntry = dailyData[selectedLogDate] || {};
    const loggedWorkouts = dailyDataEntry.workouts || [];
    const logged = loggedWorkouts.find(w => w.name === name);
    
    // Show/Hide Delete Button based on state
    const btnDelete = document.getElementById('btn-delete-workout');
    if (templateEx) {
        btnDelete.style.display = 'block';
        btnDelete.innerText = '?芷';
        btnDelete.onclick = function() { deleteWorkoutRecord(name); };
    } else {
        // If it's not in the template (e.g. an old custom exercise that was removed from template but still in log)
        // or a completely new exercise.
        if (logged) {
            btnDelete.style.display = 'block';
            btnDelete.innerText = '?芷';
            btnDelete.onclick = function() { deleteWorkoutRecord(name); };
        } else {
            btnDelete.style.display = 'none';
        }
    }
    
    document.getElementById('workout-weight-val').value = logged ? logged.weight : (templateEx ? templateEx.weight : '');
    document.getElementById('workout-sets-val').value = logged ? logged.sets : (templateEx ? templateEx.sets : '');
    document.getElementById('workout-reps-val').value = logged ? logged.reps : (templateEx ? templateEx.reps : '');
    
    // Determine type to show/hide weight container
    let exType = 'weight';
    if (templateEx) {
        exType = templateEx.type;
    } else if (logged && logged.weight === 0) {
        exType = 'cardio';
    }
    
    if (exType === 'cardio' || exType === 'bodyweight' || exType === 'time') {
        document.getElementById('workout-weight-container').style.display = 'none';
    } else {
        document.getElementById('workout-weight-container').style.display = 'block';
    }
    
    // Look up previous record
    const lastRecordEl = document.getElementById('workout-modal-last-record');
    let lastRecord = null;
    let daysToCheck = 30; // look back up to 30 days
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
        lastRecordEl.innerText = `銝活蝝?? ${lastRecord.weight > 0 ? lastRecord.weight + 'kg, ' : ''}${lastRecord.sets}蝯? ${lastRecord.reps}`;
        lastRecordEl.style.display = 'block';
    } else {
        lastRecordEl.style.display = 'none';
    }
    
    // Set Save button text
    const btnSave = document.getElementById('btn-save-workout');
    btnSave.innerText = '?脣?';
    
    document.getElementById('workout-setup-modal').style.display = 'flex';
}

function closeWorkoutModal() {
    document.getElementById('workout-setup-modal').style.display = 'none';
}

function openAddExerciseModal() {
    document.getElementById('workout-index-val').value = -1;
    document.getElementById('workout-name-val').value = '';
    
    // Show custom fields, hide title
    document.getElementById('workout-modal-title').style.display = 'none';
    document.getElementById('workout-custom-name-container').style.display = 'block';
    document.getElementById('workout-custom-type-container').style.display = 'block';
    
    document.getElementById('workout-custom-name-val').value = '';
    document.getElementById('workout-custom-type-val').value = 'weight';
    toggleWorkoutModalType();
    
    document.getElementById('workout-weight-val').value = '';
    document.getElementById('workout-sets-val').value = '';
    document.getElementById('workout-reps-val').value = '';
    
    document.getElementById('workout-modal-last-record').style.display = 'none';
    document.getElementById('btn-delete-workout').style.display = 'none';
    document.getElementById('btn-save-workout').innerText = '摰??';
    
    document.getElementById('workout-setup-modal').style.display = 'flex';
}

function toggleWorkoutModalType() {
    const type = document.getElementById('workout-custom-type-val').value;
    if (type === 'cardio') {
        document.getElementById('workout-weight-container').style.display = 'none';
    } else {
        document.getElementById('workout-weight-container').style.display = 'block';
    }
}

function confirmWorkoutEdit() {
    const idx = parseInt(document.getElementById('workout-index-val').value);
    let name = document.getElementById('workout-name-val').value;
    
    const weight = parseFloat(document.getElementById('workout-weight-val').value) || 0;
    const sets = parseInt(document.getElementById('workout-sets-val').value) || 0;
    const reps = document.getElementById('workout-reps-val').value.trim();
    
    const d = new Date(selectedLogDate);
    const dayOfWeek = d.getDay();
    let routineKey = dayOfWeek;
    if (WORKOUT_ROUTINES[dayOfWeek].ref !== undefined) {
        routineKey = WORKOUT_ROUTINES[dayOfWeek].ref;
    }
    
    if (idx === -1) {
        name = document.getElementById('workout-custom-name-val').value.trim();
        if (!name) {
            alert("隢撓?亙?雿?蝔?);
            return;
        }
        
        // Add to template routine so it appears on subsequent days
        const customType = document.getElementById('workout-custom-type-val').value;
        const exists = WORKOUT_ROUTINES[routineKey].exercises.find(e => e.name === name);
        if (!exists) {
            WORKOUT_ROUTINES[routineKey].exercises.push({
                name: name,
                type: customType,
                weight: weight,
                sets: sets,
                reps: reps
            });
            setAndSync('fitness_routines', JSON.stringify(WORKOUT_ROUTINES));
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
        workouts[existingIdx] = { name, weight, sets, reps };
    } else {
        workouts.push({ name, weight, sets, reps });
    }
    
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    
    closeWorkoutModal();
    renderWorkout();
}

function deleteWorkoutRecord(name) {
    const d = new Date(selectedLogDate);
    const dayOfWeek = d.getDay();
    let routineKey = dayOfWeek;
    if (WORKOUT_ROUTINES[dayOfWeek].ref !== undefined) {
        routineKey = WORKOUT_ROUTINES[dayOfWeek].ref;
    }
    
    const days = ['??,'銝','鈭?,'銝?,'??,'鈭?,'??];
    if (confirm(`蝣箏?閬???{name}??文?嚗n(憒???箏?隤脰”?抒???嚗?敺玨銵其葉瘞訾?蝘駁)`)) {
        // Remove from template
        if (WORKOUT_ROUTINES[routineKey]) {
            WORKOUT_ROUTINES[routineKey].exercises = WORKOUT_ROUTINES[routineKey].exercises.filter(e => e.name !== name);
            setAndSync('fitness_routines', JSON.stringify(WORKOUT_ROUTINES));
        }
        
        // Also remove from today's log just in case
        if (dailyData[selectedLogDate] && dailyData[selectedLogDate].workouts) {
            dailyData[selectedLogDate].workouts = dailyData[selectedLogDate].workouts.filter(w => w.name !== name);
            setAndSync('fitness_daily', JSON.stringify(dailyData));
        }
    } else {
        return; // Don't close modal if cancelled
    }
    
    closeWorkoutModal();
    renderWorkout();
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
            if (targetId === 'view-overview') renderOverview();
            if (targetId === 'view-workout') renderWorkout();
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
        setAndSync('gemini_api_key', key);
        alert("API Key 撌脣摮?");
        openScanner(); // refresh UI
    } else {
        alert("隢撓?交??? API Key嚗?);
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
            const progContainer = document.getElementById('scan-progress-container');
            const progBar = document.getElementById('scan-progress-bar');
            const progText = document.getElementById('scan-progress-text');
            
            progContainer.style.display = 'block';
            progBar.style.width = '0%';
            progText.innerText = '0%';
            
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 8 + 4; // Add 4-12%
                if (progress > 95) progress = 95;
                progText.innerText = Math.floor(progress) + '%';
                progBar.style.width = progress + '%';
            }, 500);
            
            const img = new Image();
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX = 800;
                if (width > height) {
                    if (width > MAX) { height *= MAX / width; width = MAX; }
                } else {
                    if (height > MAX) { width *= MAX / height; height = MAX; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                
                const base64String = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
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
                                    { text: "雿銝雿?璆剔?擗葦?????撐?抒??n\n?????內嚗n1. 憒??抒??胯?擗?蝷箝?隢?亦移皞???蝐支??之?～??質釭?４瘞渲???詨潘?銝虫???鋆蜇隞賡?蝞?港遢??潦n2. 憒??抒??臭??祇??抬?隢摯蝞??????(grams)嚗蝙?典??虜閬?蝔梧?銝行??蝳鞈?摨怨?蝞?蝯?蝳迫雿摯?梢?嚗n3. 隢鼠?隞賡??拇銝??2-5 ???蜇?迂 (靘?: ?爸靘輻??憟嗚???)?n\n隞亙?潛? JSON ?拐辣?澆??嚗?閬?markdown 隤??撘?{ \"meal_name\": \"摮葡\", \"items\": [ { \"name\": \"璅?憌?", \"grams\": ?詨?, \"cal\": ?詨?, \"pro\": ?詨?, \"carb\": ?詨?, \"fat\": ?詨? } ] }" },
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
                const match = jsonText.match(/\{[\s\S]*\}/);
                if (match) {
                    jsonText = match[0];
                } else {
                    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                }
                
                const aiResults = JSON.parse(jsonText);
                
                document.getElementById('scan-meal-name').value = aiResults.meal_name || 'AI ?箸蝯?擗?;
                
                const itemsArray = aiResults.items || aiResults; // Fallback if AI still returns array
                currentScanItems = itemsArray.map(item => {
                    // Grounding: Use local food database for 100% accurate macro calculations if matched
                    const dbMatch = foodDatabase.foods.find(f => f.name.includes(item.name) || item.name.includes(f.name.split(' (')[0]));
                    if (dbMatch && item.grams) {
                        const matchGrams = dbMatch.name.match(/\b(\d+)g\)/);
                        if (matchGrams && matchGrams[1]) {
                            const stdGrams = parseInt(matchGrams[1]);
                            const ratio = item.grams / stdGrams;
                            item.cal = Math.round(dbMatch.cals * ratio);
                            item.pro = Math.round(dbMatch.macros.p * ratio * 10) / 10;
                            item.carb = Math.round(dbMatch.macros.c * ratio * 10) / 10;
                            item.fat = Math.round(dbMatch.macros.f * ratio * 10) / 10;
                        }
                    }

                    return {
                        id: 'ai_' + Date.now() + Math.random(),
                        name: item.name,
                        grams: item.grams,
                        cal: item.cal,
                        pro: item.pro,
                        carb: item.carb,
                        fat: item.fat,
                        checked: true
                    };
                });
                
                renderScanChecklist();
                
                clearInterval(progressInterval);
                progText.innerText = '100%';
                progBar.style.width = '100%';
                
                setTimeout(() => {
                    progContainer.style.display = 'none';
                    document.getElementById('scan-result').classList.remove('hidden');
                    document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
                }, 400);
                
            } catch (err) {
                clearInterval(progressInterval);
                progContainer.style.display = 'none';
                alert('API ?澆憭望?嚗?瑼Ｘ API Key ??撘?\\n' + err.message);
                document.getElementById('btn-camera').style.display = 'block';
            }
            };
            img.src = e.target.result;
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
                    <div style="font-size: 12px; color: var(--text-muted);">蝝?${item.grams}g</div>
                </div>
            </div>
            <div style="font-weight: 600; color: var(--accent-primary);">${item.cal} kcal</div>
        </label>
    `).join('');
}

function toggleScanItem(index) {
    currentScanItems[index].checked = !currentScanItems[index].checked;
}

function resetScanner() {
    const fileInput = document.getElementById('file-input');
    if(fileInput) fileInput.value = '';
    
    document.getElementById('image-preview').src = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('camera-icon').style.display = 'block';
    document.getElementById('scan-result').classList.add('hidden');
    document.getElementById('btn-camera').style.display = 'block';
    
    const mealNameInput = document.getElementById('scan-meal-name');
    if(mealNameInput) mealNameInput.value = '';
}

function confirmScanResults() {
    try {
        const selectedItems = currentScanItems.filter(item => item.checked);
        if(selectedItems.length === 0) {
            alert("隢撠?訾????抬?");
            return;
        }
        
        const mealType = document.getElementById('scan-meal-type').value;
        const now = new Date();
        const mealNameInput = document.getElementById('scan-meal-name').value.trim();
        const groupName = mealNameInput || 'AI ?箸蝯?擗?;

        const totalCal = selectedItems.reduce((sum, item) => sum + item.cal, 0);
        const totalPro = selectedItems.reduce((sum, item) => sum + (item.pro || 0), 0);
        const totalCarb = selectedItems.reduce((sum, item) => sum + (item.carb || 0), 0);
        const totalFat = selectedItems.reduce((sum, item) => sum + (item.fat || 0), 0);
        
        const newLog = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            date: todayDateStr,
            time: now.toTimeString().substring(0,5),
            meal: mealType,
            name: groupName,
            cal: Math.round(totalCal),
            pro: Math.round(totalPro * 10) / 10,
            carb: Math.round(totalCarb * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
            subItems: selectedItems
        };
        
        logs.unshift(newLog);
        setAndSync('fitness_logs', JSON.stringify(logs));
        
        // Update UI and close
        renderLogs();
        if (typeof updateDashboard === 'function') updateDashboard();
        
        alert(`??撠?${selectedItems.length} ???拇????亦???`);
        
        closeScanner();
        
        // Ensure Dashboard is visible
        const dashboardBtn = document.querySelector('[data-target="view-dashboard"]');
        if (dashboardBtn) dashboardBtn.click();
        
        resetScanner();
        
    } catch (e) {
        alert("蝣箄???隤? " + e.message);
        console.error(e);
    }
}

// Dashboard Updates
function updateDashboard() {
    const greeting = document.getElementById('overview-greeting');
    if (greeting) {
        greeting.innerText = userProfile.nickname ? `${userProfile.nickname} ?蜇閬窯 : '蝮質汗';
    }
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
    if (remaining < 0) remaining = 0;

    document.getElementById('cal-eaten').innerText = Math.round(todayEaten);
    document.getElementById('cal-remaining').innerText = Math.round(remaining);
    
    // Arc Math (half-circle circumference = 188.5)
    const arcFill = document.getElementById('cal-arc');
    if (arcFill) {
        let percent = Math.min(todayEaten / TARGET_CALS, 1);
        arcFill.style.strokeDashoffset = 188.5 - (188.5 * percent);
    }

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
    
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }).replace('/', '??) + '??;
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
    const mealMap = { breakfast: '?拚?', lunch: '??', dinner: '??', snack: '??' };
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
        document.getElementById('db-category-title').innerText = '??蝯?';
        filteredFoods = foodDatabase.foods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
        const title = foodDatabase.categories.find(c => c.id === activeCategory).name;
        document.getElementById('db-category-title').innerText = title + '憿?;
        
        if (activeCategory === 'custom') {
            filteredFoods = foodDatabase.foods.filter(f => f.categoryId === 'custom' || favoriteFoodIds.includes(f.id));
        } else {
            filteredFoods = foodDatabase.foods.filter(f => f.categoryId === activeCategory);
        }
    }
    
    list.innerHTML = filteredFoods.map(food => {
        const isFav = favoriteFoodIds.includes(food.id) || food.categoryId === 'custom';
        const cat = foodDatabase.categories.find(c => c.id === food.categoryId) || { icon: 'fluent-emoji-flat:fork-and-knife-with-plate', color: '#ccc' };
        const catColor = cat.color || 'var(--accent-primary)';
        const renderIcon = `<span class="iconify" data-icon="${food.icon}" style="font-size: 24px;"></span>`;
        
        return `
        <div class="food-db-item" onclick="selectFood('${food.id}')">
            <div style="display:flex; align-items:center;">
                <div style="margin-right: 12px; width: 48px; height: 48px; background: ${catColor}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">${renderIcon}</div>
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
        alert('??典遣蝡??芾?憌嚗?閮剜??冽????葉??');
        return;
    }
    
    if (favoriteFoodIds.includes(id)) {
        favoriteFoodIds = favoriteFoodIds.filter(fId => fId !== id);
    } else {
        favoriteFoodIds.push(id);
    }
    setAndSync('favoriteFoodIds', JSON.stringify(favoriteFoodIds));
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
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
                    <div style="font-size: 12px; color: var(--text-muted);">${item.cal} ???/div>
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
        setAndSync('fitness_logs', JSON.stringify(logs));
        if (typeof triggerAutoSync === 'function') triggerAutoSync();
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
        
        const mealMap = { breakfast: '?拚?', lunch: '??', dinner: '??', snack: '??' };
        alert(`撌脣??冽??${mealMap[currentAddingMeal]} ??${yestLogs.length} ???拙??亙??賊??支葉嚗?暺?撌虫?閫??賊??扎Ⅱ隤?);
    } else {
        alert('?冽甇日??∩遙雿???);
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
    const btnBurnedPlus = document.getElementById('btn-burned-plus');
    if (btnBurnedPlus) {
        btnBurnedPlus.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent clicking the card to edit
            if (!dailyData[todayDateStr].burned) dailyData[todayDateStr].burned = 0;
            dailyData[todayDateStr].burned += 50; 
            updateDailyData();
        });
    }

    const btnBurnedMinus = document.getElementById('btn-burned-minus');
    if (btnBurnedMinus) {
        btnBurnedMinus.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent clicking the card to edit
            if (!dailyData[todayDateStr].burned) dailyData[todayDateStr].burned = 0;
            dailyData[todayDateStr].burned = Math.max(0, dailyData[todayDateStr].burned - 50);
            updateDailyData();
        });
    }

    inputDailyWeight.addEventListener('change', (e) => {
        const newWeight = parseFloat(e.target.value);
        if (!isNaN(newWeight)) {
            dailyData[todayDateStr].weight = newWeight;
            updateDailyData();
        }
    });
}

function updateDailyData() {
    document.getElementById('water-val').innerText = dailyData[todayDateStr].water;
    
    const inputDailyWeight = document.getElementById('daily-weight');
    if (inputDailyWeight && document.activeElement !== inputDailyWeight) {
        inputDailyWeight.value = dailyData[todayDateStr].weight || userProfile.weight || 70;
    }
    
    // Also update burned
    const burnedEl = document.getElementById('cal-burned');
    if (burnedEl) {
        burnedEl.innerText = dailyData[todayDateStr].burned || 0;
    }
    const burnedTimeEl = document.getElementById('cal-burned-time');
    const burnedTimeValEl = document.getElementById('cal-burned-time-val');
    if (burnedTimeEl && burnedTimeValEl) {
        const bTime = dailyData[todayDateStr].burnedTime || 0;
        if (bTime > 0) {
            burnedTimeValEl.innerText = bTime;
            burnedTimeEl.style.display = 'inline-flex';
        } else {
            burnedTimeEl.style.display = 'none';
        }
    }

    setAndSync('fitness_daily', JSON.stringify(dailyData));
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
}

window.promptEditWater = function() {
    if (!dailyData[todayDateStr]) {
        dailyData[todayDateStr] = { water: 0, weight: userProfile.weight || 70 };
    }
    const current = dailyData[todayDateStr].water || 0;
    document.getElementById('water-input-val').value = current;
    document.getElementById('water-setup-modal').style.display = 'flex';
};

window.closeWaterModal = function() {
    document.getElementById('water-setup-modal').style.display = 'none';
};

window.confirmWaterEdit = function() {
    const val = document.getElementById('water-input-val').value;
    if (val !== null && val.trim() !== '' && !isNaN(val)) {
        dailyData[todayDateStr].water = Math.max(0, parseInt(val) || 0);
        updateDailyData();
        renderLogs();
    }
    closeWaterModal();
};

window.promptEditBurned = function() {
    if (!dailyData[todayDateStr]) {
        dailyData[todayDateStr] = { water: 0, weight: userProfile.weight || 70, burned: 0, burnedTime: 0 };
    }
    const current = dailyData[todayDateStr].burned || 0;
    const currentTime = dailyData[todayDateStr].burnedTime || 0;
    document.getElementById('burned-input-val').value = current;
    document.getElementById('burned-time-input-val').value = currentTime;
    document.getElementById('burned-setup-modal').style.display = 'flex';
};

window.closeBurnedModal = function() {
    document.getElementById('burned-setup-modal').style.display = 'none';
};

window.addBurnedKcal = function(amount, time = 0) {
    const input = document.getElementById('burned-input-val');
    const current = parseInt(input.value) || 0;
    input.value = current + amount;
    
    const timeInput = document.getElementById('burned-time-input-val');
    const currentTime = parseInt(timeInput.value) || 0;
    timeInput.value = currentTime + time;
};

window.confirmBurnedEdit = function() {
    const val = document.getElementById('burned-input-val').value;
    const timeVal = document.getElementById('burned-time-input-val').value;
    if (val !== null && val.trim() !== '' && !isNaN(val)) {
        dailyData[todayDateStr].burned = Math.max(0, parseInt(val) || 0);
        dailyData[todayDateStr].burnedTime = Math.max(0, parseInt(timeVal) || 0);
        updateDailyData();
    }
    closeBurnedModal();
};

// Info Modals
function showInfo(type) {
    const title = document.getElementById('info-modal-title');
    const content = document.getElementById('info-modal-content');
    
    if (type === 'bmi') {
        title.innerHTML = '<i class="fa-solid fa-weight-scale" style="color: var(--accent-primary); margin-right: 8px;"></i>BMI 閮??砍?';
        content.innerHTML = `
            <p style="margin-bottom: 8px;"><strong>閮??砍?嚗?/strong></p>
            <p style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-family: monospace; text-align: center; margin-bottom: 16px;">
                BMI = 擃?(kg) / (頨恍?(m) ? 頨恍?(m))
            </p>
            <p style="margin-bottom: 8px;"><strong>?亙熒蝭???</strong></p>
            <ul style="padding-left: 20px; line-height: 1.6; font-size: 14px; margin-bottom: 12px;">
                <li>擃???: BMI < 18.5</li>
                <li>?亙熒擃?: 18.5 ??BMI < 24.0</li>
                <li>??蝭?: 24.0 ??BMI < 27.0</li>
                <li>?亥?霅西?: BMI ??27.0</li>
            </ul>
            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; background: rgba(255, 184, 108, 0.1); padding: 8px; border-radius: 8px; border-left: 3px solid #ffb86c;">
                <i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i> <strong>?批??BMI嚗?/strong><br>
                ?犖??BMI ?亙熒璅???strong>銝??批</strong>??嚗???? BMI ?⊥??儘?????芰?瘥?嚗憟單批?見??BMI 銝?擃???賣???憭批榆?堆??迨撱箄降?剝?擃???韏瑕????湔?蝣綽?
            </p>
        `;
    }

    if (type === 'water') {
        title.innerHTML = '<i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>憌脫偌撱箄降';
        content.innerHTML = `
            <p>瘥撱箄降憌脫偌??<strong style="color: var(--accent-secondary); font-size: 16px;">${TARGET_WATER} ml</strong></p>
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px;">
                <p style="margin-bottom: 4px;"><strong>閮??砍?嚗?/strong></p>
                <p>擃? ${userProfile.weight} kg * 35 ml = <strong>${TARGET_WATER} ml</strong></p>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">* 撱箄降?活撠憌脩嚗瘚?憭?拙漲憓???/p>
        `;
    } else if (type === 'burned') {
        title.innerHTML = '<i class="fa-solid fa-fire" style="color: #ff9ff3; margin-right: 8px;"></i>??瘨???;
        content.innerHTML = `
            <p><strong>???箇??蝝??銝蔣?踵??亙?????/strong></p>
            <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px; line-height: 1.5;">
                <p style="color: #ffb86c; font-weight: 600; margin-bottom: 8px;"><i class="fa-solid fa-triangle-exclamation"></i> ?箔?暻潔?憓??臬??梢?嚗?/p>
                <p>?雿??DEE 瘥蝮賣??歇蝬??思?雿??<strong>瘣餃?靽</strong> (靘?瘥梢???3 甈?????????憭??????????strong>??閮? (Double Counting)</strong>嚗憯?撩??嚗?/p>
            </div>
            <p style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">* 隢?亦?擗?kcal??敹?嚗??駁??停靘ㄐ閮?銝蝑?荔?</p>
        `;
    } else if (type === 'cals') {
        let bmr = 0;
        let bmrFormula = '';
        let genderConstant = userProfile.gender === 'male' ? '+ 5 (?瑟批虜??' : '- 161 (憟單批虜??';
        let constantVal = userProfile.gender === 'male' ? '+ 5' : '- 161';
        
        if (userProfile.gender === 'male') {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5;
        } else {
            bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) - 161;
        }
        
        bmrFormula = `
            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 6px; line-height: 1.5;">
                <span style="color: var(--text-main);">10</span> ? 擃?(kg) + <span style="color: var(--text-main);">6.25</span> ? 頨恍?(cm) - <span style="color: var(--text-main);">5</span> ? 撟湧翩 <span style="color: var(--text-main);">${genderConstant}</span>
            </div>
            <div>
                10 * <span style="color: var(--accent-secondary); font-weight: bold;">${userProfile.weight}</span> + 6.25 * <span style="color: var(--accent-secondary); font-weight: bold;">${userProfile.height}</span> - 5 * <span style="color: var(--accent-secondary); font-weight: bold;">${userProfile.age}</span> <span style="color: var(--accent-secondary); font-weight: bold;">${constantVal}</span> = <strong>${Math.round(bmr)}</strong>
            </div>
        `;

        let tdee = bmr * parseFloat(userProfile.activity);
        
        let goalText = '蝬剜??曄? (?∟矽??';
        let targetCalText = `TDEE = <strong>${TARGET_CALS} kcal</strong>`;
        let pace = userProfile.pace || 'standard';
        
        if(userProfile.goal === 'cut' || userProfile.goal === 'lose') {
            if (pace === 'conservative') {
                goalText = '蝛拙皜? (-10%)';
                targetCalText = `${Math.round(tdee)} * 0.9 = <strong>${TARGET_CALS} kcal</strong>`;
            } else {
                goalText = '蝛拙皜? (-15%)';
                targetCalText = `${Math.round(tdee)} * 0.85 = <strong>${TARGET_CALS} kcal</strong>`;
            }
        } else if (userProfile.goal === 'bulk' || userProfile.goal === 'gain') {
            if (pace === 'conservative') {
                goalText = '銋暹楊憓? (+5%)';
                targetCalText = `${Math.round(tdee)} * 1.05 = <strong>${TARGET_CALS} kcal</strong>`;
            } else {
                goalText = '銋暹楊憓? (+10%)';
                targetCalText = `${Math.round(tdee)} * 1.10 = <strong>${TARGET_CALS} kcal</strong>`;
            }
        } else if (userProfile.goal === 'recomp') {
            goalText = '頨恍??? (-5%)';
            targetCalText = `${Math.round(tdee)} * 0.95 = <strong>${TARGET_CALS} kcal</strong>`;
        }

        let minCals = (userProfile.gender === 'female') ? 1200 : 1500;
        if (TARGET_CALS === minCals) {
            targetCalText += ` <br><span style="color:#ff6b6b; font-size:11px;">(撌脰孛?潭?雿??函?霅?${minCals} kcal)</span>`;
        }

        title.innerHTML = '<i class="fa-solid fa-calculator" style="color: var(--accent-primary); margin-right: 8px;"></i>?格??梢?隤芣?';
        content.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 1: ?箇?隞????(BMR)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">蝬剜??????雿???蝙??Mifflin-St Jeor ?砍?嚗?/p>
                    <p>${bmrFormula}</p>
                </div>
                
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 2: 瘥蝮賣????(TDEE)</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">BMR 銋?瘣餃?靽敺瘥蝮賣????/p>
                    <p>${Math.round(bmr)} * ${userProfile.activity} (瘣餃?靽) = <strong>${Math.round(tdee)} kcal</strong></p>
                </div>

                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">STEP 3: ?格??梢?</p>
                    <p style="color: var(--text-muted); margin-bottom: 4px;">?寞??格?隤踵蝮賜??${goalText}</p>
                    <p>${targetCalText}</p>
                </div>
            </div>
        `;
    } else if (type === 'macros') {
        let proMultiplier = 1.8;
        let fatMultiplier = 0.9;
        let pace = userProfile.pace || 'standard';
        if (userProfile.goal === 'cut' || userProfile.goal === 'lose') {
            proMultiplier = 2.0;
        } else if (userProfile.goal === 'recomp') {
            proMultiplier = 2.2;
            fatMultiplier = 0.8;
        }

        title.innerHTML = '<i class="fa-solid fa-calculator" style="color: var(--accent-primary); margin-right: 8px;"></i>?格???蝝牧??;
        content.innerHTML = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
                <div style="background: var(--bg-main); padding: 12px; border-radius: 8px; font-size: 13px;">
                    <p style="margin-bottom: 6px; color: var(--accent-primary); font-weight: 600;">銝之??蝝???/p>
                    <p style="color: var(--text-muted); margin-bottom: 8px;">隞仿???箸?閮??鞈芾??嚗蒂?函４瘞游‵皛踹擗??/p>
                    
                    <p style="margin-bottom: 4px;"><strong>?鞈?(瘥?日???* ${proMultiplier}g)</strong></p>
                    <p style="margin-bottom: 4px; color: var(--text-muted); font-size: 12px;">${userProfile.weight} kg * ${proMultiplier}</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--pro-color);">${TARGET_PRO} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_PRO * 4} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>? (瘥?日???* ${fatMultiplier}g)</strong></p>
                    <p style="margin-bottom: 4px; color: var(--text-muted); font-size: 12px;">${userProfile.weight} kg * ${fatMultiplier}</p>
                    <p style="margin-bottom: 8px; text-align: right;">= <strong style="color: var(--fat-color);">${TARGET_FAT} g</strong> <span style="color:var(--text-muted); font-size:11px;">(${TARGET_FAT * 9} kcal)</span></p>
                    
                    <p style="margin-bottom: 4px;"><strong>蝣單偌 (?梢?憛急遛)</strong></p>
                    <p style="margin-bottom: 4px; font-size: 11px;">(${TARGET_CALS} - ?鞈芰??- ??梢?) 繩 4</p>
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
    const strips = document.querySelectorAll('.date-strip');
    const baseDate = new Date(selectedLogDate || todayDateStr);
    const currentDayOfWeek = baseDate.getDay();
    const days = ['??, '銝', '鈭?, '銝?, '??, '鈭?, '??];
    
    let html = '';
    for(let i=0; i<7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - currentDayOfWeek + i);
        
        const dateStr = formatDate(d);
        const dayName = (dateStr === todayDateStr) ? '隞? : days[i];
        const dateNum = d.getDate();
        
        const activeClass = (dateStr === selectedLogDate) ? 'active' : '';
        html += `
            <div class="date-item ${activeClass}" onclick="selectLogDate('${dateStr}')" style="height: 48px;">
                <span style="font-size: 11px;">${dayName}</span>
                <span style="font-size: 16px; font-weight: 600; margin-top: 2px;">${dateNum}</span>
            </div>
        `;
    }
    
    strips.forEach(strip => {
        strip.innerHTML = html;
    });
}

function selectLogDate(dateStr) {
    selectedLogDate = dateStr;
    renderDateStrip();
    renderLogs();
    
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    document.getElementById('log-view-title').innerText = `蝝??(${m}/${dt})`;
    
    // Also update workout tab if it's active
    renderWorkout();
}

function renderLogs() {
    const container = document.getElementById('all-logs');
    const mealMap = { 
        breakfast: '<span class="iconify" data-icon="fluent-emoji-flat:cooking" style="margin-right:8px; font-size:18px;"></span>?拚?', 
        lunch: '<span class="iconify" data-icon="fluent-emoji-flat:bento-box" style="margin-right:8px; font-size:18px;"></span>??', 
        dinner: '<span class="iconify" data-icon="fluent-emoji-flat:fork-and-knife-with-plate" style="margin-right:8px; font-size:18px;"></span>??', 
        snack: '<span class="iconify" data-icon="fluent-emoji-flat:cookie" style="margin-right:8px; font-size:18px;"></span>??' 
    };
    
    let html = '';

    // Water Log Card
    const waterAmount = (dailyData[selectedLogDate] && dailyData[selectedLogDate].water) ? dailyData[selectedLogDate].water : 0;
    const waterPercent = Math.min((waterAmount / TARGET_WATER) * 100, 100);

    html += `
        <div class="meal-group-card" style="margin-bottom: 16px;">
            <div class="meal-group-header" style="margin-bottom: 12px; align-items: center;">
                <div style="display:flex; align-items:baseline;">
                    <h3><i class="fa-solid fa-droplet" style="color: var(--accent-secondary); margin-right: 8px;"></i>憌脫偌</h3>
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



    const dayLogs = logs.filter(log => (log.date || todayDateStr) === selectedLogDate);
    
    // Removing the early return so that empty meal categories are always rendered.


    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
    dayLogs.forEach(log => {
        grouped[log.meal || 'snack'].push(log);
    });

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        let mealCal = 0;
        let itemsHTML = '';
        
        if(grouped[meal].length > 0) {
            grouped[meal].forEach(item => {
                    mealCal += item.cal;
                    
                    if (item.subItems && item.subItems.length > 0) {
                        let subHTML = '';
                        item.subItems.forEach(sub => {
                            let sIconHtml = '?儭?;
                            let sIconStyle = 'width:28px; height:28px; background:var(--bg-main); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size: 14px;';
                            const sBaseName = sub.name.split(' (')[0];
                            const sDbFood = foodDatabase.foods.find(f => f.name.includes(sBaseName));
                            if(sDbFood) {
                                const sCat = foodDatabase.categories.find(c => c.id === sDbFood.categoryId) || { icon: 'fluent-emoji-flat:fork-and-knife-with-plate', color: '#ccc' };
                                const sCatColor = sCat.color || 'var(--accent-primary)';
                                sIconHtml = `<span class="iconify" data-icon="${sDbFood.icon}" style="font-size: 18px;"></span>`;
                                sIconStyle = `width:28px; height:28px; background:${sCatColor}20; border-radius:8px; display:flex; align-items:center; justify-content:center;`;
                            }
                            
                            subHTML += `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 12px; background:var(--bg-main); margin-bottom:4px; border-radius:6px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="${sIconStyle}">${sIconHtml}</div>
                                        <div>
                                            <div style="font-size:13px; font-weight:500;">${sBaseName}</div>
                                            <div style="font-size:10px; color:var(--text-muted);">${sub.grams}g ??蝣?{Math.round(sub.carb*10)/10} ??{Math.round(sub.pro*10)/10} ??{Math.round(sub.fat*10)/10}</div>
                                        </div>
                                    </div>
                                    <div style="font-size:13px; font-weight:600; color:var(--text-main);">${sub.cal}kcal</div>
                                </div>
                            `;
                        });

                        itemsHTML += `
                            <div class="meal-item" style="flex-direction:column; align-items:stretch;">
                                <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleSubItems('${item.id}')">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <div class="meal-item-icon" style="background: var(--accent-primary); color: var(--bg-main); font-size:16px;"><i class="fa-solid fa-layer-group"></i></div>
                                        <div class="meal-item-info">
                                            <div class="meal-item-name">${item.name}</div>
                                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 8px;">
                                                <span><span style="color: var(--carb-color); font-weight: bold;">蝣?/span> ${Math.round(item.carb*10)/10}g</span>
                                                <span><span style="color: var(--pro-color); font-weight: bold;">??/span> ${Math.round(item.pro*10)/10}g</span>
                                                <span><span style="color: var(--fat-color); font-weight: bold;">??/span> ${Math.round(item.fat*10)/10}g</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="meal-item-cal" style="display:flex; align-items:center; gap:8px;">
                                        <span>${item.cal}kcal</span>
                                        <div style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i id="chevron-${item.id}" class="fa-solid fa-chevron-down" style="transition: transform 0.3s; font-size:12px;"></i></div>
                                        <button class="btn-icon" style="color: #ff5555; width:28px; height:28px; font-size:14px; background:var(--bg-main);" onclick="event.stopPropagation(); deleteLogItem(${item.id})">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div id="subitems-${item.id}" style="display:none; margin-top:12px; border-top:1px dashed var(--card-border); padding-top:12px;">
                                    ${subHTML}
                                </div>
                            </div>
                        `;
                    } else {
                        let iconHtml = '?儭?;
                        let iconStyle = '';
                        let desc = '1??;
                        if(item.name.includes('(')) {
                            let match = item.name.match(/\(([^)]+)\)/);
                            if(match) desc = match[1];
                        }
                        const baseName = item.name.split(' (')[0];
                        const dbFood = foodDatabase.foods.find(f => f.name.includes(baseName));
                        if(dbFood) {
                            const cat = foodDatabase.categories.find(c => c.id === dbFood.categoryId) || { icon: 'fluent-emoji-flat:fork-and-knife-with-plate', color: '#ccc' };
                            const catColor = cat.color || 'var(--accent-primary)';
                            iconHtml = `<span class="iconify" data-icon="${dbFood.icon}" style="font-size: 24px;"></span>`;
                            iconStyle = `background: ${catColor}20;`;
                        }

                        itemsHTML += `
                            <div class="meal-item">
                                <div class="meal-item-icon" style="${iconStyle}">${iconHtml}</div>
                                <div class="meal-item-info">
                                    <div class="meal-item-name">${baseName}</div>
                                    <div class="meal-item-desc">${desc}</div>
                                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 8px;">
                                        <span><span style="color: var(--carb-color); font-weight: bold;">蝣?/span> ${Math.round(item.carb*10)/10}g</span>
                                        <span><span style="color: var(--pro-color); font-weight: bold;">??/span> ${Math.round(item.pro*10)/10}g</span>
                                        <span><span style="color: var(--fat-color); font-weight: bold;">??/span> ${Math.round(item.fat*10)/10}g</span>
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
                    }
                });
            } else {
                itemsHTML = '';
            }
                
            let suggestStr = '';
            if(meal === 'breakfast' || meal === 'dinner') {
                suggestStr = `撱箄降 ${Math.round(TARGET_CALS * 0.25)} - ${Math.round(TARGET_CALS * 0.35)} kcal`;
            } else if(meal === 'lunch') {
                suggestStr = `撱箄降 ${Math.round(TARGET_CALS * 0.35)} - ${Math.round(TARGET_CALS * 0.45)} kcal`;
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
    });

    container.innerHTML = html;
}

document.getElementById('btn-clear').addEventListener('click', () => {
    if(confirm('蝣箏?閬?蝛箔?憭拍?憌脤?蝝??嚗?)) {
        logs = [];
        localStorage.removeItem('fitness_logs');
        if (typeof triggerAutoSync === 'function') triggerAutoSync();
        renderLogs();
        updateDashboard();
    }
});


// Profile Logic
function setupProfile() {
    const nickname = document.getElementById('nickname');
    const g = document.getElementById('gender');
    const a = document.getElementById('age');
    const h = document.getElementById('height');
    const w = document.getElementById('weight');
    const act = document.getElementById('activity');
    const goal = document.getElementById('goal');
    const pace = document.getElementById('pace');

    function getPreviewTDEE() {
        const gender = g.value || 'male';
        const age = parseInt(a.value) || 25;
        const height = parseInt(h.value) || 170;
        const weight = parseInt(w.value) || 70;
        const activity = parseFloat(act.value) || 1.2;

        let bmr;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        return bmr * activity;
    }

    function updatePaceOptions() {
        const tdee = getPreviewTDEE();
        const paceOptions = {
            cut: [
                { value: 'conservative', text: `? 靽?皜? (-10% / 蝝?-${Math.round(tdee * 0.1)} kcal)` },
                { value: 'standard', text: `??璅?皜? 潃?(-15% / 蝝?-${Math.round(tdee * 0.15)} kcal)` }
            ],
            bulk: [
                { value: 'conservative', text: `? 靽?憓? (+5% / 蝝?+${Math.round(tdee * 0.05)} kcal)` },
                { value: 'standard', text: `??璅?憓? 潃?(+10% / 蝝?+${Math.round(tdee * 0.1)} kcal)` }
            ],
            maintain: [
                { value: 'standard', text: '璅?蝬剜? (0% / 摰??像)' }
            ],
            recomp: [
                { value: 'auto', text: `蝟餌絞?芸?閮??雿喟撩??(-5% / 蝝?-${Math.round(tdee * 0.05)} kcal)` }
            ],
            lose: [
                { value: 'standard', text: `??璅?皜? 潃?(-15% / 蝝?-${Math.round(tdee * 0.15)} kcal)` }
            ],
            gain: [
                { value: 'standard', text: `??璅?憓? 潃?(+10% / 蝝?+${Math.round(tdee * 0.1)} kcal)` }
            ]
        };

        const currentPace = pace.value;
        const selectedGoal = goal.value || 'maintain';
        const options = paceOptions[selectedGoal] || paceOptions['maintain'];
        
        pace.innerHTML = '';
        options.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.value;
            el.innerText = opt.text;
            pace.appendChild(el);
        });

        const exists = Array.from(pace.options).some(opt => opt.value === currentPace);
        if (exists) pace.value = currentPace;
    }

    [g, a, h, w, act, goal].forEach(input => {
        input.addEventListener('input', updatePaceOptions);
        input.addEventListener('change', updatePaceOptions);
    });

    if (nickname) nickname.value = userProfile.nickname || '';
    g.value = userProfile.gender || 'male';
    a.value = userProfile.age || '';
    h.value = userProfile.height || '';
    w.value = userProfile.weight || '';
    act.value = userProfile.activity || '1.2';
    goal.value = userProfile.goal || 'maintain';
    
    function updateBMI() {
        const height = parseFloat(h.value);
        const weight = parseFloat(w.value);
        if (height > 0 && weight > 0) {
            const hM = height / 100;
            const bmi = weight / (hM * hM);
            const bmiEl = document.getElementById('inline-bmi-val');
            if (bmiEl) {
                bmiEl.innerText = bmi.toFixed(1);
                const disp = document.getElementById('inline-bmi-display');
                if (disp) disp.style.display = 'flex';
            }
        } else {
            const disp = document.getElementById('inline-bmi-display');
            if (disp) disp.style.display = 'none';
        }
    }

    [h, w].forEach(input => {
        input.addEventListener('input', updateBMI);
        input.addEventListener('change', updateBMI);
    });

    updateBMI();
    updatePaceOptions();
    if (userProfile.pace) {
        // Only set if option exists
        const exists = Array.from(pace.options).some(opt => opt.value === userProfile.pace);
        if(exists) pace.value = userProfile.pace;
    }

    document.getElementById('btn-save-profile').addEventListener('click', () => {
        userProfile = {
            nickname: nickname ? nickname.value : '',
            gender: g.value,
            age: parseInt(a.value),
            height: parseInt(h.value),
            weight: parseInt(w.value),
            activity: parseFloat(act.value),
            goal: goal.value,
            pace: pace.value
        };
        setAndSync('fitness_profile', JSON.stringify(userProfile));
        calculateTargets();
        updateDashboard();
        alert('?脣???嚗歇?閮??格??梢???);
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
window.resetScanner = resetScanner;
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
        alert("隢‵撖恍??拙?蝔梧?");
        return;
    }
    if (isNaN(cals) || cals < 0) {
        alert("隢‵撖急迤蝣箇??梢??詨潘?");
        return;
    }

    const newFood = {
        id: 'cf_' + Date.now(),
        categoryId: 'custom',
        name: name,
        cals: cals,
        macros: { p, c, f },
        icon: '?歹?'
    };

    // Save to local custom foods
    customFoods.push(newFood);
    setAndSync('customFoods', JSON.stringify(customFoods));
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
    
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

window.toggleSubItems = function(id) {
    const el = document.getElementById(`subitems-${id}`);
    const chev = document.getElementById(`chevron-${id}`);
    if (el) {
        if (el.style.display === 'none') {
            el.style.display = 'block';
            if (chev) chev.style.transform = 'rotate(180deg)';
        } else {
            el.style.display = 'none';
            if (chev) chev.style.transform = 'rotate(0deg)';
        }
    }
};

window.deleteLogItem = function(id) {
    if (!confirm("蝣箏?閬?日?蝝??嚗?)) return;
    logs = logs.filter(log => log.id !== id);
    setAndSync('fitness_logs', JSON.stringify(logs));
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
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
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    
    
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
    renderLogs();
};

window.updateLogWater = function(delta) {
    if (!dailyData[selectedLogDate]) {
        dailyData[selectedLogDate] = { water: 0, weight: userProfile.weight || 70 };
    }
    
    let currentWater = parseInt(dailyData[selectedLogDate].water || 0);
    currentWater = Math.max(0, currentWater + delta);
    
    dailyData[selectedLogDate].water = currentWater;
    setAndSync('fitness_daily', JSON.stringify(dailyData));
    
    if (selectedLogDate === todayDateStr) {
        document.getElementById('water-val').innerText = currentWater;
    }
    
    if (typeof triggerAutoSync === 'function') triggerAutoSync();
    renderLogs();
};

let overviewOffsetWeeks = 0;
let overviewWeightChartInstance = null;
let overviewCalorieChartInstance = null;
let overviewBurnedChartInstance = null;

function overviewChangeWeek(delta) {
    overviewOffsetWeeks += delta;
    if (overviewOffsetWeeks > 0) overviewOffsetWeeks = 0;
    renderOverview();
}

window.overviewChangeWeek = overviewChangeWeek;

function renderOverview() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday + (overviewOffsetWeeks * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatRange = (d) => `${d.getMonth()+1}??{d.getDate()}?匝;
    const rangeText = `${formatRange(startOfWeek)} - ${formatRange(endOfWeek)}`;
    document.getElementById('overview-weight-date-range').innerText = rangeText;
    document.getElementById('overview-cal-date-range').innerText = rangeText;
    
    const burnedRangeEl = document.getElementById('overview-burned-date-range');
    if (burnedRangeEl) burnedRangeEl.innerText = rangeText;
    
    const labels = ['銝', '鈭?, '銝?, '??, '鈭?, '??, '??];
    const subLabels = [];
    const weightData = [];
    const calorieData = [];
    const burnedData = [];
    const burnedTimeData = [];
    
    let sumCal = 0;
    let daysWithCal = 0;
    let sumBurned = 0;
    let sumBurnedTime = 0;
    let daysWithBurned = 0;
    let lastValidWeight = userProfile.weight || 70;
    
    for (let i = 1; i <= 30; i++) {
        let prevD = new Date(startOfWeek);
        prevD.setDate(startOfWeek.getDate() - i);
        let dStr = prevD.toLocaleDateString('en-CA');
        if (dailyData[dStr] && dailyData[dStr].weight) {
            lastValidWeight = dailyData[dStr].weight;
            break;
        }
    }

    for (let i = 0; i < 7; i++) {
        let d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        let dStr = d.toLocaleDateString('en-CA');
        subLabels.push(`${d.getMonth()+1}/${d.getDate()}`);
        
        if (dailyData[dStr] && dailyData[dStr].weight) {
            lastValidWeight = dailyData[dStr].weight;
        }
        
        const isFuture = new Date(dStr) > new Date(todayDateStr);
        if (isFuture) {
            weightData.push(null);
            calorieData.push(null);
            burnedData.push(null);
        } else {
            weightData.push(lastValidWeight);
            
            let dayCals = 0;
            const dayLogs = logs.filter(log => (log.date || todayDateStr) === dStr);
            dayLogs.forEach(log => { dayCals += log.cal; });
            calorieData.push(dayCals);
            if(dayCals > 0) {
                sumCal += dayCals;
                daysWithCal++;
            }
            
            let dayBurned = (dailyData[dStr] && dailyData[dStr].burned) ? dailyData[dStr].burned : 0;
            let dayBurnedTime = (dailyData[dStr] && dailyData[dStr].burnedTime) ? dailyData[dStr].burnedTime : 0;
            burnedData.push(dayBurned);
            burnedTimeData.push(dayBurnedTime);
            if(dayBurned > 0 || dayBurnedTime > 0) {
                sumBurned += dayBurned;
                sumBurnedTime += dayBurnedTime;
                daysWithBurned++;
            }
        }
    }
    
    document.getElementById('overview-current-weight').innerText = `${lastValidWeight} kg`;
    const avgCal = daysWithCal > 0 ? Math.round(sumCal / daysWithCal) : 0;
    document.getElementById('overview-avg-cal').innerText = `${avgCal} 憭批`;
    
    const avgBurned = daysWithBurned > 0 ? Math.round(sumBurned / daysWithBurned) : 0;
    const avgBurnedTime = daysWithBurned > 0 ? Math.round(sumBurnedTime / daysWithBurned) : 0;
    const elAvgBurned = document.getElementById('overview-avg-burned');
    if (elAvgBurned) {
        if (avgBurnedTime > 0) {
            elAvgBurned.innerText = `${avgBurned} kcal, ${avgBurnedTime} ??`;
        } else {
            elAvgBurned.innerText = `${avgBurned} kcal`;
        }
    }
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { bottom: 25 }
        },
        plugins: { 
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: function(context) {
                        const idx = context[0].dataIndex;
                        return `??${labels[idx]} (${subLabels[idx]})`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 14 } }
            }
        }
    };

    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = 'Inter, sans-serif';

    const wCtx = document.getElementById('overviewWeightChart');
    if(wCtx) {
        if (overviewWeightChartInstance) overviewWeightChartInstance.destroy();
        overviewWeightChartInstance = new Chart(wCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: weightData,
                    borderColor: '#ff79c6',
                    backgroundColor: '#ff79c6',
                    borderWidth: 3,
                    tension: 0.1,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ff79c6',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: commonOptions.scales.x,
                    y: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1, padding: 10 }
                    }
                }
            },
            plugins: [{
                id: 'customSubLabels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '10px sans-serif';
                    const xAxis = chart.scales.x;
                    const yPos = xAxis.bottom + 15;
                    xAxis.ticks.forEach((tick, i) => {
                        if(subLabels[i]) ctx.fillText(subLabels[i], xAxis.getPixelForTick(i), yPos);
                    });
                    ctx.restore();
                }
            }]
        });
    }

    const cCtx = document.getElementById('overviewCalorieChart');
    if(cCtx) {
        if (overviewCalorieChartInstance) overviewCalorieChartInstance.destroy();
        overviewCalorieChartInstance = new Chart(cCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: calorieData.map(v => v === null ? 0 : v),
                    backgroundColor: calorieData.map(val => val > 0 ? '#ffb86c' : 'rgba(255,255,255,0.1)'),
                    borderRadius: 8,
                    barThickness: 24
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    x: commonOptions.scales.x,
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false, borderDash: [5, 5] },
                        ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 5, padding: 10 },
                        suggestedMax: TARGET_CALS + 200
                    }
                }
            },
            plugins: [{
                id: 'customSubLabelsCal',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '10px sans-serif';
                    const xAxis = chart.scales.x;
                    const yPos = xAxis.bottom + 15;
                    xAxis.ticks.forEach((tick, i) => {
                        if(subLabels[i]) ctx.fillText(subLabels[i], xAxis.getPixelForTick(i), yPos);
                    });
                    ctx.restore();
                }
            }]
        });
    }

    const bCtx = document.getElementById('overviewBurnedChart');
    if(bCtx) {
        if (overviewBurnedChartInstance) overviewBurnedChartInstance.destroy();
        overviewBurnedChartInstance = new Chart(bCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: burnedData.map(v => v === null ? 0 : v),
                    backgroundColor: burnedData.map(val => val > 0 ? '#ff9ff3' : 'rgba(255,255,255,0.1)'),
                    borderRadius: 8,
                    barThickness: 24
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            ...commonOptions.plugins.tooltip.callbacks,
                            label: function(context) {
                                const val = context.raw;
                                const time = burnedTimeData[context.dataIndex];
                                if (time > 0) {
                                    return `${val} kcal (${time} ??)`;
                                }
                                return `${val} kcal`;
                            }
                        }
                    }
                },
                scales: {
                    x: commonOptions.scales.x,
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false, borderDash: [5, 5] },
                        ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 5, padding: 10 },
                        suggestedMax: 500
                    }
                }
            },
            plugins: [{
                id: 'customSubLabelsBurned',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '10px sans-serif';
                    const xAxis = chart.scales.x;
                    const yPos = xAxis.bottom + 15;
                    xAxis.ticks.forEach((tick, i) => {
                        if(subLabels[i]) ctx.fillText(subLabels[i], xAxis.getPixelForTick(i), yPos);
                    });
                    ctx.restore();
                }
            }]
        });
    }
}

window.renderOverview = renderOverview;

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
            titleEl.innerText = year + '撟?' + String(month + 1).padStart(2, '0') + '??;
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        
        let html = '';
        
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }
        
        const isWorkoutView = document.getElementById('view-workout').classList.contains('active');
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dStr = year + '-' + String(month+1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            
            let isSelected = (dStr === selectedLogDate);
            let isToday = (dStr === todayDateStr);
            
            let hasLogs = false;
            if (isWorkoutView) {
                if (dailyData[dStr] && dailyData[dStr].workouts && dailyData[dStr].workouts.length > 0) {
                    hasLogs = true;
                }
            } else {
                hasLogs = logs.some(log => (log.date || todayDateStr) === dStr);
            }
            
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
    alert("Startup error: " + e.message + "\n" + e.stack);
}

// Pull to Refresh Logic (For iOS PWAs)
let ptrStartY = 0;
let ptrCurrentY = 0;
let isPtrPulling = false;
const ptrIndicator = document.getElementById('ptr-indicator');
const ptrIcon = document.getElementById('ptr-icon');
const ptrText = document.getElementById('ptr-text');
const PTR_THRESHOLD = 70;

document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
        ptrStartY = e.touches[0].clientY;
        isPtrPulling = true;
        if(ptrIndicator) ptrIndicator.style.transition = 'none';
    }
}, {passive: true});

document.addEventListener('touchmove', (e) => {
    if (!isPtrPulling || !ptrIndicator) return;
    ptrCurrentY = e.touches[0].clientY;
    let pullDistance = ptrCurrentY - ptrStartY;
    
    // Check if we are pulling down and are at the top of the page
    if (pullDistance > 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
        
        let visualDistance = Math.min(pullDistance * 0.4, 100);
        ptrIndicator.style.transform = `translateY(${visualDistance - 60}px)`;
        
        if (visualDistance > PTR_THRESHOLD * 0.4) {
            ptrIcon.style.transform = 'rotate(180deg)';
            ptrText.innerText = '?暸?隞仿??唳??;
        } else {
            ptrIcon.style.transform = 'rotate(0deg)';
            ptrText.innerText = '銝?隞仿??唳??..';
        }
    }
}, {passive: false});

document.addEventListener('touchend', () => {
    if (!isPtrPulling || !ptrIndicator) return;
    isPtrPulling = false;
    
    let pullDistance = ptrCurrentY - ptrStartY;
    ptrIndicator.style.transition = 'transform 0.3s';
    
    let visualDistance = pullDistance * 0.4;
    
    if (visualDistance > PTR_THRESHOLD * 0.4 && ptrCurrentY > ptrStartY) {
        ptrIndicator.style.transform = 'translateY(0px)';
        ptrIcon.className = 'fa-solid fa-spinner fa-spin';
        ptrText.innerText = '?湔銝?..';
        
        setTimeout(() => {
            window.location.reload(true);
        }, 500);
    } else {
        ptrIndicator.style.transform = 'translateY(-60px)';
        setTimeout(() => {
            if(ptrIcon) {
                ptrIcon.className = 'fa-solid fa-arrow-down';
                ptrIcon.style.transform = 'rotate(0deg)';
                ptrText.innerText = '銝?隞仿??唳??..';
            }
        }, 300);
    }
});

