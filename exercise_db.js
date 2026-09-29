// exercise_db.js

const EXERCISE_DB = [
    {
        category: "胸部 (大肌群)",
        tab: "weight",
        exercises: [
            { name: "啞鈴臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴上斜臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴下斜臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴飛鳥", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴單臂提舉", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "背部 (大肌群)",
        tab: "weight",
        exercises: [
            { name: "俯身啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "單臂啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "上斜啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" }
        ]
    },
    {
        category: "臀腿 (大肌群)",
        tab: "weight",
        exercises: [
            { name: "高腳杯深蹲", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴硬拉", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴直腿硬拉", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "保加利亞單腿蹲", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴臀橋", type: "weight", defaultSets: 4, defaultReps: "10下" }
        ]
    },
    {
        category: "肱三頭肌 (小肌群)",
        tab: "weight",
        exercises: [
            { name: "頸後啞鈴臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "俯身臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "鑽石啞鈴臥推", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "肱二頭肌 (小肌群)",
        tab: "weight",
        exercises: [
            { name: "啞鈴彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "上斜啞鈴彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴斜托彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "集中彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "肩部 (小肌群)",
        tab: "weight",
        exercises: [
            { name: "啞鈴推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "阿諾德推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" },
            { name: "俯身啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" }
        ]
    },
    {
        category: "肩袖 (輔助項)",
        tab: "weight",
        exercises: [
            { name: "仰臥直臂上拉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "啞鈴過頂前平舉", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "前臂 (輔助項)",
        tab: "weight",
        exercises: [
            { name: "啞鈴錘式彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "背後腕彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "小腿 (輔助項)",
        tab: "weight",
        exercises: [
            { name: "啞鈴單腿提踵", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "腰腹 (輔助項)",
        tab: "weight",
        exercises: [
            { name: "負重捲腹", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "啞鈴傳遞", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "居家有氧動作",
        tab: "cardio",
        exercises: [
            { name: "胯下擊掌", type: "weight", defaultSets: 4, defaultReps: "50下" },
            { name: "同側提膝", type: "weight", defaultSets: 4, defaultReps: "50下" },
            { name: "提膝下壓", type: "weight", defaultSets: 4, defaultReps: "左右各30下" },
            { name: "開合跳 (或快速直拳)", type: "weight", defaultSets: 4, defaultReps: "左右各30下" }
        ]
    },
    {
        category: "徒手與核心",
        tab: "cardio",
        exercises: [
            { name: "平板支撐", type: "time", defaultSets: 3, defaultReps: "1分" },
            { name: "波比跳", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "下斜伏地挺身", type: "weight", defaultSets: 4, defaultReps: "12下" },
            { name: "一般伏地挺身", type: "weight", defaultSets: 4, defaultReps: "12下" }
        ]
    },
    {
        category: "器材有氧",
        tab: "cardio",
        exercises: [
            { name: "跑步機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "橢圓機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "腳踏車/飛輪", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "划船機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "散步/走路", type: "cardio", defaultSets: 1, defaultReps: "30分" }
        ]
    }
];

function getExerciseCategory(exerciseName) {
    if (!exerciseName) return '';
    const cleanName = exerciseName.replace(/\s*\(.*?\)/g, '').trim();
    
    // 1. 優先直接依據動作庫 (EXERCISE_DB) 查找對應分類
    if (typeof EXERCISE_DB !== 'undefined' && Array.isArray(EXERCISE_DB)) {
        for (let cat of EXERCISE_DB) {
            const found = cat.exercises.find(e => {
                const eClean = e.name.replace(/\s*\(.*?\)/g, '').trim();
                return e.name === exerciseName || e.name === cleanName || eClean === cleanName;
            });
            if (found) {
                return cat.category.replace(/\s*\(.*?\)/g, '').replace('動作', '').trim();
            }
        }
    }
    
    // 2. 若為不在動作庫中的自訂動作，根據動作庫分類名稱對齊
    if (cleanName.includes('臥推') || cleanName.includes('夾胸') || cleanName.includes('飛鳥') && !cleanName.includes('反向')) return '胸部';
    if (cleanName.includes('引體向上') || cleanName.includes('划船') || cleanName.includes('下拉') || cleanName.includes('反向飛鳥')) return '背部';
    if (cleanName.includes('深蹲') || cleanName.includes('硬拉') || cleanName.includes('硬舉') || cleanName.includes('臀推') || cleanName.includes('橋式') || cleanName.includes('分腿蹲') || cleanName.includes('弓箭步') || cleanName.includes('保加利亞') || cleanName.includes('腿')) return '臀腿';
    if (cleanName.includes('二頭') || cleanName.includes('彎舉')) return '肱二頭肌';
    if (cleanName.includes('三頭') || cleanName.includes('法式') || cleanName.includes('臂屈伸')) return '肱三頭肌';
    if (cleanName.includes('肩袖')) return '肩袖';
    if (cleanName.includes('推舉') || cleanName.includes('平舉') || cleanName.includes('肩')) return '肩部';
    if (cleanName.includes('前臂') || cleanName.includes('背後腕彎舉')) return '前臂';
    if (cleanName.includes('小腿') || cleanName.includes('提踵')) return '小腿';
    if (cleanName.includes('捲腹') || cleanName.includes('腹') || cleanName.includes('仰臥起坐') || cleanName.includes('轉體') || cleanName.includes('抬腿')) return '腰腹';
    if (cleanName.includes('伏地挺身') || cleanName.includes('平板支撐') || cleanName.includes('死蟲') || cleanName.includes('核心') || cleanName.includes('波比')) return '徒手與核心';
    if (cleanName.includes('跑步機') || cleanName.includes('橢圓機') || cleanName.includes('飛輪') || cleanName.includes('划船機') || cleanName.includes('散步') || cleanName.includes('走路')) return '器材有氧';
    if (cleanName.includes('開合跳') || cleanName.includes('提膝') || cleanName.includes('擊掌') || cleanName.includes('有氧')) return '居家有氧';

    return '';
}
window.getExerciseCategory = getExerciseCategory;
