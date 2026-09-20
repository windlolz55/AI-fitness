let currentScanSource = 'camera';

window.openScanTypeModal = function(source) {
    currentScanSource = source;
    const modal = document.getElementById('scan-type-modal');
    modal.style.display = 'flex';
    // Force reflow
    modal.offsetHeight;
    modal.style.opacity = '1';
    modal.children[0].style.transform = 'translateY(0)';
};

window.closeScanTypeModal = function() {
    const modal = document.getElementById('scan-type-modal');
    modal.style.opacity = '0';
    modal.children[0].style.transform = 'translateY(100%)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

window.selectScanType = function(mode) {
    closeScanTypeModal();
    setScanMode(mode);
    
    setTimeout(() => {
        if (mode === 'barcode' && currentScanSource === 'camera') {
            openBarcodeScanner();
        } else {
            if (currentScanSource === 'camera') {
                document.getElementById('camera-input').click();
            } else {
                document.getElementById('file-input').click();
            }
        }
    }, 350);
};

window.openBarcodeScanner = function() {
    document.getElementById('view-live-barcode').style.display = 'flex';
    startBarcodeCamera();
};

window.closeBarcodeCamera = function() {
    if (window.html5QrCodeLive && window.html5QrCodeLive.isScanning) {
        window.html5QrCodeLive.stop().catch(err => console.error(err));
    }
    document.getElementById('view-live-barcode').style.display = 'none';
};

function startBarcodeCamera() {
    if (!window.html5QrCodeLive) {
        window.html5QrCodeLive = new Html5Qrcode("barcode-feed");
    }
    
    if (window.html5QrCodeLive.isScanning) {
        return;
    }
    
    const config = { 
        fps: 15,
        disableFlip: false,
        videoConstraints: { 
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            advanced: [{ focusMode: "continuous" }]
        }
    };
    
    document.getElementById('barcode-progress-container').style.display = 'none';
    
    window.html5QrCodeLive.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
            if (!barcodeLastScanned) {
                barcodeLastScanned = decodedText;
                if (navigator.vibrate) navigator.vibrate(200);
                
                const progContainer = document.getElementById('barcode-progress-container');
                const progBar = document.getElementById('barcode-progress-bar');
                const progText = document.getElementById('barcode-progress-text');
                
                progContainer.style.display = 'flex';
                progBar.style.width = '50%';
                progText.innerText = '搜尋商品中...';
                
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
                                closeBarcodeCamera();
                                document.getElementById('scan-result').classList.remove('hidden');
                                document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
                            }, 400);

                        } else {
                            if (confirm("國際商品庫查無此條碼 (" + decodedText + ")\n\n台灣在地商品建議您改用「營養標示 / 成分表」模式，讓 AI 直接為您讀取包裝！\n\n是否立即開啟相機拍攝營養標示？")) {
                                closeBarcodeCamera();
                                setScanMode('nutrition');
                                document.getElementById('camera-input').click();
                            } else {
                                barcodeLastScanned = null;
                            }
                            progContainer.style.display = 'none';
                        }
                    })
                    .catch(err => {
                        console.error('API Error:', err);
                        if (confirm("查詢失敗或網路異常\n\n是否改用「營養標示」模式直接拍攝包裝？")) {
                            closeBarcodeCamera();
                            setScanMode('nutrition');
                            document.getElementById('camera-input').click();
                        } else {
                            barcodeLastScanned = null;
                        }
                        progContainer.style.display = 'none';
                    });
            }
        },
        (errorMessage) => { }
    ).catch(err => {
        console.error("Camera start error:", err);
        alert("無法啟動相機：" + err);
    });
}
let currentScanMode = 'barcode';
let barcodeLastScanned = null;


const originalResetScanner = window.resetScanner;

window.setScanMode = function(mode) {
    currentScanMode = mode;
    barcodeLastScanned = null; // Reset debounce
    
    // Update UI buttons
    document.querySelectorAll('.scan-mode-btn').forEach(btn => {
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
            btn.style.backgroundColor = 'var(--accent-primary)';
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--text-main)';
        }
    });
};

