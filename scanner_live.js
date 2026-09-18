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

async function startCamera() {
    if (isCameraRunning) return;
    try {
        if (!html5QrCode && window.Html5Qrcode) {
            html5QrCode = new Html5Qrcode("camera-feed");
        }
        
        if (html5QrCode) {
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: function(viewfinderWidth, viewfinderHeight) {
                        return {
                            width: viewfinderWidth * 0.8,
                            height: viewfinderHeight * 0.4
                        };
                    }
                },
                onBarcodeDetected,
                (errorMessage) => {
                    // ignore generic errors as it constantly checks for barcodes
                }
            );
            
            // Override video styles created by html5-qrcode
            const video = document.querySelector('#camera-feed video');
            if (video) {
                video.style.objectFit = 'cover';
                video.style.width = '100%';
                video.style.height = '100%';
            }
            
            isCameraRunning = true;
            setScanMode('barcode');
        }
    } catch (err) {
        console.error("Camera access failed:", err);
        alert("無法存取相機，請確認已授予權限。若無法使用，請點擊左下角從相簿挑選照片。");
    }
}

async function stopCamera() {
    if (html5QrCode && isCameraRunning) {
        try {
            await html5QrCode.stop();
            html5QrCode.clear();
        } catch(e) {
            console.error("Stop camera error:", e);
        }
    }
    isCameraRunning = false;
}

function onBarcodeDetected(decodedText, decodedResult) {
    if (currentScanMode !== "barcode") return;
    if (barcodeLastScanned === decodedText) return;
    
    barcodeLastScanned = decodedText;
    
    if (navigator.vibrate) navigator.vibrate(200);
    
    closeLiveCamera();
    document.getElementById("scan-progress-container").style.display = "flex";
    document.getElementById('scan-progress-text').innerText = '查詢中...';
    document.getElementById('scan-progress-bar').style.width = '50%';
    
    // Search in OpenFoodFacts API
    fetch(`https://world.openfoodfacts.org/api/v2/product/${decodedText}.json`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 1 && data.product) {
                const p = data.product;
                const cal = p.nutriments['energy-kcal_100g'] || 0;
                const pro = p.nutriments['proteins_100g'] || 0;
                const carb = p.nutriments['carbohydrates_100g'] || 0;
                const fat = p.nutriments['fat_100g'] || 0;
                
                let name = p.product_name || '條碼商品';
                if (p.brands) name = p.brands + ' ' + name;
                
                document.getElementById('scan-meal-name').value = '條碼掃描結果';
                
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
                
                document.getElementById('scan-progress-bar').style.width = '100%';
                document.getElementById('scan-progress-text').innerText = '100%';
                
                setTimeout(() => {
                    document.getElementById('scan-progress-container').style.display = 'none';
                    document.getElementById('scan-result').classList.remove('hidden');
                    document.getElementById('scan-result').scrollIntoView({ behavior: 'smooth' });
                }, 400);

            } else {
                alert(`查無此條碼商品 (${decodedText})`);
                barcodeLastScanned = null;
                document.getElementById('scan-progress-container').style.display = 'none';
            }
        })
        .catch(err => {
            console.error("OpenFoodFacts API Error:", err);
            alert("查詢失敗，請重試");
            barcodeLastScanned = null;
            document.getElementById('scan-progress-container').style.display = 'none';
        });
}


window.openLiveCamera = function() {
    document.getElementById("view-live-camera").style.display = "flex";
    startCamera();
};

window.closeLiveCamera = function() {
    document.getElementById("view-live-camera").style.display = "none";
    stopCamera();
};

// We DO NOT override openScanner anymore. It will just open the normal scanner view.
;

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
    
    const feed = document.getElementById("camera-feed");
    if (feed) feed.style.display = "block";
    document.getElementById('scan-progress-container').style.display = 'none';
    
    // Ensure capture button is shown/hidden based on mode
    setScanMode(currentScanMode);
};

