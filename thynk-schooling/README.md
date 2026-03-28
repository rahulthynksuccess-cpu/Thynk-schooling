# 🎓 Thynk Schooling — School Admission Portal

**Version 2.0 | March 2026**

India's most comprehensive school admission platform — connecting 1 lakh+ parents with 12,000+ verified schools across 35+ Indian cities.

---

## 🚀 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router)             |
| Styling     | Tailwind CSS                        |
| Animation   | Framer Motion                       |
| State       | Zustand + React Query (TanStack)    |
| Icons       | Lucide React                        |
| Charts      | Recharts                            |
| Maps        | React Leaflet                       |
| Auth        | JWT + OTP (MSG91) + Google OAuth    |
| Payments    | Razorpay                            |
| API Client  | Axios (with auto token refresh)     |
| Fonts       | Syne (display) + DM Sans (body)     |

---

## 📁 Project Structure

```
thynk-schooling/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Homepage
│   ├── login/page.tsx          # Login
│   ├── register/page.tsx       # Registration (OTP flow)
│   ├── schools/                # School listing + [slug] profile
│   ├── dashboard/
│   │   ├── school/             # School Admin Dashboard
│   │   └── parent/             # Parent Dashboard
│   ├── school/complete-profile # School onboarding (multi-step)
│   ├── parent/complete-profile # Parent onboarding
│   ├── admin/settings/         # Super Admin — Dynamic Dropdowns
│   ├── counselling/            # Free counselling booking
│   └── globals.css
├── components/
│   ├── layout/                 # Navbar, Footer
│   ├── home/                   # All homepage sections
│   ├── school/                 # School listing + profile
│   ├── dashboard/              # School + Parent dashboards
│   └── auth/                   # Login + Register
├── hooks/
│   └── useDropdown.ts          # Dynamic dropdown hook (API-driven)
├── lib/
│   ├── api.ts                  # Axios instance + helpers
│   └── config.ts               # Central env config (never hardcode!)
├── store/
│   └── authStore.ts            # Zustand auth state
├── types/
│   └── index.ts                # All TypeScript types
├── .env.example                # Copy to .env.local to start
├── .gitignore                  # .env.local is git-ignored
└── tailwind.config.ts
```

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/thynk-schooling.git
cd thynk-schooling
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `NEXT_PUBLIC_API_URL` → Your backend API URL (default: `http://localhost:5000/api`)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` → Your Razorpay test key
- All other keys as per the `.env.example` comments

### 3. Run

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Backend API Required

This frontend connects to a **Node.js + Express + PostgreSQL backend**.
All API endpoints are prefixed with `NEXT_PUBLIC_API_URL`.

Key API endpoints consumed:
- `GET  /api/settings/dropdown?category=<key>` — Dynamic dropdowns (used everywhere)
- `POST /api/auth/register-mobile` — OTP registration
- `POST /api/auth/login-mobile` — Login
- `GET  /api/schools` — School listing with filters
- `GET  /api/schools/:slug` — School profile
- `GET  /api/leads` — Masked leads (school dashboard)
- `POST /api/leads/:id/purchase` — Buy a lead
- `GET  /api/lead-packages` — Available credit packages
- `POST /api/lead-packages/:id/buy` — Purchase package via Razorpay
- `GET  /api/lead-credits` — School credit wallet

See the full API specification in the Technical Document (v2.0).

---

## 🌐 Pages & Routes

| Route                          | Description                     | Auth Required |
|--------------------------------|---------------------------------|---------------|
| `/`                            | Homepage                        | No            |
| `/login`                       | Login (password + OTP modes)    | No            |
| `/register`                    | Register (3-step OTP flow)      | No            |
| `/schools`                     | School listing with filters     | No            |
| `/schools/:slug`               | School profile page             | No            |
| `/compare`                     | School comparison tool          | No            |
| `/counselling`                 | Free counselling booking        | No            |
| `/school/complete-profile`     | School onboarding (6 steps)     | school_admin  |
| `/parent/complete-profile`     | Parent onboarding               | parent        |
| `/dashboard/school`            | School Admin dashboard          | school_admin  |
| `/dashboard/school/packages`   | Lead credit packages (Razorpay) | school_admin  |
| `/dashboard/parent`            | Parent dashboard                | parent        |
| `/admin/settings`              | Super Admin — dropdown mgmt     | super_admin   |

---

## 🔑 Key Architecture Decisions

### Dynamic Dropdowns (No Hardcoding)
Every dropdown in the app is fetched from `/api/settings/dropdown?category=<key>`.
The `useDropdown(category)` hook handles caching (5 min stale time via React Query).
**Adding a new city/board/class in the Super Admin Settings page reflects everywhere instantly.**

### Environment Variables
All secrets and config live in `.env.local` (dev) or Hostinger env panel (production).
`lib/config.ts` is the single source of truth — never use `process.env` directly in components.

### Auth Flow
1. Register → OTP verify → profile completion gate
2. JWT access token (15 min) stored in localStorage
3. Refresh token in httpOnly cookie → auto-refreshed by Axios interceptor
4. `useAuthStore` (Zustand + persist) manages client-side auth state

### Lead Masking
Masked phone/name shown by default. "Buy Lead" triggers Razorpay payment OR credit deduction.
Full data is only sent by the API after purchase is confirmed — masking is server-side only.

---

## 🚢 Deploying to Hostinger

Hostinger supports **Node.js hosting** (not static export).

### Steps:

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **In Hostinger control panel:**
   - Create a Node.js app (Node 20+)
   - Set entry point: `node_modules/.bin/next start`  
   - Or use: `npm run start`

3. **Set environment variables** in Hostinger → Manage → Environment Variables:
   - Copy all values from `.env.example`
   - Set `NEXT_PUBLIC_APP_URL` to your domain (e.g. `https://thynkschooling.in`)
   - Set `NEXT_PUBLIC_API_URL` to your backend URL
   - Set `NEXT_PUBLIC_APP_ENV=production`
   - Set `BUILD_OUTPUT=standalone` (optional, for smaller Docker-like deploy)

