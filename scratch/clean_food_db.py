import re
import json

with open("food_db.js", "r", encoding="utf-8") as f:
    content = f.read()

# Extract the foods array string
start_idx = content.find("foods: [") + 8
end_idx = content.rfind("]")

foods_str = content[start_idx:end_idx]

# Extract individual food objects
food_items = []
pattern = re.compile(r"\{.*?\}", re.DOTALL)
for match in pattern.finditer(foods_str):
    item_str = match.group(0)
    
    # Try to parse properties
    id_match = re.search(r"id:\s*'([^']+)'", item_str)
    cat_match = re.search(r"categoryId:\s*'([^']+)'", item_str)
    name_match = re.search(r"name:\s*'([^']+)'", item_str)
    
    if id_match and cat_match and name_match:
        food_items.append({
            "original_str": item_str,
            "id": id_match.group(1),
            "categoryId": cat_match.group(1),
            "name": name_match.group(1).strip()
        })

# Deduplicate by name (keep the first one encountered, or the one with more details)
unique_foods = {}
for item in food_items:
    name = item["name"]
    # Normalize name a bit for deduplication
    norm_name = name.replace(" ", "")
    if norm_name not in unique_foods:
        unique_foods[norm_name] = item
    else:
        # Keep the one that might be better or just skip
        pass

# Group by category
grouped_foods = {
    'staple': [],
    'meat': [],
    'veg': [],
    'snack': [],
    'store': [],
    'drink': [],
    'fruit': []
}

for item in unique_foods.values():
    if item['categoryId'] in grouped_foods:
        grouped_foods[item['categoryId']].append(item)
    else:
        print("Unknown category:", item['categoryId'])

# Build new file content
new_foods_lines = []

cat_names = {
    'staple': '常吃主食 (Staple)',
    'meat': '肉類與海鮮 (Meat)',
    'veg': '蔬菜與蛋豆 (Veg)',
    'snack': '外食與小吃 (Snacks & Meals)',
    'store': '超商與品牌 (Store & Brands)',
    'drink': '飲料 (Drinks)',
    'fruit': '新鮮水果 (Fruits)'
}

for cat_id in ['staple', 'meat', 'veg', 'snack', 'store', 'drink', 'fruit']:
    new_foods_lines.append(f"        // ================= {cat_names[cat_id]} =================")
    for item in grouped_foods[cat_id]:
        new_foods_lines.append("        " + item["original_str"] + ",")
    new_foods_lines.append("")

# Remove the trailing comma from the last item
if new_foods_lines and new_foods_lines[-2].endswith(","):
    new_foods_lines[-2] = new_foods_lines[-2][:-1]

new_foods_str = "\n".join(new_foods_lines)

new_content = content[:start_idx] + "\n" + new_foods_str + "\n    " + content[end_idx:]

with open("food_db.js", "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Processed {len(food_items)} items down to {len(unique_foods)} unique items.")
