# PWA Versioning Rule

每次修改完程式碼後，必須：
1. 更新 `index.html` 中的 PWA 版本號字串（例如 `<span ...>v2.48</span>`）以及引用的 js 檔案的 query parameter（例如 `app.js?v=2.48`）。
2. 更新 `sw.js` 中的 `CACHE_NAME` 版本號（例如 `calicorie-v2.48`）。
3. 在回覆中明確告知使用者已經將版本號更新到了哪一版。
