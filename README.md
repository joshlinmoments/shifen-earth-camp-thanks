# 永續十分地球營 · 感謝告白牆 🏮

營隊工作人員互道感謝的線上平台。選一位對象、寫下感謝、可附照片，所有心意化作天燈，飄在感謝牆上。

- **風格**：十分天燈 · 溫馨夜空
- **前端**：純 HTML / CSS / JS（無框架），部署於 GitHub Pages
- **後端**：Firebase Firestore（留言）。使用免費 Spark 方案即可，無需 Storage / Blaze。
  - 照片功能目前未啟用（新專案的 Storage 需 Blaze 付費方案）。日後如要加照片，可改用「前端壓縮存進 Firestore」或升級 Blaze。

## 檔案結構

| 檔案 | 說明 |
|------|------|
| `index.html` | 頁面結構 |
| `styles.css` | 夜空天燈風格樣式 |
| `app.js` | 前端邏輯、Firebase 串接 |
| `firebase-config.js` | **Firebase 設定 + 工作人員名單**（需填入設定值） |

---

## Firebase 設定教學（約 3 分鐘）

1. 前往 [Firebase Console](https://console.firebase.google.com/) → **新增專案** → 取名例如 `shifen-earth-camp` →（可關閉 Analytics）→ 建立。
2. 左側 **Databases & Storage → Firestore Database → 建立資料庫** → 選「**以正式版模式啟動**」→ 地區選 `asia-east1`（台灣）。
3. 進入 **Firestore → 規則(Rules)**，貼上 `firestore.rules` 的內容 → 發布。
4. 專案設定（齒輪 → Project settings）→ 下方「你的應用程式」→ 點 **`</>`（網頁）** → 註冊 App → 複製 `firebaseConfig` 物件。
5. 把複製到的值貼進本專案 `firebase-config.js` 最上方的 `firebaseConfig`。

> Storage 步驟已省略（照片功能未啟用）。`storage.rules` 保留備用，日後啟用照片再套。

完成後，直接把整個資料夾推上 GitHub 並開啟 Pages 即可。

---

## 本機預覽

因為使用 ES module，需用簡易伺服器（不能直接雙擊開檔）：

```bash
cd shifen-earth-camp-thanks
python3 -m http.server 8000
# 瀏覽器開 http://localhost:8000
```

---

## 名單維護

名單在 `firebase-config.js` 的 `STAFF_LIST` 陣列。每筆：

```js
{ role: "隊輔", name: "王小明", nick: "小明" }
```

- **選對象時**顯示：`職務 · 姓名（稱呼）`
- **留言牆顯示**：有 `nick` 用 `nick`；沒有則用姓名後兩字。

---

## 隱私與資料

- 留言與照片存放在你自己的 Firebase 專案。
- 目前規則允許任何人「新增」與「讀取」留言，不允許修改／刪除。
- 若要下架某則留言，可直接在 Firebase Console 的 Firestore `messages` 集合中刪除該筆。
