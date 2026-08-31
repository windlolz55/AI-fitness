const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Remove originalSetItem declaration and monkey patch
code = code.replace(/const originalSetItem = localStorage\.setItem;\n/g, '');
code = code.replace(/\/\/ \(originalSetItem is already declared at the top for Firebase\)\nlocalStorage\.setItem = function\(key, value\) \{[\s\S]*?\};\n/g, '');

// 2. Add setAndSync function
const syncFunc = `
window.setAndSync = function(key, value) {
    localStorage.setItem(key, value);
    const syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'];
    if (syncableKeys.includes(key)) {
        saveToFirestore();
    }
};
`;
code = code.replace(/function saveToFirestore\(\) \{[\s\S]*?\}\n/, match => match + syncFunc);

// 3. Replace originalSetItem inside setupFirestoreListener with localStorage.setItem
code = code.replace(/originalSetItem\.call\(localStorage, k, data\[k\]\);/g, 'localStorage.setItem(k, data[k]);');

// 4. Replace localStorage.setItem( with setAndSync( throughout the file
// But ONLY outside of setupFirestoreListener and setAndSync definition.
// Actually, it's safer to just replace all, then fix the ones that shouldn't be setAndSync.
code = code.replace(/localStorage\.setItem\(/g, 'setAndSync(');

// Fix the ones in setupFirestoreListener and setAndSync
code = code.replace(/setAndSync\(k, data\[k\]\);/g, 'localStorage.setItem(k, data[k]);');
code = code.replace(/window\.setAndSync = function\(key, value\) \{\n    setAndSync\(key, value\);/g, 'window.setAndSync = function(key, value) {\n    localStorage.setItem(key, value);');
code = code.replace(/setAndSync\('fitness_profile', JSON\.parse\(/g, 'localStorage.setItem(\'fitness_profile\', JSON.parse('); // Wait, this doesn't exist, it's getItem

fs.writeFileSync('app.js', code);
console.log('Fixed app.js');
