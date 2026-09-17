// exercise_db.js

const EXERCISE_DB = [
    {
        category: "胸部訓練 (大肌群)",
        exercises: [
            { name: "啞鈴臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "上斜啞鈴臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "下斜啞鈴臥推", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴飛鳥", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "背部訓練 (大肌群)",
        exercises: [
            { name: "俯身啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "單臂啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "上斜啞鈴划船", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "仰臥直臂上拉", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "臀腿訓練 (大肌群)",
        exercises: [
            { name: "高腳杯深蹲", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "啞鈴硬拉", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "直腿硬拉", type: "weight", defaultSets: 4, defaultReps: "8下" },
            { name: "保加利亞單腿蹲", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴臀橋", type: "weight", defaultSets: 4, defaultReps: "10下" },
            { name: "啞鈴單腿提踵 (小腿)", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    },
    {
        category: "肩部訓練 (小肌群)",
        exercises: [
            { name: "啞鈴推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "阿諾德推舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" },
            { name: "俯身啞鈴側平舉", type: "weight", defaultSets: 3, defaultReps: "12下" },
            { name: "啞鈴過頂前平舉", type: "weight", defaultSets: 3, defaultReps: "12下" }
        ]
    },
    {
        category: "手臂訓練 (小肌群)",
        exercises: [
            { name: "啞鈴彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "上斜彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "斜托彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "集中彎舉", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "頸後啞鈴臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "俯身臂屈伸", type: "weight", defaultSets: 3, defaultReps: "10下" },
            { name: "鑽石啞鈴臥推", type: "weight", defaultSets: 3, defaultReps: "10下" }
        ]
    },
    {
        category: "前臂與腰腹 (輔助動作)",
        exercises: [
            { name: "啞鈴錘式彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "背後腕彎舉", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "負重捲腹", type: "weight", defaultSets: 3, defaultReps: "15下" },
            { name: "啞鈴傳遞", type: "weight", defaultSets: 3, defaultReps: "15下" }
        ]
    }
];
