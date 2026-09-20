import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = r'''    let weightMatch = selectedFood\.name\.match\(\/\\(\\\d\+\\)\\s\*g\/i\);
    let weightPerServing = weightMatch \? parseFloat\(weightMatch\[1\]\) : null;
    let isGrams = selectedFood\.name\.includes\('100g'\);
    
    let defaultUnit = isGrams \? 'g' : 'serving';
    let defaultAmount = isGrams \? 100 : 1;
    
    selectedFood\.baseUnit = defaultUnit;
    selectedFood\.baseAmount = defaultAmount;
    selectedFood\.weightPerServing = weightPerServing;
    
    const unitSelectEl = document\.getElementById\('setup-unit-label'\);
    if \(unitSelectEl\) {
        unitSelectEl\.value = defaultUnit;
        const gOption = unitSelectEl\.querySelector\('option\[value="g"\]'\);
        if \(gOption\) {
            gOption\.disabled = !weightPerServing && !isGrams;
        }
    }'''

replacement = '''    let weightPerServing = getEstimatedWeight(selectedFood);
    let isGrams = selectedFood.name.includes('100g');
    
    let defaultUnit = isGrams ? 'g' : 'serving';
    let defaultAmount = isGrams ? 100 : 1;
    
    selectedFood.baseUnit = defaultUnit;
    selectedFood.baseAmount = defaultAmount;
    selectedFood.weightPerServing = weightPerServing;
    
    const unitSelectEl = document.getElementById('setup-unit-label');
    if (unitSelectEl) {
        unitSelectEl.value = defaultUnit;
        const gOption = unitSelectEl.querySelector('option[value="g"]');
        if (gOption) {
            gOption.disabled = false;
        }
    }'''

new_code = re.sub(target, replacement, code)
if code == new_code:
    print("NO MATCH! Python regex failed.")
else:
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Python regex replaced successfully.")

