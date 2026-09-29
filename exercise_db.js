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
    
    if (exerciseName.includes('臥推') || exerciseName.includes('伏地挺身') || exerciseName.includes('夾胸') || exerciseName.includes('飛鳥') && !exerciseName.includes('反向')) return '胸';
    if (exerciseName.includes('引體向上') || exerciseName.includes('划船') || exerciseName.includes('下拉') || exerciseName.includes('反向飛鳥')) return '背';
    if (exerciseName.includes('深蹲') || exerciseName.includes('硬拉') || exerciseName.includes('硬舉') || exerciseName.includes('臀推') || exerciseName.includes('橋式') || exerciseName.includes('分腿蹲') || exerciseName.includes('弓箭步') || exerciseName.includes('保加利亞')) return '腿';
    if (exerciseName.includes('平板支撐') || exerciseName.includes('死蟲') || exerciseName.includes('核心')) return '核心';
    if (exerciseName.includes('腹') || exerciseName.includes('捲體') || exerciseName.includes('仰臥起坐') || exerciseName.includes('轉體') || exerciseName.includes('抬腿')) return '腹';
    if (exerciseName.includes('推舉') && !exerciseName.includes('腿')) return '肩';
    if (exerciseName.includes('側平舉') || exerciseName.includes('前平舉')) return '肩';
    if (exerciseName.includes('彎舉')) return '二頭';
    if (exerciseName.includes('三頭') || exerciseName.includes('法式') || exerciseName.includes('臂屈伸')) return '三頭';
    
    if (typeof EXERCISE_DB === 'undefined') return '';
    for (let cat of EXERCISE_DB) {
        if (cat.exercises.find(e => e.name === exerciseName)) {
            let catName = cat.category;
            if (catName.includes('胸')) return '胸';
            if (catName.includes('背')) return '背';
            if (catName.includes('臀腿')) return '腿';
            if (catName.includes('三頭')) return '三頭';
            if (catName.includes('二頭')) return '二頭';
            if (catName.includes('肩袖')) return '肩袖';
            if (catName.includes('肩')) return '肩';
            if (catName.includes('前臂')) return '前臂';
            if (catName.includes('小腿')) return '小腿';
            if (catName.includes('腹')) return '腹';
            if (catName.includes('有氧')) return '有氧';
            if (catName.includes('核心')) return '核心';
            return '';
        }
    }
    return '';
}
window.getExerciseCategory = getExerciseCategory;
