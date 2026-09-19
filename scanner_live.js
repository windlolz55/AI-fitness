let currentScanMode = 'barcode';
let html5QrCode = null;
let isCameraRunning = false;
let barcodeLastScanned = null;

const originalOpenScanner = window.openScanner;
const originalCloseScanner = window.closeScanner;
const originalResetScanner = window.resetScanner;
const originalHandleFileSelect = window.handleFileSelectForPreview;

window.setScanMode = function(mode) {
    currentScanMode = mode;
    barcodeLastScanned = null; // Reset debounce
    
    // Update UI buttons
    document.querySelectorAll('.scan-mode-btn').forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update overlay mask and hint
    const mask = document.getElementById('scanner-mask');
    const hint = document.getElementById('scanner-hint');
    const captureBtn = document.getElementById('btn-capture');
    
    mask.className = '';
    mask.classList.add('scanner-mask-' + mode);
    
    if (mode === 'barcode') {
        hint.innerText = '對準條碼進行掃描';
        captureBtn.style.display = 'none';
        
        // Show scanning animation if we want, or just wait for callback
        document.getElementById('scan-progress-container').style.display = 'none';
    } else if (mode === 'food') {
        hint.innerText = '對準食物進行拍攝';
        captureBtn.style.display = 'block';
    } else if (mode === 'ingredient') {
        hint.innerText = '對準營養標示進行拍攝';
        captureBtn.style.display = 'block';
    }
};


window.handleFileSelectForPreview = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        window.currentPreviewFile = file;
        
        if (currentScanMode === 'barcode') {
            if (!window.html5QrCode) {
                window.html5QrCode = new Html5Qrcode('dummy-barcode-reader');
            }
            
            const progContainer = document.getElementById('scan-progress-container');
            const progBar = document.getElementById('scan-progress-bar');
            const progText = document.getElementById('scan-progress-text');
            if (progContainer) {
                progContainer.style.display = 'block';
                progBar.style.width = '10%';
                progText.innerText = '讀取條碼...';
            }

            window.html5QrCode.scanFile(file, true)
                .then(decodedText => {
                    if (navigator.vibrate) navigator.vibrate(200);
                    if (progBar) progBar.style.width = '50%';
                    if (progText) progText.innerText = '搜尋商品中...';
                    
                    fetch('https://world.openfoodfacts.org/api/v2/product/' + decodedText + '.json')
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === 1 && data.product) {
                                const p = data.product;
                                const cal = p.nutriments['energy-kcal_100g'] || 0;
                                const pro = p.nutriments['proteins_100g'] || 0;
                                const carb = p.nutriments['carbohydrates_100g'] || 0;
                                const fat = p.nutriments['fat_100g'] || 0;
                                const name = p.product_name || '商品';
                                
                                document.getElementById('scan-meal-name').value = name;
                                
                                currentScanItems = [{
                                    id: Date.now(),
                                    name: name,
                                    cal: Math.round(cal),
                                    pro: Math.round(pro * 10) / 10,
                                    carb: Math.round(carb * 10) / 10,
                                    fat: Math.round(fat * 10) / 10,
                                    grams: 100,
                                    checked: true
                                }];
                                
                                if (typeof renderScanChecklist === 'function') {
                                    renderScanChecklist();
                                }
                                
                                setTimeout(() => {
                                    if (progContainer) progContainer.style.display = 'none';
                                    document.getElementById('scan-result').classList.remove('hidden');
                                    document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
                                }, 400);

                            } else {
                                alert(查無此商品 ());
                                if (progContainer) progContainer.style.display = 'none';
                            }
                        })
                        .catch(err => {
                            console.error('OpenFoodFacts API Error:', err);
                            alert('查詢失敗，請重試');
                            if (progContainer) progContainer.style.display = 'none';
                        });
                })
                .catch(err => {
                    alert('找不到條碼，請確認照片清晰或重新拍攝');
                    if (progContainer) progContainer.style.display = 'none';
                });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            const cameraIcon = document.getElementById('camera-icon');
            if (cameraIcon) cameraIcon.style.display = 'none';
            
            document.getElementById('btn-camera').style.display = 'none';
            
            const allBtns = document.querySelectorAll('#scanner-main-content .btn-secondary');
            allBtns.forEach(b => {
                if(b.innerText.includes('相簿')) b.style.display = 'none';
            });
            
            executeCustomScan(currentScanMode);
        };
        reader.readAsDataURL(file);
    }
};