window.handleNativeCameraSelect = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        window.currentPreviewFile = file;

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            const cameraIcon = document.getElementById('camera-icon');
            if (cameraIcon) cameraIcon.style.display = 'none';
            
            const btnCamera = document.getElementById('btn-camera');
            if (btnCamera) btnCamera.style.display = 'none';
            
            const allBtns = document.querySelectorAll("#scanner-main-content .btn-secondary");
            allBtns.forEach(b => {
                if(b.innerText.includes("從相簿")) b.style.display = "none";
            });
            
            executeCustomScan(currentScanMode);
        };
        reader.readAsDataURL(file);
    }
};

window.resetScanner = function() {
    originalResetScanner();
    const preview = document.getElementById("image-preview");
    const cameraIcon = document.getElementById("camera-icon");
    if (preview) preview.style.display = "none";
    if (cameraIcon) cameraIcon.style.display = "block";
    
    const btnCamera = document.getElementById("btn-camera");
    if (btnCamera) btnCamera.style.display = "block";
    const allBtns = document.querySelectorAll("#scanner-main-content .btn-secondary");
    allBtns.forEach(b => {
        if(b.innerText.includes("從相簿")) b.style.display = "block";
    });
    
    document.getElementById('scan-progress-container').style.display = 'none';
    setScanMode(currentScanMode);
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
        promptText = `你是一個專業營養師。請分析這張食物的照片。如果有好幾種食物，請拆解出來，並估算重量(g)、熱量(kcal)、碳水化合物(g)、蛋白質(g)、脂肪(g)。\n請務必以嚴格的、純粹的 JSON 格式回答，絕對不能包含任何說明文字、開頭或結尾（例如 This is...）！字串必須以 { 開頭，以 } 結尾。\n若只有一種食物，也請當作只有一項，並請翻譯。\n*** 所有欄位 (包含 reasoning, meal_name, name 等) 請務必使用「繁體中文」回答！ ***\n{\n  "reasoning": "說明",\n  "meal_name": "餐點名稱",\n  "items": [\n    {\n      "name": "食物名稱",\n      "grams": 100,\n      "cal": 100,\n      "pro": 10,\n      "carb": 10,\n      "fat": 10\n    }\n  ]\n}`;
    } else if (mode === 'ingredient') {
        promptText = `這是一張食品包裝的「營養標示」或成分表。
請你擔任精準的資料擷取員，目標是計算出【這整包/整瓶】的總營養素。嚴格遵守以下規則：
1. 找出「每一份量」(例如 25g 或 25ml) 與「本包裝含幾份」(例如 4份)。
2. 計算出整包裝的總克數 (例如 25 * 4 = 100g)。若為毫升(ml)請直接當作克(g)。
3. 計算出【整包裝】的總熱量(cal)、總蛋白質(pro)、總碳水(carb)與總脂肪(fat)。(可直接用「每份」數值乘以份數，或用「每100公克」數值去換算總克數)。
4. 如果標示完全沒寫總份數，才退而求其次以表上的「每100公克」或單一「每一份量」作為基準。
5. 確保 grams(總克數), cal(總大卡), pro(總蛋白), carb(總碳水), fat(總脂肪) 數據完全對應，忽略鈉與糖。

請務必以嚴格的純粹 JSON 格式回答，絕對不能包含任何說明文字、開頭！字串必須以 { 開頭，以 } 結尾。
*** 所有欄位 (包含 reasoning, meal_name, name 等) 請務必使用「繁體中文」回答！ ***
{
  "reasoning": "說明你如何計算出整包裝的總克數與總熱量",
  "meal_name": "從包裝辨識出的商品名稱 (若無則填「某食品」)",
  "items": [
    {
      "name": "整包/整瓶",
      "grams": 總克數,
      "cal": 總熱量,
      "pro": 總蛋白質,
      "carb": 總碳水,
      "fat": 總脂肪
    }
  ]
}`;
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

    const progContainer1 = document.getElementById("scan-progress-container");
    const progBar1 = document.getElementById("scan-progress-bar");
    const progText1 = document.getElementById("scan-progress-text");
    
    function updateProgress(percent, text) {
        if (progContainer1) {
            if (percent === 'none') {
                progContainer1.style.display = 'none';
            } else {
                progContainer1.style.display = "block";
                if (progBar1) progBar1.style.width = percent;
                if (progText1) progText1.innerText = text || percent;
            }
        }
    }
    
    updateProgress('10%', '10%');

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
                        reasoning: { type: "STRING", description: "繁體中文 (Traditional Chinese)" },
                        meal_name: { type: "STRING", description: "繁體中文 (Traditional Chinese)" },
                        items: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING", description: "繁體中文 (Traditional Chinese)" },
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
            updateProgress('40%', '40%');

            const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
            let response = null;
            let lastError = null;
            window.modelErrorLog = [];
            window.lastSuccessfulModel = null;

            const errorCodes = {
                429: "流量限制",
                503: "伺服器超載",
                400: "格式錯誤",
                500: "系統錯誤"
            };

            for (const model of modelsToTry) {
                try {
                    response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
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
                    lastError = new Error(errMsg + ": " + errorText.substring(0, 50));
                } catch (err) {
                    console.error("API Call failed for model", model, err);
                    lastError = err;
                }
            } // end for loop

            if (!response || !response.ok) {
                throw lastError || new Error("所有模型嘗試失敗");
            }
            
            updateProgress('80%', '80%');

            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("AI 未返回有效內容");
            }
            
            let jsonText = data.candidates[0].content.parts[0].text;
            
            // Clean markdown ticks
            jsonText = jsonText.replace(/`json/i, '').replace(/`/g, '').trim();
            
            // Sometimes Gemini prepends text before the JSON block
            const firstBrace = jsonText.indexOf('{');
            const firstBracket = jsonText.indexOf('[');
            
            if (firstBrace === -1 && firstBracket === -1) {
                throw new Error("AI 無法正確解析 (找不到有效的 JSON)。\n\nAI 回覆：" + jsonText.substring(0, 50) + "...");
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
            
            jsonText = jsonText.substring(startIndex);
            const resultObj = JSON.parse(jsonText);
            
            if (isObject) {
                document.getElementById('scan-meal-name').value = resultObj.meal_name || '餐點名稱';
                currentScanItems = (resultObj.items || []).map((item, index) => ({
                    id: Date.now() + index,
                    name: item.name || '項目',
                    cal: Math.round(item.cal || 0),
                    pro: Math.round((item.pro || 0) * 10) / 10,
                    carb: Math.round((item.carb || 0) * 10) / 10,
                    fat: Math.round((item.fat || 0) * 10) / 10,
                    grams: item.grams || 100,
                    checked: true
                }));
            } else {
                currentScanItems = resultObj.map((item, index) => ({
                    id: Date.now() + index,
                    name: item.name || '項目',
                    cal: Math.round(item.cal || 0),
                    pro: Math.round((item.pro || 0) * 10) / 10,
                    carb: Math.round((item.carb || 0) * 10) / 10,
                    fat: Math.round((item.fat || 0) * 10) / 10,
                    grams: item.grams || 100,
                    checked: true
                }));
                document.getElementById('scan-meal-name').value = '辨識結果';
            }

            if (typeof renderScanChecklist === 'function') {
                renderScanChecklist();
            }
            
            updateProgress('100%', '完成');
            
            setTimeout(() => {
                updateProgress('none');
                document.getElementById('scan-result').classList.remove('hidden');
                document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
            }, 400);

        } catch (error) {
            console.error(error);
            if (progContainer1 && progContainer1.style.display !== 'none') {
                if (progText1) progText1.innerHTML = '<span style="color:#ef4444;">錯誤: ' + error.message + '</span>';
                if (progBar1) progBar1.style.backgroundColor = '#ef4444';
                // Do not auto-close, let user read it
                setTimeout(() => resetScanner(), 4000);
            } else {
                alert("錯誤: " + error.message);
                resetScanner();
            }
        }
    };
}
// Initialize the mode styling correctly on load
setTimeout(() => setScanMode(currentScanMode), 100);