# Auto-Store Website

Next.js website for Auto-Store ecosystem.

## Setup

```bash
cd web
npm install
npm run dev
```

Visit: http://localhost:3000

## Features

- Admin Dashboard
- User Dashboard with Discord OAuth2
- Product Management
- Order Tracking
- Payment Integration
- Real-time Updates

## Structure

```
web/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   ├── dashboard/    # Dashboard pages
│   └── auth/         # Auth pages
├── components/       # React components
├── lib/              # Utilities
└── styles/           # CSS styles
```

## Note

Website ini masih dalam tahap pengembangan.
Untuk saat ini, gunakan mode `DiscordBotOnly` jika hanya butuh bot Discord.

Mode `IntegratedMode` memerlukan website ini fully configured.
