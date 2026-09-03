const fs = require('fs');

const content = fs.readFileSync('food_db.js', 'utf8');

const startIdx = content.indexOf('foods: [') + 8;
const endIdx = content.lastIndexOf(']');
const foodsStr = content.substring(startIdx, endIdx);

const foodItems = [];
const regex = /\{[^}]+\}/g;
let match;
while ((match = regex.exec(foodsStr)) !== null) {
    const itemStr = match[0];
    const idMatch = itemStr.match(/id:\s*'([^']+)'/);
    const catMatch = itemStr.match(/categoryId:\s*'([^']+)'/);
    const nameMatch = itemStr.match(/name:\s*'([^']+)'/);

    if (idMatch && catMatch && nameMatch) {
        foodItems.push({
            originalStr: itemStr,
            id: idMatch[1],
            categoryId: catMatch[1],
            name: nameMatch[1].trim()
        });
    }
}

const uniqueFoods = {};
for (const item of foodItems) {
    const normName = item.name.replace(/\s+/g, '');
    if (!uniqueFoods[normName]) {
        uniqueFoods[normName] = item;
    }
}

const groupedFoods = {
    staple: [],
    meat: [],
    veg: [],
    snack: [],
    store: [],
    drink: [],
    fruit: []
};

for (const key in uniqueFoods) {
    const item = uniqueFoods[key];
    if (groupedFoods[item.categoryId]) {
        groupedFoods[item.categoryId].push(item);
    }
}

const catNames = {
    staple: '常吃主食 (Staple)',
    meat: '肉類與海鮮 (Meat)',
    veg: '蔬菜與蛋豆 (Veg)',
    snack: '外食與小吃 (Snacks & Meals)',
    store: '超商與品牌 (Store & Brands)',
    drink: '飲料 (Drinks)',
    fruit: '新鮮水果 (Fruits)'
};

let newFoodsStr = '\n';
for (const catId of ['staple', 'meat', 'veg', 'snack', 'store', 'drink', 'fruit']) {
    newFoodsStr += `        // ================= ${catNames[catId]} =================\n`;
    for (const item of groupedFoods[catId]) {
        newFoodsStr += `        ${item.originalStr},\n`;
    }
    newFoodsStr += '\n';
}

// Remove trailing comma
newFoodsStr = newFoodsStr.replace(/,\n\n$/, '\n');

const newContent = content.substring(0, startIdx) + newFoodsStr + '    ' + content.substring(endIdx);
fs.writeFileSync('food_db.js', newContent, 'utf8');

console.log(`Processed ${foodItems.length} items down to ${Object.keys(uniqueFoods).length} unique items.`);