function dataUrlToFile(dataUrl, filename) {
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

function executeCustomScan(mode) {
    if (!window.currentPreviewFile) return;
    
    let promptText = "";
    if (mode === 'food') {
        promptText = "你是一個專業營養師。請分析這張食物照片。如果有多項請分開列出，並估算重量(g)、熱量(kcal)、蛋白質(g)、脂肪(g)、碳水(g)。\n【極度重要指令】：你「只准」輸出 JSON 格式的資料，絕對不可以包含任何說明文字、開場白（例如 This delicious...）或 markdown 符號（不要用 ```json）！字串必須以 { 開頭，以 } 結尾。\n請嚴格遵守以下格式，且欄位名稱(key)必須完全一模一樣，不要翻譯。\n*** 所有內容 (包含 reasoning, meal_name, name 的值) 請務必使用「繁體中文」回答！ ***\n{\n  \"reasoning\": \"你的推論\",\n  \"meal_name\": \"食物名稱\",\n  \"items\": [\n    {\n      \"name\": \"品名\",\n      \"grams\": 100,\n      \"cal\": 100,\n      \"pro\": 10,\n      \"carb\": 10,\n      \"fat\": 10\n    }\n  ]\n}";
    } else if (mode === 'ingredient') {
        promptText = "這是一張營養標示的照片。請幫我讀取數據。如果是一整包營養標示，請換算成以 100g 或是 1份。\n【極度重要指令】：你「只准」輸出 JSON 格式的資料，絕對不可以包含任何說明文字、開場白或 markdown 符號（不要用 ```json）！字串必須以 { 開頭，以 } 結尾。\n請嚴格遵守以下格式，且欄位名稱(key)必須完全一模一樣，不要翻譯。\n*** 所有內容 (包含 reasoning, meal_name, name 的值) 請務必使用「繁體中文」回答！ ***\n{\n  \"reasoning\": \"你的推論\",\n  \"meal_name\": \"標示名稱\",\n  \"items\": [\n    {\n      \"name\": \"標題\",\n      \"grams\": 100,\n      \"cal\": 100,\n      \"pro\": 10,\n      \"carb\": 10,\n      \"fat\": 10\n    }\n  ]\n}";
    }
    
    customCallGeminiVisionAPI(window.currentPreviewFile, promptText);
}

// Function to call Gemini with a custom prompt
async function customCallGeminiVisionAPI(file, customPrompt) {
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    if (!apiKey) {
        alert("請輸入 Gemini API Key");
        resetScanner();
        return;
    }

    const progContainer = document.getElementById("scan-progress-container");
    const progBar = document.getElementById("scan-progress-bar");
    const progText = document.getElementById("scan-progress-text");
    
    if (progContainer) {
        progContainer.style.display = "block";
        progBar.style.width = '10%';
        progText.innerText = '10%';
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async function () {
        const base64String = reader.result.split(',')[1];
        
        const payload = {
            contents: [{
                parts: [
                    { text: customPrompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64String } }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2,
                response_schema: {
                    type: "OBJECT",
                    properties: {
                        reasoning: { type: "STRING", description: "用繁體中文回答 (Traditional Chinese)" },
                        meal_name: { type: "STRING", description: "用繁體中文回答 (Traditional Chinese)" },
                        items: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING", description: "用繁體中文回答 (Traditional Chinese)" },
                                    grams: { type: "INTEGER" },
                                    cal: { type: "INTEGER" },
                                    pro: { type: "NUMBER" },
                                    carb: { type: "NUMBER" },
                                    fat: { type: "NUMBER" }
                                },
                                required: ["name", "grams", "cal", "pro", "carb", "fat"]
                            }
                        }
                    },
                    required: ["reasoning", "meal_name", "items"]
                }
            }
        };

        try {
            progBar.style.width = '40%';
            progText.innerText = '40%';

            const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
            let response = null;
            let lastError = null;
            window.modelErrorLog = [];
            window.lastSuccessfulModel = null;

            const errorCodes = {
                429: "流量限制",
                503: "伺服器超載",
                400: "格式錯誤",
                500: "系統內部錯誤"
            };

            for (const model of modelsToTry) {
                try {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (response.ok) {
                        window.lastSuccessfulModel = model;
                        break; 
                    }
                    
                    const errorText = await response.text();
                    const errMsg = errorCodes[response.status] || response.status;
                    window.modelErrorLog.push(`${model} (${errMsg})`);
                    lastError = new Error(`API 錯誤 (${model} - ${response.status}): ${errorText}`);
                    if (response.status === 400) {
                        break;
                    }
                } catch (e) {
                    window.modelErrorLog.push(`${model} (Network Error)`);
                    lastError = e;
                }
            }

            if (!response || !response.ok) {
                throw lastError || new Error("所有模型皆無法回應");
            }
            
            progBar.style.width = '80%';
            progText.innerText = '80%';

            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("AI 沒有回傳有效的內容");
            }
            
            let jsonText = data.candidates[0].content.parts[0].text;
            
            // Clean markdown ticks
            jsonText = jsonText.replace(/```json/i, '').replace(/```/g, '').trim();
            
            // Sometimes Gemini prepends text before the JSON block
            const firstBrace = jsonText.indexOf('{');
            const firstBracket = jsonText.indexOf('[');
            
            if (firstBrace === -1 && firstBracket === -1) {
                throw new Error("AI 無法正確解析食物 (找不到有效的 JSON)。\n\nAI 回覆：" + jsonText.substring(0, 50) + "...");
            }
            
            let startIndex = 0;
            let isObject = false;
            
            if (firstBrace !== -1 && firstBracket !== -1) {
                startIndex = Math.min(firstBrace, firstBracket);
                isObject = (firstBrace < firstBracket);
            } else {
                startIndex = Math.max(firstBrace, firstBracket);
                isObject = (firstBrace !== -1);
            }
            
            let cleanJson = jsonText.substring(startIndex);
            // Also trim any trailing text after the last } or ]
            let endIndex = -1;
            if (isObject) {
                endIndex = cleanJson.lastIndexOf('}');
            } else {
                endIndex = cleanJson.lastIndexOf(']');
            }
            
            if (endIndex !== -1) {
                cleanJson = cleanJson.substring(0, endIndex + 1);
            }
            
            let aiResults;
            try {
                aiResults = JSON.parse(cleanJson);
            } catch (e) {
                throw new Error("AI 無法正確解析食物 (找不到有效的 JSON)。\n\nAI 回覆：" + cleanJson.substring(0, 50) + "...");
            }
            
            if (Array.isArray(aiResults)) {
                aiResults = { meal_name: '綜合食物', items: aiResults };
            } else if (!aiResults.items || !Array.isArray(aiResults.items)) {
                let foundItems = [];
                for (let key of Object.keys(aiResults)) {
                    if (Array.isArray(aiResults[key])) {
                        foundItems = aiResults[key];
                        break;
                    }
                }
                aiResults.items = foundItems.length > 0 ? foundItems : [aiResults];
            }
            
            let finalMealName = aiResults.meal_name;
            if (!finalMealName) {
                for (let key of Object.keys(aiResults)) {
                    let k = key.toLowerCase();
                    if ((k.includes('meal') || k.includes('name') || k.includes('名稱') || k.includes('標題')) && typeof aiResults[key] === 'string') {
                        finalMealName = aiResults[key];
                        break;
                    }
                }
                if (!finalMealName) finalMealName = '綜合食物';
            }
            
            document.getElementById('scan-meal-name').value = finalMealName;
            
            let indicator = document.getElementById("model-indicator");
            if (!indicator) {
                indicator = document.createElement("div");
                indicator.id = "model-indicator";
                indicator.style.fontSize = "10px";
                indicator.style.color = "var(--text-muted)";
                indicator.style.textAlign = "right";
                indicator.style.marginTop = "8px";
                const scanChecklist = document.getElementById('scan-checklist');
                scanChecklist.parentNode.insertBefore(indicator, scanChecklist);
            }
            
            let debugTextarea = document.getElementById("debug-json");
            if (!debugTextarea) {
                debugTextarea = document.createElement("textarea");
                debugTextarea.id = "debug-json";
                debugTextarea.style.width = "100%";
                debugTextarea.style.height = "150px";
                debugTextarea.style.fontSize = "12px";
                debugTextarea.style.color = "#fff";
                debugTextarea.style.background = "#222";
                debugTextarea.style.marginTop = "10px";
                debugTextarea.style.padding = "8px";
                debugTextarea.style.border = "1px solid #444";
                const scanChecklist = document.getElementById('scan-checklist');
                scanChecklist.parentNode.insertBefore(debugTextarea, scanChecklist);
            }
            debugTextarea.value = "Raw JSON: " + cleanJson;
            debugTextarea.style.display = "none";
            
            let debugText = "";
            if (window.modelErrorLog && window.modelErrorLog.length > 0) {
                debugText = `<br><span style="color:#ef4444;">備用切換紀錄: ${window.modelErrorLog.join(', ')}</span>`;
            }
            indicator.innerHTML = `Powered by ${window.lastSuccessfulModel || 'gemini-1.5-flash'}${debugText}`;
            
            currentScanItems = aiResults.items.map(item => {
                let nameStr = item.name;
                let calVal = item.cal;
                let proVal = item.pro;
                let fatVal = item.fat;
                let carbVal = item.carb;
                let gramsVal = item.grams;
                
                for (let key of Object.keys(item)) {
                    let k = key.toLowerCase();
                    if (!nameStr && (k.includes('name') || k.includes('品名') || k.includes('食材') || k.includes('名稱') || k.includes('標題'))) nameStr = item[key];
                    if (calVal === undefined && (k.includes('cal') || k.includes('熱量') || k.includes('卡'))) calVal = item[key];
                    if (proVal === undefined && (k.includes('pro') || k.includes('蛋白'))) proVal = item[key];
                    if (fatVal === undefined && (k.includes('fat') || k.includes('脂'))) fatVal = item[key];
                    if (carbVal === undefined && (k.includes('carb') || k.includes('碳水'))) carbVal = item[key];
                    if (gramsVal === undefined && (k.includes('gram') || k.includes('重量') || k.includes('公克') || k === 'g')) gramsVal = item[key];
                }
                
                return {
                    id: 'scan_' + Date.now() + Math.random().toString(36).substr(2, 9),
                    name: nameStr,
                    cal: parseFloat(calVal) || 0,
                    pro: parseFloat(proVal) || 0,
                    fat: parseFloat(fatVal) || 0,
                    carb: parseFloat(carbVal) || 0,
                    grams: parseFloat(gramsVal) || 100,
                    checked: true
                };
            });
            
            if (typeof renderScanChecklist === 'function') {
                renderScanChecklist();
            }
            
            progBar.style.width = '100%';
            progText.innerText = '完成！';
            
            setTimeout(() => {
                progContainer.style.display = 'none';
                document.getElementById('scan-result').classList.remove('hidden');
                document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
            }, 400);

        } catch (error) {
            console.error(error);
            alert("錯誤: " + error.message);
            resetScanner();
        }
    };
}
