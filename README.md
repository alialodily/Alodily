# Patient Link AI

> **AI-powered patient engagement platform for hospital inpatient experience — built for Security Forces Hospital Program (SFHP), Dammam, Saudi Arabia.**

A secondary, supportive platform that **structures non-emergency patient requests**, delivers **AI-curated bedside education**, and gives nursing leadership **real-time operational intelligence** — without ever replacing the nurse call bell.

> ⚠️ **The nurse call bell remains the only authorized emergency channel.** Patient Link AI reinforces this with visible cues, AI guardrails, and multilingual emergency-keyword detection.

[![Tech: React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Built with: Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev)
[![Styling: Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![AI: Claude](https://img.shields.io/badge/AI-Claude%20Sonnet-c97a36)](https://anthropic.com)
[![Status](https://img.shields.io/badge/Status-Concept%20Demo-amber)]()

---

## ✨ Key Features

### 4 Role-Based Experiences
- **Patient** — QR-bound bedside experience, bilingual (English / Arabic), AI Care Companion with 6 modes, mood tracking, cultural & spiritual care, discharge prep
- **Nurse** — Mobile request queue with AI clinical co-pilot, voice messages, two-way text/voice reply, proactive rounding
- **Charge Nurse** — Unit command console with live heatmap, workload balancing, multi-disciplinary triage, AI workload rebalancing
- **Leadership** — KPI dashboard with audit trail, AI insights, CBAHI/NDNQI/Magnet-aligned metrics

### Phase 2 Workflow Enhancements (V1.1)
- Bilingual focus (English + Arabic with RTL support)
- Voice messages from patient → nurse
- Voice + text reply from nurse → patient
- Localized auto-reply on nurse acceptance
- Interactive Charge dashboard with KPI drill-downs

### Authentication & Navigation (V1.2)
- Staff login screens (Nurse · Charge · Leadership) with PIN authentication
- Back / Forward navigation history stack
- Universal "Back to Home" affordance on all auth screens
- Synthetic voice fallback for sandboxed environments
- Per-role session-bound RBAC

### Multi-Department Routing (V1.3)
- **12 multi-disciplinary departments** with auto-routing:
  Nursing · Physician · Pharmacy · Nutrition · Physiotherapy · Respiratory · Housekeeping · Maintenance · Spiritual Care · Discharge Planning · Social Work · Interpreter Services
- AI-driven request routing with confidence scores
- Cross-department triage for Charge Nurse
- Full routing history & audit trail per request
- Real-time notification system (toast + badge + chime)

### AI-Powered Workload Management (V1.4)
- **Patient Assignment Modal** — Manual room-to-nurse distribution with smart helpers (Distribute Evenly · Balance by Priority)
- **AI Workload Rebalance** — Claude Sonnet analyzes nurse load and suggests fair redistribution moves
- Human-in-loop approval workflow with checkbox selection
- Defensive client-side validation (never moves emergencies, never overloads target)
- Live load distribution visualization

### Security & Compliance Layer
- TLS 1.3 · PDPL · RBAC · 90-second auto-lock
- PHI anonymization layer (Privacy Mode masks names/rooms)
- Comprehensive audit trail (every action logged with actor + timestamp + before/after)
- Emergency keyword detection (multilingual)
- Bedside QR + PIN for patient session binding

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 (functional components + hooks) |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS 3 + custom design system |
| **Typography** | Fraunces (display) + Inter (body) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **AI Integration** | Claude Sonnet 4 via Anthropic API |
| **API Proxy** | Vercel Serverless Function (`api/claude.js`) |
| **Deployment** | Vercel (recommended) · any static host with serverless support |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- An [Anthropic API key](https://console.anthropic.com/) for AI features

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/patient-link-ai.git
cd patient-link-ai

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Add your Anthropic API key to .env
# ANTHROPIC_API_KEY=sk-ant-...

# 5. Start the dev server
npm run dev

# Open http://localhost:5173
```

### Demo Credentials

| Role | Credentials |
|---|---|
| **Patient** (Bedside) | Scan QR (simulated) + PIN `1234` |
| **Nurse** | Any Staff ID + PIN `1234` |
| **Charge Nurse** | Any Staff ID + PIN `1234` |
| **Leadership** | Any Staff ID + PIN `1234` |

---

## ☁️ Deploy to Vercel (One-Click)

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# Add your API key as an environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted

# Re-deploy to apply env var
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add environment variable: `ANTHROPIC_API_KEY` (your Anthropic API key)
4. Click **Deploy**

The `api/claude.js` serverless function proxies all AI requests securely (your API key never exposed to the client).

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Patient Link AI                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│   │   Patient   │  │    Nurse    │  │  Charge / Leadership │    │
│   │   (Mobile)  │  │   (Mobile)  │  │      (Console)       │    │
│   └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘    │
│          │                │                    │                │
│          └────────────────┴────────────────────┘                │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  RequestsCtx    │  (React Context)           │
│                  │  Shared State   │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│         ┌─────────────────┼──────────────────┐                 │
│         │                 │                  │                  │
│   ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐            │
│   │ Auto-     │    │  Audit Log  │    │ Security  │            │
│   │ Routing   │    │  (PHI-safe) │    │ Context   │            │
│   │ (AI)      │    │             │    │ (RBAC)    │            │
│   └─────┬─────┘    └─────────────┘    └───────────┘            │
│         │                                                       │
│   ┌─────▼─────────────────────────────────────────┐            │
│   │   Vercel Serverless Function (api/claude.js)  │            │
│   │   ↓                                            │            │
│   │   Claude Sonnet 4 API                          │            │
│   └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
patient-link-ai/
├── api/
│   └── claude.js              # Vercel serverless function (Claude API proxy)
├── public/                    # Static assets
├── src/
│   ├── App.jsx                # Main application (single-file React)
│   ├── main.jsx               # React entry point
│   └── index.css              # Tailwind base styles
├── .env.example               # Environment variables template
├── .gitignore
├── index.html                 # Vite entry
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json                # Vercel deployment config
└── vite.config.js
```

---

## 🛡️ Security & Compliance

- **PDPL** (Saudi Personal Data Protection Law) — aligned design with PHI anonymization
- **CBAHI** — comprehensive audit trail per request with actor + timestamp + reason
- **HIPAA-aligned principles** — least privilege, encryption in transit, session binding
- **No PHI sent to AI** — all patient-identifying data is anonymized before API calls
- **Idle auto-lock** — 90-second timeout on all authenticated sessions
- **Bedside session binding** — patient sessions are tied to room QR (no portable login)
- **Emergency guardrail** — emergency keywords detected in patient input redirect to call bell

---

## 📊 Roadmap

### ✅ Shipped
- **V1.0** — 4-role experience, splash, Bedside auth, full patient/nurse/charge/leadership flows
- **V1.1** — Voice messages, nurse reply, auto-reply, interactive Charge dashboard, Urdu deprecated
- **V1.2** — Staff login, Back/Forward nav, voice synthetic fallback, universal Home button
- **V1.3** — 12-department auto-routing, notification system, Cross-Department Triage for Charge
- **V1.4** — Patient Assignment Modal, AI Workload Rebalance (Claude-powered), live load preview

### 🔜 Planned
- **V1.5** — SLA breach auto-escalation
- **V1.6** — Department-specific dashboards (Nutrition Lead, Pharmacy, etc.) with their own login
- **V1.7** — Shift handoff AI brief (handover summary per nurse)
- **V1.8** — Predictive alerts (overload prediction in next 30 min)
- **V2.0** — EMR integration (HL7 FHIR), real-time websocket sync

---

## 📜 License

This project is a concept demonstration prepared for **Security Forces Hospital Program (SFHP), Dammam, Saudi Arabia**. All rights reserved. Use, modification, and distribution outside SFHP requires written permission from the project lead.

For licensing inquiries: contact the project lead.

---

## 🙏 Credits

- **Concept & Direction**: Ali "Abu Ali" Alodily — Nursing Quality Supervisor, CPHQ, SFHP Dammam
- **Engineering**: AI-assisted development with Claude (Anthropic)
- **Healthcare frameworks**: CBAHI · NDNQI · Magnet · IHI · Adaa Award

---

## 🤝 Contributing

This is a healthcare project — contributions require alignment with patient safety, PDPL compliance, and clinical workflow accuracy. Please open an issue first to discuss any proposed change.

---

<sub>**Patient Link AI — V1.4** · Built with attention to detail · Security Forces Hospital Program · Dammam, Saudi Arabia</sub>
