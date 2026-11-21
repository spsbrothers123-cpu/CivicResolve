# CivicResolve — Better Cities Begin With Better Reporting

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **CivicResolve** is an enterprise-grade civic issue reporting and municipal dispatch platform that bridges the gap between citizens and city administration. It transforms unstructured neighborhood complaints into prioritized, categorized, and actionable municipal work orders using **Google Gemini Multimodal AI** and an immutable **Supabase PostgreSQL** audit infrastructure.

---

## 🏆 For Hackathon Judges & Evaluators

To experience the full end-to-end municipal governance workflow in under 3 minutes, use our pre-provisioned evaluator credentials:

### ⚡ 1-Click Interactive Switcher ("Live Backend" Widget)
Look at the **bottom-right corner** of any page on CivicResolve:
* Click the floating **`● Live Backend`** badge.
* The badge opens an evaluation control panel displaying real-time PostgreSQL connectivity, active authentication role, and instant 1-click portal switching.
* It displays the **Jury Demo Credentials** directly on-screen for effortless copy-pasting!

### 🔑 Pre-Configured Demo Credentials

| Role | Portal URL | Official Email (Dummy) | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `/admin/login` | `lumenstackdevs@gmail.com` | `hack2skill123` | Full dispatch dashboard, AI triage review, priority override, department reassignment, audit notes |
| **Resident Citizen** | `/login` | `spsbrothers123@gmail.com` | *(or self-register any email)* | Issue reporting, private photo uploads, live resolution tracking, personal dashboard |

> *Note: These credentials are dummy demo accounts provisioned in our isolated Supabase sandbox specifically for hackathon evaluation.*

---

## 🌟 Why CivicResolve Wins

Most civic reporting tools fail at two points: **messy intake** (vague citizen descriptions flood city departments) and **black-box resolution** (citizens never hear back after reporting). CivicResolve solves both:

1. **Multimodal AI Intake**: Citizens snap a photo and describe the problem in plain language. Google Gemini (`gemini-3.5-flash-lite`) instantly detects hazard category, evaluates public safety risk, assigns severity (`Critical`, `High`, `Medium`, `Low`), and routes the ticket to the correct municipal department (`Roads`, `Sanitation`, `Electricity`, `Water Supply`, `Drainage`).
2. **Human Authority & Non-Autonomy**: In compliance with responsible civic AI governance, Gemini is strictly advisory. Municipal officers review AI recommendations alongside original photo evidence and retain 100% authority to reassign, override, or escalate.
3. **Immutable Audit Trails**: Every status transition (`Reported` → `Under Review` → `In Progress` → `Resolved`) is permanently recorded in PostgreSQL via database triggers with timestamps, official notes, and resolution photo proof.
4. **Zero-Friction Citizen Tracking**: Every report receives a unique tracking reference (e.g. `CIV-1002`). Citizens can track repair progress in real time without creating an account via the public `/track` portal.

---

## 🛠️ Complete Technology Stack

```mermaid
graph TD
    Client["Citizen & Municipal Admin (Next.js 14 App Router)"]
    API["Server Actions & Route Handlers (Edge & Node.js)"]
    Gemini["Google Gemini 3.5 Flash Lite (@google/genai)"]
    SupabaseDB["Supabase PostgreSQL (RLS & Audit Triggers)"]
    SupabaseAuth["Supabase Auth (PKCE & SSR Cookies)"]
    SupabaseStorage["Private Storage Bucket (HMAC Signed URLs)"]

    Client -->|Form Submission & Photos| API
    API -->|Multimodal Triage Prompt| Gemini
    Gemini -->|Structured Advisory JSON| API
    API -->|Validated Inserts & Updates| SupabaseDB
    API -->|HMAC Signed URL Access| SupabaseStorage
    Client -->|Session Verification| SupabaseAuth
```

### 1. Frontend & Presentation
* **Next.js 14 App Router**: Server and Client Components, streaming Suspense boundaries, and dynamic route optimization.
* **TypeScript 5.7**: Strict type checking with 0 type errors across the entire codebase.
* **Tailwind CSS 3.4**: Custom design system featuring a deep civic palette (`#102C35` deep teal, `#D6F36A` lime accent, and `#F5F5EF` neutral background).
* **Lucide React**: Clean, accessible iconography.

