# 走走 ZOUZOU 🐾

> 你的育兒好去處｜不定期更新全台親子好去處，設施資訊一手掌握，一鍵導航直達

![版本](https://img.shields.io/badge/版本-v1.0-pink) ![平台](https://img.shields.io/badge/平台-GitHub%20Pages-lightgrey) ![資料](https://img.shields.io/badge/資料來源-Google%20Sheets-green)

---

## 📖 專案簡介

「走走 ZOUZOU」是一個專為育兒家庭打造的輕量化 WebApp，解決家長「今天要帶小孩去哪？」的選擇困難。

- **資料管理**：Google Sheets 實時連動，一處修改全網更新
- **技術架構**：純 HTML / CSS / JS，無框架，部署於 GitHub Pages
- **PWA 支援**：可加入手機主畫面，體驗接近 App

---

## ✨ 功能列表

| 功能 | 說明 |
|------|------|
| 🗺️ 探索 | 瀏覽全部親子地點 |
| 🔍 搜尋 | 依名稱關鍵字即時搜尋 |
| 🏷️ 類別篩選 | 景點 / 餐廳 / 購物 / 住宿 |
| 📍 地區篩選 | 全台 17 縣市行政區 |
| ☰ / ⊞ 切換 | 列表模式 / 卡片模式 |
| 📄 詳細頁 | 照片、標籤、備註、地址、電話、營業時間 |
| 🧭 一鍵導航 | 直接開啟 Google Maps |
| ❤️ 收藏 | 本地儲存，不需登入，重開瀏覽器依然保留 |
| ✏️ 投稿 | 透過 Google Forms 投稿地點，審核後上架 |
| ℹ️ 關於 | App 說明與投稿資訊 |
| 📱 PWA | 可加入主畫面，支援全螢幕顯示 |

---

## 🗂️ 檔案結構

```
zouzou/
├── index.html        # 主程式（所有功能整合於此）
├── manifest.json     # PWA 設定檔
├── icon-192.png      # PWA icon（主畫面用）
└── icon-512.png      # PWA icon（啟動畫面用）
```

---

## ⚙️ 設定說明

開啟 `index.html`，找到最上方的 CONFIG 區塊（約第 340 行）：

```javascript
const SHEET_ID = 'your_google_sheet_id';       // Google Sheets 試算表 ID
const SHEET_NAME = '走走_親子友善地標清單';      // 正式資料的分頁名稱
const SUBMIT_FORM_URL = 'https://...viewform'; // 投稿用 Google Forms 網址
```

---

## 📊 Google Sheets 欄位定義

試算表需包含以下欄位（第一行為標題）：

| 欄位名稱 | 必填 | 說明 |
|---------|------|------|
| `name` | ✅ | 地點名稱 |
| `emoji` | ✅ | 代表 Emoji（如 🦁） |
| `category` | ✅ | 景點 / 餐廳 / 購物 / 住宿 |
| `tags` | | 特色標籤，逗號分隔 |
| `area` | ✅ | 地區（如：台北、宜蘭） |
| `address` | | 詳細地址 |
| `phone` | | 聯絡電話 |
| `hours` | | 營業時間（可用 Enter 換行） |
| `mapsUrl` | | Google Maps 導航連結 |
| `website` | | 官網連結 |
| `image` | | 照片網址 |
| `notes` | | 私房備註 |

> 試算表需設為「知道連結的人可以檢視」

---

## 📝 投稿流程

1. 使用者點 App 下方「＋ 投稿」按鈕
2. 開啟 Google Forms，填寫：類別、地區、名稱、Maps 連結、簡介、暱稱
3. 回應自動存入試算表「待審核」分頁
4. 管理員審核後手動複製至正式資料分頁

---

## 🚀 部署方式

1. Fork 或上傳此 repo 至 GitHub
2. Settings → Pages → Branch: `main` → Save
3. 網址：`https://[username].github.io/[repo-name]/`

---

## 📅 版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0 | 2026-04-21 | 初始版本上線，完整功能實裝 |

---

*持續更新中 · Made with ❤️ for 走走家族*
