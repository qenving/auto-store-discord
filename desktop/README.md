# Auto-Store Desktop Manager

Desktop application untuk mengelola Auto-Store Discord Bot di Windows.

## Fitur

✅ **Dashboard** - Statistik real-time dan overview sistem
✅ **Settings** - Konfigurasi lengkap (mode, database, Discord, payment, features)
✅ **Products** - Manage produk (create, edit, delete, activate/deactivate)
✅ **Stock** - Manage stock produk (add single, bulk upload, view, clear)
✅ **Orders** - View dan filter orders (by status, user, date range)
✅ **Users** - Manage users (view, edit balance, history)
✅ **Logs** - Real-time bot logs viewer
✅ **Bot Control** - Start/stop bot dari aplikasi

## Install

```bash
cd desktop
npm install
```

## Run Development

```bash
npm start
```

## Build untuk Production

**Windows:**
```bash
npm run build:win
```

Output: `desktop/dist/Auto-Store Manager Setup.exe`

**Mac:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

## Cara Pakai

1. **Start API Server** - API server otomatis start saat bot jalan
2. **Open Desktop App** - Jalankan `npm start` atau buka executable
3. **Configure** - Klik Settings untuk setup config
4. **Start Bot** - Klik "Start Bot" di sidebar
5. **Manage** - Gunakan menu untuk manage products, stock, orders, dll

## Struktur Folder

```
desktop/
├── main.js                 # Electron main process
├── renderer/
│   ├── index.html         # Main HTML
│   ├── styles/
│   │   └── main.css       # UI styling
│   └── scripts/
│       ├── api.js         # API client
│       ├── bot-control.js # Bot control
│       ├── navigation.js  # Page routing
│       ├── main.js        # App initialization
│       └── pages/
│           ├── dashboard.js
│           ├── settings.js
│           ├── products.js
│           ├── stock.js
│           ├── orders.js
│           ├── users.js
│           └── logs.js
└── assets/                # Icons & images
```

## Requirements

- Node.js 18+
- Auto-Store API Server running (port 3001)

## Technology Stack

- **Electron** 28+ - Desktop app framework
- **Vanilla JS** - No framework overhead, fast & lightweight
- **CSS3** - Modern responsive design
- **REST API** - Communication with bot via Express API

## Notes

- Desktop app berkomunikasi dengan bot via HTTP API (localhost:3001)
- Bot process dijalankan sebagai child process dan dapat dikontrol via app
- Real-time logs ditampilkan via IPC communication
- Config changes langsung disimpan ke config.json
- Restart bot diperlukan untuk beberapa config changes

## Security

- API server hanya listen di localhost (tidak exposed ke internet)
- No authentication required karena lokal only
- Config file credentials tersimpan lokal di filesystem
