# Amba Lifestyle Admin Panel 🛍️⚡

Modern Super-Admin portal built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 📁 Folder Structure

```
amba-lifestyle-admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Admin Overview Dashboard
│   │   └── globals.css        # Tailwind styling
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminHeader.tsx    # Header with search & notifications
│   │   │   └── AdminSidebar.tsx   # Sidebar navigation
│   │   └── ui/
│   │       ├── Badge.tsx          # Status badges
│   │       ├── Button.tsx         # Standard button variants
│   │       ├── Card.tsx           # Content card
│   │       ├── Input.tsx          # Form inputs
│   │       └── Modal.tsx          # Popups & dialogs
│   ├── lib/
│   │   └── api.ts             # API client with token authorization
│   └── types/
│       └── index.ts           # TypeScript interfaces for API & Models
├── .env.example
├── .env.local
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

```ini
NEXT_PUBLIC_APP_NAME="Amba Lifestyle Admin"
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_VENDOR_URL="http://localhost:3002"
PORT=3001
```

---

## 🛠️ Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
