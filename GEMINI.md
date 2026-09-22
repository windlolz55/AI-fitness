# PWA Versioning Rule

每次修改完程式碼後，必須：
1. 更新 `index.html` 中的 PWA 版本號字串（例如 `<span ...>v2.48</span>`）以及引用的 js 檔案的 query parameter（例如 `app.js?v=2.48`）。
2. 更新 `sw.js` 中的 `CACHE_NAME` 版本號（例如 `calicorie-v2.48`）。
3. 在回覆中明確告知使用者已經將版本號更新到了哪一版。

---

# 重要架構說明（勿擅自改動）

以下是刻意設計的架構，請勿「修正」回舊寫法：

1. **`getTodayDateStr()`** 是 function，不是 `const`。每次呼叫都即時取當下日期，目的是避免 App 跨午夜後日期卡住的 bug。禁止改回 `const todayDateStr = formatDate(new Date())`。

2. **`isWorkoutCompleted(ex)`** 是頂層 helper function（位於 Workout Logic 區塊開頭）。用來統一判斷 `ex.completed` 的預設值，禁止在各 function 內各自重新定義 `const getCompletedStatus = ...`。

3. **`calcBMR()` / `calcTDEE()`** 是 BMR/TDEE 計算的唯一來源。`calculateTargets()`、`showInfo('cals')`、`showInfo('macros')` 都必須呼叫這兩個 function，禁止各自重複寫計算公式。

4. **`buildEmptyStateHTML()` / `buildExerciseItemHTML()` / `buildCardioSectionHTML()`** 是 `renderWorkout()` 的 HTML 建構 helper，刻意拆出以提升可讀性與維護性，禁止合併回 `renderWorkout()` 內的大段字串。

5. **`visibilitychange` handler** 只做 `setupFirestoreListener(uid)` 重新訂閱，禁止加回手動 `.get({source: 'server'})` 的重複同步邏輯（舊版本有此問題）。

6. **`window.onerror` alert** 已移除。這是 debug 用途，會讓 Safari 加入主畫面時跳出 "Script error." popup，禁止加回。
