const fs = require('fs');

const content = fs.readFileSync('food_db.js', 'utf-8');
const foodsMatch = content.match(/foods:\s*\[([\s\S]*?)\]\s*\}/);
const foodsStr = foodsMatch[1];

const pattern = /\{\s*id:\s*'([^']+)',\s*categoryId:\s*'([^']+)',\s*name:\s*'([^']+)',\s*cals:\s*([\d.]+),\s*macros:\s*\{\s*p:\s*([\d.]+),\s*c:\s*([\d.]+),\s*f:\s*([\d.]+)\s*\},\s*icon:\s*'([^']+)'\s*\}/g;

const foods = [];
let match;
while ((match = pattern.exec(foodsStr)) !== null) {
    foods.push({
        id: match[1],
        name: match[3],
        cals: parseFloat(match[4]),
        p: parseFloat(match[5]),
        c: parseFloat(match[6]),
        f: parseFloat(match[7]),
        icon: match[8]
    });
}

function getCategory(f) {
    const name = f.name;
    
    // 6. 快樂舒壓餐 (cheat)
    const cheat_keywords = ['珍珠奶茶', '炸雞', '薯條', '冰淇淋', '蛋糕', '可口可樂', '地瓜球', '鹹酥雞', '甜不辣', '臭豆腐', '章魚燒', '大麥克', '麥香雞', '麥香魚', '麥克雞塊', '中薯', '咔啦脆雞', '蛋撻', '海洋珍珠堡', '蜜汁烤雞堡', '大腸包小腸'];
    if (cheat_keywords.some(k => name.includes(k))) return 'cheat';
        
    // 5. 戰術補給與自訂特調 (supp)
    const supp_keywords = ['乳清', '高蛋白', '果果', 'MARS', 'Myprotein', 'ON'];
    if (supp_keywords.some(k => name.includes(k))) return 'supp';
        
    // 3. 超商快充站 (store)
    const store_keywords = ['超商', '義美', '光泉', '統一', '林鳳營', 'Subway'];
    if (store_keywords.some(k => name.includes(k)) || f.id.startsWith('st')) return 'store';
        
    // 2. 台灣靈魂早餐 (breakfast)
    const breakfast_keywords = ['蛋餅', '吐司', '蘿蔔糕', '鐵板麵', '奶茶', '饅頭', '麵包', '貝果', '水煎包', '蔥油餅', '蔥抓餅', '肉包', '菜包', '胡椒餅', '拿鐵咖啡', '美式咖啡'];
    if (breakfast_keywords.some(k => name.includes(k))) return 'breakfast';
        
    // 1. 街邊便當與小吃 (bento)
    const bento_keywords = ['便當', '燒臘', '炒飯', '牛肉麵', '滷肉飯', '火雞肉飯', '水餃', '鍋貼', '小籠包', '麵', '肉羹', '麵線', '火鍋', '麻婆豆腐', '三杯雞', '三杯杏鮑菇', '肉粽', '肉圓', '涼麵', '蚵仔煎', '豬血糕', '潤餅'];
    if (bento_keywords.some(k => name.includes(k))) return 'bento';
        
    // 4. 原型生鮮食材 (raw)
    return 'raw';
}

const categorizedFoods = {
    bento: [], breakfast: [], store: [], raw: [], supp: [], cheat: []
};

for (const f of foods) {
    let cat = getCategory(f);
    if (f.name.includes('茶葉蛋') || f.name.includes('滷蛋')) cat = 'store';
    categorizedFoods[cat].push(f);
}

const out = [];
out.push("// 衛福部精華版資料庫 (Curated Taiwan Food Database)");
out.push("// 擴充版：包含近 250 筆台灣常見食物、小吃、與超商連鎖食品");
out.push("const foodDatabase = {");
out.push("    categories: [");
out.push("        { id: 'bento', name: '街邊便當與小吃', icon: 'fluent-emoji-flat:bento-box', color: '#FBBF24' },");
out.push("        { id: 'breakfast', name: '台灣靈魂早餐', icon: 'fluent-emoji-flat:cooking', color: '#ff6b6b' },");
out.push("        { id: 'store', name: '超商快充站', icon: 'fluent-emoji-flat:convenience-store', color: '#38BDF8' },");
out.push("        { id: 'raw', name: '原型生鮮食材', icon: 'fluent-emoji-flat:leafy-green', color: '#1dd1a1' },");
out.push("        { id: 'supp', name: '戰術補給與自訂', icon: 'fluent-emoji-flat:cup-with-straw', color: '#A78BFA' },");
out.push("        { id: 'cheat', name: '快樂舒壓餐', icon: 'fluent-emoji-flat:bubble-tea', color: '#ff9ff3' }");
out.push("    ],");
out.push("    foods: [");

const catTitles = {
    bento: '街邊便當與小吃 (日常混合餐)',
    breakfast: '台灣靈魂早餐 (早晨專區)',
    store: '超商快充站 (微波與即食)',
    raw: '原型生鮮食材 (自煮備餐區)',
    supp: '戰術補給與自訂特調 (你的專屬護城河)',
    cheat: '快樂舒壓餐 (欺騙餐)'
};

for (const catId in catTitles) {
    out.push(`        // ================= ${catTitles[catId]} =================`);
    for (const f of categorizedFoods[catId]) {
        const line = `        { id: '${f.id}', categoryId: '${catId}', name: '${f.name}', cals: ${f.cals}, macros: { p: ${f.p}, c: ${f.c}, f: ${f.f} }, icon: '${f.icon}' },`;
        out.push(line);
    }
}

out.push("    ]");
out.push("};");
out.push("");

fs.writeFileSync('food_db.js', out.join('\n'), 'utf-8');
console.log('Categorization done via Node!');
