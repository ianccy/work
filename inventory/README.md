# 庫存 / 銷貨小系統

- `sales.html` — 銷貨登錄（商品全部列出，逐項調數量，一次送出多項；整批原子扣庫存）
- `stock.html` — 庫存檢視 / 編輯 / 新增 / 刪除商品
- `price.html` — 價目表（給客人看，只有圖 + 名稱 + 售價，可排序）
- `api.js` — 前端呼叫 Apps Script 的 JSONP 層（**需填 API_URL**）
- `Code.gs` — 貼到 Apps Script 的後端

試算表：https://docs.google.com/spreadsheets/d/1d-z5mWe6_olI2hXZ5Qg0gzBkiTkGcmgUge35QVqeZhQ/edit

## 安裝步驟

1. 打開試算表 → 擴充功能 → Apps Script，把 `Code.gs` 全部內容貼上取代原本的。
2. 上方函式選單選 `setupSheets`，按執行。首次會要求授權，同意即可。
   （會確保 `products` / `sales` 兩張表有正確標題列；已有資料不會動到。）
3. 選 `runSelfTest` 執行一次，Log 出現「全部通過」代表後端正常。測試資料會自動清掉。
4. 右上「部署」→ 新增部署作業 → 類型選「網頁應用程式」
   - 執行身分：**我**
   - 具有應用程式存取權的使用者：**所有人**（知道連結的任何人）
   - 部署後複製 `https://script.google.com/macros/s/.../exec` 網址
5. 把網址貼進 `api.js` 第 4 行 `var API_URL = '';`
6. 推上 GitHub Pages 後開 `https://<你的網域>/inventory/stock.html`

> 每次改 `Code.gs` 後要「管理部署作業 → 編輯 → 版本選『新版本』」重新部署，網址不變。

## 欄位

`products`：`id | name | price | initialStock | updatedAt`
`sales`：`timestamp | productId | productName | qty | note | batchId`
`sales`：`timestamp | productId | productName | qty | note`

`id` 由後端自動產生，不要手改。

## 庫存怎麼算

**庫存不存在試算表裡，是算出來的：**

```
剩餘 = initialStock − sales 裡該商品的 qty 加總
```

- `products.initialStock` 是進貨量，只有你手動改它時才會變動
- 銷貨**只 append 一列到 `sales`**，完全不碰商品列
- 所以刪掉銷貨紀錄，剩餘庫存自動就回來了，不需要任何還原邏輯
- 補貨就是把 `initialStock` 調大

代價：每次讀商品清單都要掃一次 `sales` 整張表。幾千筆內沒問題，真的變慢再加快取。

## 改完前端要跑版本戳記

CDN 會把 `api.js` / `dialog.js` / `style.css` 快取 4 小時（HTML 只有 10 分鐘），
不處理的話改了檔案要等 4 小時使用者才看得到。

改過這三個檔案後執行：

```bash
python3 inventory/bump-assets.py
```

它會用內容雜湊改寫四個頁面的引用（`api.js?v=02d6d20f`）。
內容沒變時雜湊不變，重跑不會產生多餘的 diff。

## 注意

- 部署成「所有人」= 有網址就能改庫存，目前沒有密碼保護。要加就說一聲。
- 新增/銷貨都帶 `reqId`，後端 6 小時內認同一個 `reqId` 只寫一次，避免重複送出產生兩筆。
- 銷貨與商品更新都用 `LockService` 上鎖，多人同時操作不會覆蓋彼此。
- 多項銷貨是整批原子：任一項庫存不足，整批都不寫入。
- 庫存不足時銷貨會被擋下並回報剩餘數量。

## 改欄位後的遷移

`products` 欄位改過（拿掉 spec / cost）時，欄位會位移。做法：清空整張 `products`（含標題列）→ 執行 `setupSheets` → 重新輸入商品。