### 2. Artificial Intelligence Engine
* **Google Gemini API (`@google/genai` official SDK)**:
  * Model: `gemini-3.5-flash-lite` (high throughput, ultra-low latency).
  * Multimodal Image Analysis: Inspects uploaded evidence photos directly via inline base64/buffer payloads.
  * Schema Enforcement: Structured JSON responses strictly parsed through Zod (`aiAnalysisSchema`).
  * Failure-Resilient Fallback: If AI quotas are saturated or network timeouts occur, complaint submission **never fails**; deterministic heuristics assign safe default triage with `requires_human_review = true`.

### 3. Backend, Database & Storage
* **Supabase PostgreSQL**:
  * Relational tables: `public.profiles`, `public.issues`, `public.issue_status_history`.
  * Row-Level Security (RLS): Citizen data isolation enforced at the database kernel.
  * PostgreSQL Triggers:
    * `trg_protect_profile_role`: Blocks client-side privilege escalation attacks.
    * `trg_issue_status_audit`: Automatically captures immutable transition logs.
* **Supabase Storage**:
  * Private Bucket (`civic-evidence` with `public: false`).
  * Evidence photos are secured and served exclusively via time-bound HMAC signed URLs.

### 4. Security & Compliance
* **Enterprise Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
* **Rate Limiting**: Sliding-window IP rate limiter in `src/lib/rate-limit.ts` preventing abuse on public intake endpoints.
* **Legal Disclosures**: Dedicated Privacy Policy (`/privacy`), Terms of Service (`/terms`), Support directory (`/contact`), and inline AI governance banners on reporting forms.

---

## 🏛️ 17-Screen Visual Architecture Map

Every single screen from the comprehensive civic design specification is fully implemented and operational:

### 👤 Citizen Portal (Screens 01–09)
* **Screen 01 — Public Landing Page** (`/`): Mission overview, live impact counters, multimodal AI showcase, and quick CTAs.
* **Screen 02 — Citizen Auth** (`/login`): Clean dual-mode Login/Signup with real-time field validation.
* **Screen 03 — Citizen Dashboard** (`/dashboard`): Metric cards (`Total`, `Reported`, `In Progress`, `Resolved`), recent reports table, and quick actions.
* **Screen 04 — Report Civic Issue** (`/report`): Step-by-step form with category selection, GPS/manual location, and photo upload.
* **Screen 05 — AI Advisory Assessment** (`/report`): Gemini AI category detection, severity score, priority recommendation, and department routing.
* **Screen 06 — Submission Confirmation** (`/report`): Instant reference generation (`CIV-XXXX`) and one-click tracking deep-link.
* **Screen 07 — My Complaints Console** (`/complaints`): Filterable, searchable complaints log with status tabs.
* **Screen 08 — Complaint Timeline & Evidence** (`/complaints/[id]`): Multi-stage resolution progression, official municipal notes, and signed photo proofs.
* **Screen 09 — Citizen Profile & Rights** (`/profile`): Verified citizen identity badge, personal info updates, and data erasure request guidance.

### 🏢 Municipal Admin Operations Center (Screens 10–17)
* **Screen 10 — Admin Authentication** (`/admin/login`): Restricted access portal verifying `role === 'admin'`.
* **Screen 11 — Operations Dashboard** (`/admin`): Live municipal KPI cards, category distribution, critical queues, and dispatch analytics.
* **Screen 12 — Complaint Dispatch Table** (`/admin/complaints`): Searchable, filterable work order table with severity/priority tags.
* **Screen 13 — Officer Complaint Workspace** (`/admin/complaints/[id]`): Side-by-side comparison of Gemini AI Advisory vs. Human Authority, department reassignment, status updater, and official note logging.
* **Screen 14 — Priority Queue** (`/admin/priority`): Urgency-segmented ticket queues (`Critical`, `High`, `Medium`, `Low`).
* **Screen 15 — Department Workloads** (`/admin/departments`): Department workload distribution (`Roads`, `Sanitation`, `Electricity`, `Water Supply`, `Drainage`).
* **Screen 16 — Geospatial GIS Map** (`/admin/map`): Interactive city map with priority-coded incident pins.
* **Screen 17 — Performance Analytics** (`/admin/analytics`): Resolution rate KPIs, dispatch SLAs, and AI accuracy metrics.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/CivicResolve.git
cd CivicResolve
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase and Gemini keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Verification & Quality Gates

Run our complete automated verification suite (156 passing tests):

```bash
# Run unit, integration, and AI failure resilience tests
npm test

# Verify 100% type safety
npx tsc --noEmit

# Run Next.js production linting
npm run lint

# Compile optimized production build
npm run build
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
