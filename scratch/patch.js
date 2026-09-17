const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const globalVars = 'let hiddenFoodIds = [];\nlet customFoodOrder = {};\nlet isFoodDBEditMode = false;\nlet dbSortable = null;\n\n';
if (!content.includes('let hiddenFoodIds')) {
    content = globalVars + content;
}

content = content.replace(
    /let syncableKeys = \['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'\];/g,
    let syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'hiddenFoodIds', 'customFoodOrder'];
);

content = content.replace(
    /const syncableKeys = \['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'\];/g,
    const syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'hiddenFoodIds', 'customFoodOrder'];
);

content = content.replace(
    /const syncableKeys = \['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'last_updated'\];/g,
    const syncableKeys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'last_updated', 'hiddenFoodIds', 'customFoodOrder'];
);

content = content.replace(
    /const keys = \['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme'\];/g,
    const keys = ['fitness_profile', 'fitness_logs', 'fitness_daily', 'fitness_routines', 'customFoods', 'favoriteFoodIds', 'fitness_theme', 'hiddenFoodIds', 'customFoodOrder'];
);

content = content.replace(
    /favoriteFoodIds: JSON\.stringify\(typeof favoriteFoodIds !== 'undefined' \? favoriteFoodIds : \[\]\) \|\| '\[\]',/g,
    avoriteFoodIds: JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []) || '[]',\n        hiddenFoodIds: JSON.stringify(typeof hiddenFoodIds !== 'undefined' ? hiddenFoodIds : []) || '[]',\n        customFoodOrder: JSON.stringify(typeof customFoodOrder !== 'undefined' ? customFoodOrder : {}) || '{}',
);

const listenerCode =             const currentFavoriteFoodIdsStr = JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []);
            if (data.favoriteFoodIds && data.favoriteFoodIds !== currentFavoriteFoodIdsStr) {
                favoriteFoodIds = JSON.parse(data.favoriteFoodIds);
                changed = true;
            };

const newListenerCode =             const currentFavoriteFoodIdsStr = JSON.stringify(typeof favoriteFoodIds !== 'undefined' ? favoriteFoodIds : []);
            if (data.favoriteFoodIds && data.favoriteFoodIds !== currentFavoriteFoodIdsStr) {
                favoriteFoodIds = JSON.parse(data.favoriteFoodIds);
                changed = true;
            }

            const currentHiddenFoodsStr = JSON.stringify(typeof hiddenFoodIds !== 'undefined' ? hiddenFoodIds : []);
            if (data.hiddenFoodIds && data.hiddenFoodIds !== currentHiddenFoodsStr) {
                hiddenFoodIds = JSON.parse(data.hiddenFoodIds);
                changed = true;
            }

            const currentCustomOrderStr = JSON.stringify(typeof customFoodOrder !== 'undefined' ? customFoodOrder : {});
            if (data.customFoodOrder && data.customFoodOrder !== currentCustomOrderStr) {
                customFoodOrder = JSON.parse(data.customFoodOrder);
                changed = true;
            };

content = content.replace(listenerCode, newListenerCode);

fs.writeFileSync('app.js', content, 'utf8');