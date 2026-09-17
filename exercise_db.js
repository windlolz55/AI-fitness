// exercise_db.js

const EXERCISE_DB = [
    {
        category: "胸部 (大肌群)",
        exercises: [
            { name: "啞鈴臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴上斜臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴下斜臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴飛鳥", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "背部 (大肌群)",
        exercises: [
            { name: "俯身啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "單臂啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "上斜啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" }
        ]
    },
    {
        category: "臀腿 (大肌群)",
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
        exercises: [
            { name: "頸後啞鈴臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "俯身臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "鑽石啞鈴臥推", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "肱二頭肌 (小肌群)",
        exercises: [
            { name: "啞鈴彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "上斜啞鈴彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴斜托彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "集中彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "肩部 (小肌群)",
        exercises: [
            { name: "啞鈴推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "阿諾德推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" },
            { name: "俯身啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" }
        ]
    },
    {
        category: "肩袖 (輔助項)",
        exercises: [
            { name: "仰臥直臂上拉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "啞鈴過頂前平舉", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "前臂 (輔助項)",
        exercises: [
            { name: "啞鈴錘式彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "背後腕彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "小腿 (輔助項)",
        exercises: [
            { name: "啞鈴單腿提踵", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "腰腹 (輔助項)",
        exercises: [
            { name: "負重捲腹", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "啞鈴傳遞", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "有氧與核心 (其他)",
        exercises: [
            { name: "平板支撐", type: "time", defaultSets: 3, defaultReps: "1分" },
            { name: "跑步機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "橢圓機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "腳踏車/飛輪", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "划船機", type: "cardio", defaultSets: 1, defaultReps: "30分" },
            { name: "散步/走路", type: "cardio", defaultSets: 1, defaultReps: "30分" }
        ]
    }
];
