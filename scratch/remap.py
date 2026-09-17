import json
import re

# Read original
with open('food_db.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the food objects
foods_str = re.search(r'foods:\s*\[(.*?)\]\s*\}', content, re.DOTALL).group(1)
# It's JS, not strict JSON. Let's parse it manually or just use regex to extract id, name, cals, macros, icon
pattern = r"\{\s*id:\s*'([^']+)',\s*categoryId:\s*'([^']+)',\s*name:\s*'([^']+)',\s*cals:\s*([\d.]+),\s*macros:\s*\{\s*p:\s*([\d.]+),\s*c:\s*([\d.]+),\s*f:\s*([\d.]+)\s*\},\s*icon:\s*'([^']+)'\s*\}"
foods = []
for m in re.finditer(pattern, foods_str):
    foods.append({
        'id': m.group(1),
        'name': m.group(3),
        'cals': float(m.group(4)),
        'p': float(m.group(5)),
        'c': float(m.group(6)),
        'f': float(m.group(7)),
        'icon': m.group(8)
    })

# Categories logic
def get_category(f):
    name = f['name']
    
    # 6. 快樂舒壓餐 (cheat)
    cheat_keywords = ['珍珠奶茶', '炸雞', '薯條', '冰淇淋', '蛋糕', '可口可樂', '地瓜球', '鹹酥雞', '甜不辣', '臭豆腐', '章魚燒', '大麥克', '麥香雞', '麥香魚', '麥克雞塊', '中薯', '咔啦脆雞', '蛋撻', '海洋珍珠堡', '蜜汁烤雞堡', '大腸包小腸']
    if any(k in name for k in cheat_keywords):
        return 'cheat'
        
    # 5. 戰術補給與自訂特調 (supp)
    supp_keywords = ['乳清', '高蛋白', '果果', 'MARS', 'Myprotein', 'ON']
    if any(k in name for k in supp_keywords):
        return 'supp'
        
    # 3. 超商快充站 (store)
    store_keywords = ['超商', '義美', '光泉', '統一', '林鳳營', 'Subway']
    if any(k in name for k in store_keywords) or f['id'].startswith('st'):
        return 'store'
        
    # 2. 台灣靈魂早餐 (breakfast)
    breakfast_keywords = ['蛋餅', '吐司', '蘿蔔糕', '鐵板麵', '奶茶', '饅頭', '麵包', '貝果', '水煎包', '蔥油餅', '蔥抓餅', '肉包', '菜包', '胡椒餅']
    if any(k in name for k in breakfast_keywords):
        return 'breakfast'
        
    # 1. 街邊便當與小吃 (bento)
    bento_keywords = ['便當', '燒臘', '炒飯', '牛肉麵', '滷肉飯', '水餃', '鍋貼', '小籠包', '麵', '肉羹', '麵線', '火鍋', '麻婆豆腐', '三杯雞', '三杯杏鮑菇', '肉粽', '肉圓', '涼麵', '蚵仔煎', '豬血糕', '潤餅', '火雞肉飯']
    if any(k in name for k in bento_keywords):
        return 'bento'
        
    # 4. 原型生鮮食材 (raw)
    return 'raw'

# Assign categories
categorized_foods = {'bento': [], 'breakfast': [], 'store': [], 'raw': [], 'supp': [], 'cheat': []}
for f in foods:
    cat = get_category(f)
    # Some overrides
    if f['name'] == '茶葉蛋/滷蛋 (1顆)': cat = 'store' # user asked for store
    categorized_foods[cat].append(f)

# Build new food_db.js
out = []
out.append("// 衛福部精華版資料庫 (Curated Taiwan Food Database)")
out.append("// 擴充版：包含近 250 筆台灣常見食物、小吃、與超商連鎖食品")
out.append("const foodDatabase = {")
out.append("    categories: [")
out.append("        { id: 'bento', name: '街邊便當與小吃', icon: 'fluent-emoji-flat:bento-box', color: '#FBBF24' },")
out.append("        { id: 'breakfast', name: '台灣靈魂早餐', icon: 'fluent-emoji-flat:cooking', color: '#ff6b6b' },")
out.append("        { id: 'store', name: '超商快充站', icon: 'fluent-emoji-flat:convenience-store', color: '#38BDF8' },")
out.append("        { id: 'raw', name: '原型生鮮食材', icon: 'fluent-emoji-flat:leafy-green', color: '#1dd1a1' },")
out.append("        { id: 'supp', name: '戰術補給與自訂', icon: 'fluent-emoji-flat:cup-with-straw', color: '#A78BFA' },")
out.append("        { id: 'cheat', name: '快樂舒壓餐', icon: 'fluent-emoji-flat:bubble-tea', color: '#ff9ff3' }")
out.append("    ],")
out.append("    foods: [")

cat_titles = {
    'bento': '街邊便當與小吃 (日常混合餐)',
    'breakfast': '台灣靈魂早餐 (早晨專區)',
    'store': '超商快充站 (微波與即食)',
    'raw': '原型生鮮食材 (自煮備餐區)',
    'supp': '戰術補給與自訂特調 (你的專屬護城河)',
    'cheat': '快樂舒壓餐 (欺騙餐)'
}

for cat_id in cat_titles:
    out.append(f"        // ================= {cat_titles[cat_id]} =================")
    for f in categorized_foods[cat_id]:
        cals = int(f['cals']) if f['cals'].is_integer() else f['cals']
        p = int(f['p']) if f['p'].is_integer() else f['p']
        c = int(f['c']) if f['c'].is_integer() else f['c']
        fat = int(f['f']) if f['f'].is_integer() else f['f']
        line = f"        {{ id: '{f['id']}', categoryId: '{cat_id}', name: '{f['name']}', cals: {cals}, macros: {{ p: {p}, c: {c}, f: {fat} }}, icon: '{f['icon']}' }},"
        out.append(line)

out.append("    ]")
out.append("};")
out.append("")

with open('food_db.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print("Categorization done!")