window.captureImage = function() {
    const video = document.querySelector('#camera-feed video');
    if (!video) return;
    
    const canvas = document.getElementById('camera-canvas');
    const preview = document.getElementById('image-preview');
    
    // Set canvas size to video resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Show preview
    preview.src = dataUrl;
    preview.style.display = 'block';
    
    // Hide capture button during processing
    document.getElementById('btn-capture').style.display = 'none';
    
    // Prepare for Gemini API call
    window.currentPreviewFile = dataUrlToFile(dataUrl, 'capture.jpg');
    
    // Execute API call based on mode
    executeCustomScan(currentScanMode);
};

// Also override handleFileSelectForPreview to use new flow
window.handleFileSelectForPreview = function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        window.currentPreviewFile = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('btn-capture').style.display = 'none';
            
            // If they pick a file, we probably default to food unless they selected ingredient mode
            const modeToUse = currentScanMode === 'barcode' ? 'food' : currentScanMode;
            executeCustomScan(modeToUse);
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
        promptText = "你是一個專業營養師。請分析這張照片。如果是食物，請辨識名稱，並估算重量(g)、熱量(kcal)、蛋白質(g)、碳水(g)、脂肪(g)。以JSON格式回傳，不要markdown語法。格式：{ \"reasoning\": \"思考過程\", \"meal_name\": \"名稱\", \"items\": [ { \"name\": \"品名\", \"grams\": 數字, \"cal\": 數字, \"pro\": 數字, \"carb\": 數字, \"fat\": 數字 } ] }";
    } else if (mode === 'ingredient') {
        promptText = "這是一張營養標示表的照片。請精準讀取表上的數據。如果不清楚請合理推估。回傳一份完整的營養數據，通常以 100g 或是 1份 為單位（請優先選擇 1份 的數據若有的話，並在 name 中標示單位如：'營養標示(1份)'）。以JSON格式回傳，不要markdown語法。格式：{ \"reasoning\": \"思考過程\", \"meal_name\": \"營養標示數據\", \"items\": [ { \"name\": \"品名\", \"grams\": 數字(通常是份量克數), \"cal\": 數字, \"pro\": 數字, \"carb\": 數字, \"fat\": 數字 } ] }";
    }
    
    customCallGeminiVisionAPI(window.currentPreviewFile, promptText);
}

// Function to call Gemini with a custom prompt
function customCallGeminiVisionAPI(file, customPrompt) {
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    if (!apiKey) {
        alert("請先輸入 Gemini API Key");
        resetScanner();
        return;
    }

    const progContainer = document.getElementById("scan-progress-container");
    const progBar = document.getElementById("scan-progress-bar");
    const progText = document.getElementById("scan-progress-text");
    
    if (progContainer) {
        // The original UI expects block, the live camera one expects flex.
        // Since we are using the original one (because getElementById returns the first match), use block.
        progContainer.style.display = "block";
    }
    progBar.style.width = '10%';
    progText.innerText = '10%';
    
    document.getElementById('btn-capture').style.display = 'none';

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
            }]
        };

        try {
            progBar.style.width = '40%';
            progText.innerText = '40%';

            const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
            let response = null;
            let lastError = null;

            for (const model of modelsToTry) {
                try {
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    if (response.ok) {
                        break; // Success!
                    } else {
                        const errorText = await response.text();
                        lastError = new Error(`API 錯誤 (${model} - ${response.status}): ${errorText}`);
                    }
                } catch (e) {
                    lastError = e;
                }
            }

            if (!response || !response.ok) {
                throw lastError;
            }

            const data = await response.json();
            
            let jsonText = data.candidates[0].content.parts[0].text;
            
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (match) {
                jsonText = match[0];
            } else {
                jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            
            const aiResults = JSON.parse(jsonText);
            
            document.getElementById('scan-meal-name').value = aiResults.meal_name || 'AI 綜合辨識';
            
            currentScanItems = aiResults.items.map(item => ({
                id: 'scan_' + Date.now() + Math.random().toString(36).substr(2, 9),
                name: item.name,
                cal: parseFloat(item.cal) || 0,
                pro: parseFloat(item.pro) || 0,
                fat: parseFloat(item.fat) || 0,
                carb: parseFloat(item.carb) || 0,
                baseGrams: parseFloat(item.grams) || 100,
                checked: true
            }));
            
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