4. **Domain:** Point `thynkschooling.in` to your Hostinger Node.js app

5. **SSL:** Enable in Hostinger panel (free Let's Encrypt)

> **Note:** The backend (Node.js/Express + PostgreSQL + Redis) should be deployed separately — on the same Hostinger server or a separate VPS.

---

## 📦 Key NPM Scripts

| Command          | Description                        |
|------------------|------------------------------------|
| `npm run dev`    | Start dev server (localhost:3000)  |
| `npm run build`  | Production build                   |
| `npm run start`  | Start production server            |
| `npm run lint`   | ESLint check                       |
| `npm run type-check` | TypeScript check               |

---

## 🎨 Design System

**Colors:**
- Navy 900: `#0A0F2E` (background)
- Orange 500: `#FF5C00` (primary accent)
- Surface Card: `#111830` (card background)
- Surface Border: `#1E2A52` (borders)

**Fonts:**
- Display: `Syne` (headings, labels, badges)
- Body: `DM Sans` (paragraphs, inputs)

**CSS Classes (global):**
- `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-outline`
- `.card` `.card-hover`
- `.input` `.label`
- `.badge-orange` `.badge-blue` `.badge-green` `.badge-gray`
- `.section` `.container-xl`
- `.stat-card` `.stat-value` `.stat-label`
- `.text-gradient` `.glass` `.skeleton`

---

## 👥 Team

| Role              | Count |
|-------------------|-------|
| Product Manager   | 1     |
| UI/UX Designer    | 1     |
| Backend Developer | 2     |
| Frontend Developer| 2     |
| QA Engineer       | 1     |
| DevOps            | 1     |

---

## 📄 License

Confidential & Proprietary — © 2026 Thynk Schooling. All rights reserved.
