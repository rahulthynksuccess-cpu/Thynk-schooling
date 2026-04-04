# Thynk Admin — Redesign v7

## Files in this package

```
app/admin/
  admin.css                   ← Global admin design system CSS
  users/page.tsx              ← Users Manager page
  applications/page.tsx       ← Applications page
  dropdown/page.tsx           ← Dropdown Settings page

components/admin/
  AdminLayout.tsx             ← Sidebar + Header layout wrapper
```

---

## Integration steps

### 1. Copy files into your project

```bash
# From this package root, copy into your Next.js project:
cp app/admin/admin.css          YOUR_PROJECT/app/admin/admin.css
cp app/admin/users/page.tsx     YOUR_PROJECT/app/admin/users/page.tsx
cp app/admin/applications/page.tsx YOUR_PROJECT/app/admin/applications/page.tsx
cp app/admin/dropdown/page.tsx  YOUR_PROJECT/app/admin/dropdown/page.tsx
cp components/admin/AdminLayout.tsx YOUR_PROJECT/components/admin/AdminLayout.tsx
```

### 2. Import the CSS in your admin layout

In `app/admin/layout.tsx` (or the root admin layout), add:

```tsx
import './admin.css'
```

Or in `AdminLayout.tsx` (already included there):
```tsx
import '../../app/admin/admin.css'
// adjust path if your project structure differs
```

### 3. Google Fonts

The design uses **Outfit** and **Syne**. These are loaded via `@import` at the top of `admin.css`.

If you prefer to load them in `<head>` via `next/font` (recommended for performance):

```tsx
// app/admin/layout.tsx
import { Outfit, Syne } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], variable: '--a-sans', weight: ['300','400','500','600','700'] })
const syne   = Syne({ subsets: ['latin'], variable: '--a-display', weight: ['600','700','800'] })

export default function AdminRootLayout({ children }) {
  return (
    <div className={`${outfit.variable} ${syne.variable}`}>
      {children}
    </div>
  )
}
```

Then remove the `@import` line from `admin.css`.

### 4. API endpoints expected

The pages call these API routes. Wire them to your existing Prisma/MongoDB logic:

#### Users
- `GET  /api/admin/users?page=&limit=&q=&role=&status=` → `{ users[], stats, totalPages }`
- `POST /api/admin/users/:id/suspend`
- `DELETE /api/admin/users/:id`
- `GET  /api/admin/users/export` → xlsx blob

#### Applications
- `GET  /api/admin/applications?page=&limit=&q=&status=` → `{ applications[], stats, totalPages }`
- `PATCH /api/admin/applications/:id/status` body: `{ status }`
- `GET  /api/admin/applications/export` → xlsx blob

#### Dropdowns
- `GET    /api/admin/dropdowns/:key` → `{ values[] }`
- `POST   /api/admin/dropdowns/:key` body: `{ name }` → `{ value }`
- `PATCH  /api/admin/dropdowns/:key/:id` body: `{ name?, active? }`
- `DELETE /api/admin/dropdowns/:key/:id`
- `POST   /api/admin/dropdowns/seed`

### 5. Auth store

`AdminLayout.tsx` imports `useAuthStore` from `@/store/authStore`. This should expose:
- `user: { fullName, role, ... } | null`
- `logout: () => void`

---

## Design tokens (CSS variables)

All variables are in `:root` inside `admin.css`. Override any of them in your own CSS to adapt colors:

```css
:root {
  --a-gold: #F59E0B;     /* primary accent */
  --a-bg:   #070B14;     /* page background */
  --a-card: #111827;     /* card surface */
}
```

---

## Features

- **Collapsible sidebar** — icon-only or full labels
- **Animated stat cards** — count-up effect on load, color-coded top border on hover
- **Skeleton loading** — table rows shimmer while data loads
- **Optimistic UI** — toggle/edit updates instantly, reverts on error
- **Toast notifications** — success/error, auto-dismiss
- **Inline editing** — click pencil on any dropdown value to rename in place
- **Bulk status update** — checkbox select + one-click batch status change (Applications)
- **Debounced search** — 400ms debounce, no excessive API calls
- **Pagination** — prev/next with page indicator
- **Export to Excel** — Downloads from `/api/admin/*/export`
