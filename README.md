# CivicPulse (AI-Powered Municipal Grievance Management Platform)

> **"Your City. Your Voice. Better Governance."**  
> CivicPulse is a modern full-stack web application connecting citizens, field workers, and municipal administrators with AI-assisted triage, duplicate detection, and verified evidence resolution.

---

## 🌟 Key Differentiators & Workflow

1. **Multi-Modal Citizen Intake:** Citizens report civic problems (potholes, garbage, water leaks, drainage, streetlights) using **Live Camera Capture**, **Voice Recording with Live Speech-to-Text Transcription**, and **High-Accuracy GPS**.
2. **AI Triage & Duplicate Grouping:** Powered by Google Gemini. Detects similar complaints in the vicinity and allows citizens to **Confirm Existing Issue** instead of overloading municipal queues.
3. **Department & Worker Dispatch:** Municipal administrators review cases, assign departments, and dispatch authorised field workers.
4. **Mandatory Worker Repair Evidence:** Field workers capture an on-site **after-repair photograph**, **GPS location comparison**, and **server-generated timestamp**. *Workers cannot mark complaints as resolved on their own.*
5. **AI-Assisted Human Verification:** Gemini compares the Before & After photos, evaluates whether the defect was addressed, and generates an audit verdict (`Verified`, `Needs Review`, `Not Verified`). The final resolution decision remains with the authorized municipal administrator.
6. **Transparent Recourse:** Citizens track their complaints through a 7-stage lifecycle timeline, review resolution evidence, rate the repair, or **reopen** unresolved issues.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher) and npm installed on your machine.
- A portable Node.js runtime is pre-packaged in `nodejs/` for instant plug-and-play.

### 2. Running the Development Server
From the root workspace directory, run:
```bash
# If using your system's Node.js:
npm run dev

# Or run directly via the bundled launcher:
run_npm.bat run dev
```

Open your browser to:
**`http://localhost:5173/`**

---

## 🔑 Demo Access & Roles

CivicPulse includes a **zero-config, self-healing demo data engine**. All features work immediately out-of-the-box:

| Portal | Role | Access Method | Key Features |
| :--- | :--- | :--- | :--- |
| **Citizen Portal** | Public Resident | One-click access from Landing Page | Report an Issue (Camera + Voice + GPS), Nearby Issues (1.5km Map + Confirm), Track Complaints (7-Stage Progress + Before/After proof + Reopen) |
| **Worker Portal** | Field Crew Unit #14 | Badge ID: `WRK-14` (default in modal) | Assigned Work Queue, Camera After-Repair Photo, Live GPS Verification, Repair Notes Submission |
| **Admin Portal** | Municipal Officer | Password: `admin123` (default in modal) | Command Dashboard, Complaint Management & Dispatch, Civic Intelligence (Hotspots & Recurring Patterns), Resolution & Accountability (Gemini AI Audit & Approval) |

---

## ⚙️ Configuring Live Firebase & Google Gemini API (Optional)

To connect your own Firebase project and Google Gemini API:

1. Open `.env` (or copy `.env.example` to `.env`):
```env
# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web App Credentials
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. When configured, CivicPulse automatically synchronizes in real time with Cloud Firestore and calls the live Gemini 1.5 Flash model! When absent, the application gracefully operates in Hackathon Demo Mode so presentations never fail.
