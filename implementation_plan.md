# Scanner UX Redesign

The user requested a hybrid UX for scanning:
1. **Barcode Scanning**: Needs to be a standalone Live Camera view with the visual bounding box for precision.
2. **Food / Ingredient Scanning**: Needs to use the Native Camera (via <input type="file" capture>) for optimal photo quality, but the user wants to first click a generic "Camera" button, then be prompted to select "Food" or "Ingredient" before the camera opens.

## Proposed Changes

### 1. Restore Live Barcode Scanner (index.html)
- Reintroduce the iew-live-barcode full-screen modal.
- It will exclusively use Html5Qrcode via WebRTC.
- It will include the scanner-mask-barcode overlay for precision aiming.

### 2. Main Scanner UI (index.html)
- Remove the inline mode-selection tabs.
- Update the buttons to:
  - **[ 📷 拍照辨識 ]**: Calls promptPhotoScan('camera')
  - **[ 🖼️ 從相簿選取 ]**: Calls promptPhotoScan('album')
  - **[ 🔍 掃描條碼 ]**: Calls openLiveBarcodeScanner()

### 3. Action Sheet / Modal for Mode Selection (index.html)
- Add a new modal scan-type-modal that asks "請選擇要辨識的對象："
  - Option A: **🍽️ 食物 / 餐點** (Food)
  - Option B: **📊 營養標示 / 成分表** (Ingredient)
  - Option C: **🔍 條碼** (Barcode) - *Only shown if they clicked 'Album'*
- When an option is clicked, it sets currentScanMode and then triggers either the native camera (camera-input.click()) or the album picker (ile-input.click()).

### 4. JavaScript Updates (scanner_live.js)
- Restore startBarcodeCamera() and closeBarcodeCamera() functions.
- Add promptPhotoScan(source) function to show the modal.
- Ensure handleFileSelectForPreview correctly handles the selected mode.

## User Review Required
Does this flow perfectly match your expectations?
1. **Barcode**: Dedicated button -> Live scanner with guide box.
2. **Camera**: Generic button -> Prompt "Food or Ingredient?" -> Native iOS Camera.
3. **Album**: Generic button -> Prompt "Food, Ingredient, or Barcode?" -> iOS Photo Picker.
