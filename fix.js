const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// The exact block to replace
const pattern = /let weightMatch = selectedFood\.name\.match\(\/\\(\\\d\\\+\\)\\s\*g\/i\);\s*let weightPerServing = weightMatch \? parseFloat\(weightMatch\[1\]\) : null;\s*let isGrams = selectedFood\.name\.includes\('100g'\);\s*let defaultUnit = isGrams \? 'g' : 'serving';\s*let defaultAmount = isGrams \? 100 : 1;\s*selectedFood\.baseUnit = defaultUnit;\s*selectedFood\.baseAmount = defaultAmount;\s*selectedFood\.weightPerServing = weightPerServing;\s*const unitSelectEl = document\.getElementById\('setup-unit-label'\);\s*if \(unitSelectEl\) \{\s*unitSelectEl\.value = defaultUnit;\s*const gOption = unitSelectEl\.querySelector\('option\\[value=""g""\\]'\);\s*if \(gOption\) \{\s*gOption\.disabled = !weightPerServing && !isGrams;\s*\}\s*\}/s;

const replacement = "    let weightPerServing = getEstimatedWeight(selectedFood);
    let isGrams = selectedFood.name.includes('100g');
    
    let defaultUnit = isGrams ? 'g' : 'serving';
    let defaultAmount = isGrams ? 100 : 1;
    
    selectedFood.baseUnit = defaultUnit;
    selectedFood.baseAmount = defaultAmount;
    selectedFood.weightPerServing = weightPerServing;
    
    const unitSelectEl = document.getElementById('setup-unit-label');
    if (unitSelectEl) {
        unitSelectEl.value = defaultUnit;
        const gOption = unitSelectEl.querySelector('option[value=\\"g\\"]');
        if (gOption) {
            gOption.disabled = false;
        }
    }";

code = code.replace(pattern, replacement);
fs.writeFileSync('app.js', code, 'utf8');
