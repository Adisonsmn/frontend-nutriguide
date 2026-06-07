# 🥗 NutriGuide Frontend

Aplikasi web frontend untuk **NutriGuide** — platform panduan nutrisi personal berbasis React yang membantu pengguna mengelola asupan makanan, menghitung kebutuhan gizi, dan mendapatkan rekomendasi makanan harian.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Fitur](#-fitur)
- [Prasyarat](#-prasyarat)
- [Instalasi & Setup](#-instalasi--setup)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Halaman & Routing](#-halaman--routing)
- [Arsitektur Kode](#-arsitektur-kode)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Struktur Folder](#-struktur-folder)

---

## 🛠 Tech Stack

| Kategori            | Teknologi                        |
| ------------------- | -------------------------------- |
| **Framework**       | React 19                         |
| **Bahasa**          | TypeScript                       |
| **Build Tool**      | Vite 8                           |
| **Routing**         | React Router DOM v7              |
| **State Management**| Zustand                          |
| **Form Handling**   | React Hook Form + Zod            |
| **HTTP Client**     | Axios                            |
| **Styling**         | TailwindCSS v3                   |
| **Icons**           | Lucide React                     |
| **Notifications**   | React Hot Toast                  |
| **Utilities**       | clsx, tailwind-merge             |
| **E2E Testing**     | Cypress 15                       |
| **Linting**         | ESLint                           |
| **Container**       | Docker (Nginx)                   |
| **CI/CD**           | GitHub Actions → Docker Hub → VM |

---

## ✨ Fitur

### 🔐 Autentikasi
- Register & login dengan validasi form
- Forgot password & reset password via OTP email
- Auto refresh token (Axios interceptor)
- Protected routes

### 📊 Dashboard
- Ringkasan kalori harian (consumed vs target)
- Breakdown makronutrien (protein, karbohidrat, lemak)
- Progress tracking harian

### 🍽 Rekomendasi Makanan
- Rekomendasi berdasarkan profil tubuh, goal, & budget
- Pembagian per waktu makan (breakfast, lunch, dinner, snack)
- Filter berdasarkan preferensi diet & budget

### 🔍 Database Makanan
- Pencarian & filter makanan
- Detail nutrisi per makanan
- Resep lengkap (bahan, langkah, waktu persiapan)

### 📝 Riwayat Makan
- Catat konsumsi makanan harian
- Filter berdasarkan tanggal
- Hapus entri riwayat

### 👤 Profil & Preferensi
- Kelola profil fisik (usia, BB, TB, gender, goal)
- Set preferensi diet (vegetarian, dll) & budget harian

### 📰 Artikel Edukasi
- Artikel nutrisi & kesehatan
- Filter berdasarkan kategori

### 🔔 Notifikasi
- Pengingat waktu makan
- Pengaturan jadwal notifikasi

---

## 📦 Prasyarat

- **Node.js** ≥ 18
- **npm** ≥ 9
- Backend NutriGuide berjalan di `http://localhost:3000`

---

## 🚀 Instalasi & Setup

### 1. Clone repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

```bash
cp .env.development .env.development.local
# Edit sesuai kebutuhan
```

---

## 🔐 Environment Variables

### Development (`.env.development`)

```env
VITE_API_URL=http://localhost:3000
```

### Production (`.env.production`)

```env
VITE_API_URL=https://api.yourdomain.com
```

> Semua environment variable harus diawali dengan `VITE_` agar dapat diakses di client-side.

---

## ▶️ Menjalankan Aplikasi

### Development

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:5173` dengan hot module replacement (HMR).

### Preview Production Build

```bash
npm run build      # Build untuk production
npm run preview    # Preview hasil build
```

### Linting

```bash
npm run lint
```

---

## 🗺 Halaman & Routing

### Public Routes

| Path               | Halaman          | Deskripsi                    |
| ------------------ | ---------------- | ---------------------------- |
| `/`                | Landing          | Landing page utama           |
| `/login`           | Login            | Form login                   |
| `/register`        | Register         | Form registrasi              |
| `/forgot-password` | ForgotPassword   | Request OTP via email        |
| `/reset-password`  | ResetPassword    | Reset password dengan OTP    |

### Protected Routes (🔒 Login required)

| Path                       | Halaman        | Deskripsi                      |
| -------------------------- | -------------- | ------------------------------ |
| `/dashboard`               | Dashboard      | Ringkasan nutrisi harian       |
| `/recommendations`         | Recommendation | Rekomendasi makanan            |
| `/food/:foodId`            | FoodDetail     | Detail & nutrisi makanan       |
| `/food/:foodId/recipe`     | RecipePage     | Resep makanan                  |
| `/history`                 | History        | Riwayat konsumsi makanan       |
| `/articles`                | Articles       | List artikel edukasi           |
| `/articles/:articleId`     | ArticleDetail  | Detail artikel                 |
| `/profile`                 | Profile        | Profil & preferensi pengguna   |
| `/notifications`           | Notifications  | Pengaturan notifikasi          |
| `*`                        | NotFound       | Halaman 404                    |

---

## 🏗 Arsitektur Kode

### State Management (Zustand)

```
store/
└── authStore.ts     # Auth state (user, tokens, login/logout)
```

State global menggunakan **Zustand** untuk manajemen autentikasi dan sesi pengguna.

### API Layer (Axios)

```
api/
├── axiosInstance.ts        # Base config + interceptor (auto refresh token)
├── auth.api.ts             # Login, register, logout, forgot/reset password
├── profile.api.ts          # CRUD profil & preferensi
├── dashboard.api.ts        # Data ringkasan harian
├── food.api.ts             # Pencarian & detail makanan
├── recommendation.api.ts   # Rekomendasi makanan
├── history.api.ts          # CRUD riwayat makan
├── article.api.ts          # Artikel edukasi
└── notification.api.ts     # Pengaturan notifikasi
```

Axios instance dikonfigurasi dengan:
- Base URL dari environment variable
- Interceptor otomatis untuk attach access token
- Auto refresh token saat mendapat response 401

### Custom Hooks

```
hooks/
├── usePageTitle.ts      # Dynamic document title
└── useScrollReveal.ts   # Scroll-based animation reveal
```

### Component Organization

```
components/
├── layout/          # PageLayout (header, footer, sidebar)
├── dashboard/       # Dashboard-specific components
└── shared/          # Reusable components (ProtectedRoute, dll)
```

### Type Definitions

```
types/
├── api.types.ts             # Base API response types
├── auth.types.ts            # User & auth types
├── profile.types.ts         # Profile & preference types
├── food.types.ts            # Food & nutrition types
├── recipe.types.ts          # Recipe types
├── recommendation.types.ts  # Recommendation types
├── history.types.ts         # Food history types
├── article.types.ts         # Article types
└── notification.types.ts    # Notification types
```

---

## 🧪 Testing

### End-to-End Tests (Cypress)

```bash
npm run e2e:open     # Buka Cypress GUI
npm run e2e:run      # Jalankan E2E tests di terminal
```

**Test suites yang tersedia:**

| File                 | Deskripsi                              |
| -------------------- | -------------------------------------- |
| `auth.cy.ts`         | Login, register, logout, validasi form |
| `dashboard.cy.ts`    | Dashboard & ringkasan nutrisi          |
| `food.cy.ts`         | Pencarian & detail makanan             |
| `profile.cy.ts`      | CRUD profil pengguna                   |
| `resilience.cy.ts`   | Error handling & edge cases            |

---

## 🐳 Deployment

### Docker Build

Frontend menggunakan **multi-stage Docker build**:

1. **Stage 1 (Builder):** Build React app dengan Node.js
2. **Stage 2 (Production):** Serve static files dengan Nginx

```bash
docker build -t nutriguide-frontend .
docker run -p 80:80 nutriguide-frontend
```

### CI/CD (GitHub Actions)

Pipeline otomatis pada push ke branch `main`:

1. **Build** Docker image
2. **Push** ke Docker Hub (`son07/nutriguide-frontend:latest`)
3. **Deploy** ke VM via SSH (`docker compose pull && up -d`)

### Production Stack

Pada production, frontend berjalan sebagai container Nginx di belakang reverse proxy:

```
Client → Nginx (Reverse Proxy, SSL) → Frontend (Nginx static)
                                     → Backend (Express API)
                                     → PostgreSQL
```

---

## 📁 Struktur Folder

```
frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD pipeline
├── cypress/
│   ├── e2e/                          # E2E test specs
│   │   ├── auth.cy.ts
│   │   ├── dashboard.cy.ts
│   │   ├── food.cy.ts
│   │   ├── profile.cy.ts
│   │   └── resilience.cy.ts
│   ├── fixtures/                     # Test data
│   └── support/                      # Cypress helpers
├── public/                           # Static assets
├── src/
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root component & routing
│   ├── api/                          # API layer (Axios)
│   │   ├── axiosInstance.ts
│   │   ├── auth.api.ts
│   │   ├── profile.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── food.api.ts
│   │   ├── recommendation.api.ts
│   │   ├── history.api.ts
│   │   ├── article.api.ts
│   │   └── notification.api.ts
│   ├── components/
│   │   ├── layout/                   # Page layout components
│   │   ├── dashboard/                # Dashboard widgets
│   │   └── shared/                   # Reusable components
│   ├── hooks/
│   │   ├── usePageTitle.ts
│   │   └── useScrollReveal.ts
│   ├── pages/                        # Page components
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Recommendation.tsx
│   │   ├── FoodDetail.tsx
│   │   ├── RecipePage.tsx
│   │   ├── History.tsx
│   │   ├── Articles.tsx
│   │   ├── ArticleDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── Notifications.tsx
│   │   └── NotFound.tsx
│   ├── store/
│   │   └── authStore.ts              # Zustand auth store
│   ├── styles/                       # Global styles
│   ├── types/                        # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── profile.types.ts
│   │   ├── food.types.ts
│   │   ├── recipe.types.ts
│   │   ├── recommendation.types.ts
│   │   ├── history.types.ts
│   │   ├── article.types.ts
│   │   └── notification.types.ts
│   └── assets/                       # Images, fonts, etc.
├── Dockerfile                        # Multi-stage Docker build
├── nginx.conf                        # Nginx config (SPA routing)
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # TailwindCSS config
├── postcss.config.js                 # PostCSS config
├── tsconfig.json                     # TypeScript config
├── tsconfig.app.json                 # App TypeScript config
├── tsconfig.node.json                # Node TypeScript config
├── eslint.config.js                  # ESLint config
├── cypress.config.ts                 # Cypress config
├── .env.development                  # Dev environment variables
├── .env.production                   # Prod environment variables
└── package.json
```

---

## 📝 Scripts

| Script        | Perintah               | Deskripsi                           |
| ------------- | ---------------------- | ----------------------------------- |
| `dev`         | `npm run dev`          | Development server (HMR)           |
| `build`       | `npm run build`        | Build production bundle             |
| `preview`     | `npm run preview`      | Preview production build            |
| `lint`        | `npm run lint`         | Jalankan ESLint                     |
| `e2e:open`    | `npm run e2e:open`     | Buka Cypress GUI                    |
| `e2e:run`     | `npm run e2e:run`      | Jalankan E2E tests (headless)       |

---

## 👥 Tim Pengembang

**Kelompok 4** — Tugas Besar Implementasi Perangkat Lunak (IMPAL)

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik.
