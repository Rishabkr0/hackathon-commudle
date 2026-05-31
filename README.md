# Aura Triage (KGMU AI Agent)

A real-time, AI-powered triage system that pre-screens outpatient cases via a simulated WhatsApp interface. The agentic backend automatically assesses symptom severity, predicts wait times, and instantly bypasses the queue to route critical patients to the correct emergency department. It features a futuristic, "antigravity" command center for KGMU staff to monitor live queues and intelligently balance patient loads with Lucknow Civil Hospital.

---

## 👥 Hackathon Details

*   **Problem Statement Addressed:** PS-01 — AI triage agent for KGMU outpatient queues.
*   **Team Name:** Stack Overlords
*   **Team Members & GitHub Handles:**
    *   Rishab Kumar ([@Rishabkr0](https://github.com/Rishabkr0))
    *   Ayush Raj Singh ([@AyushRajSingh596](https://github.com/AyushRajSingh596))
    *   Adbhut Pandey ([@Adbhut1234](https://github.com/Adbhut1234))
    *   Abhay Pandey ([@ABHAY20056](https://github.com/ABHAY20056))

---

## 📱 Project Overview

The application contains two key environments within a single-page switcher:
1.  **Patient Triage Simulator:** A realistic WhatsApp-style chat interface designed to collect symptoms and patient information conversationally.
2.  **KGMU Staff Command Center:** A premium glassmorphic dashboard showcasing real-time queue states, active emergency dispatch card bypasses, outpatients stats tracking, and a civil load-balancing controller.

---

## 🌌 Theme & Design Language: Light Glassmorphism

Built with modern typography (Outfit & Inter) and a clean clinical palette tailored for hospital screens:
*   **Medical Soft Backdrop:** Soft pastel glowing spheres (radial blurs of clinical cyan, blue, and light rose) with a subtle digital grid layer.
*   **Frosted Glass Panels:** Glass containers styled using high-blur classes (`bg-white/75`, `backdrop-blur-xl`, `border border-slate-200/60`) and soft shadows (`shadow-[0_10px_30px_rgba(15,23,42,0.04)]`).
*   **Weightless Hover Translation:** Inputs, triage cards, and call-to-action buttons elevate upward on hover (`hover:-translate-y-0.5 transition-all duration-300`).
*   **Triage Priority Colors:**
    *   **Level 5 (Critical Emergency):** Flashing clinical red alerts (`text-red-650`).
    *   **Level 3 & 4 (Urgent/Medium):** Warm orange/amber indicators.
    *   **Level 1 & 2 (Non-Urgent):** Soft cyan and clinical emerald colors.

---

## 🛠️ Key Features

### 1. Conversational Registration Flow
Instead of loading static demo rows, the patient chatbot runs a multi-step conversational flow:
*   **Symptom Diagnosis:** User enters symptoms (or clicks preset symptoms like *Chest Pain*). The system parses severity and maps to departments (e.g., Lari Cardiology).
*   **Demographic Capture:** Asks for Full Name, Age (with quick-select buttons), and Gender.
*   **Mobile Verification:** Collects a 10-digit mobile number to complete server-side simulation registration.
*   **Routing Execution:** Registers the patient record and prints a receipt summary with queue estimated times.

### 2. Patient Digital Ticket & Smart QR Code
*   **Live Triage Pass:** Upon completing registration, the chat UI morphs into a live, sync-enabled digital ticket displaying the patient's queue position and estimated wait time.
*   **vCard QR Code Integration:** A dynamically generated QR code embeds the patient's ID, Name, Department, and Severity as a native Contact Card (vCard). Desk staff can scan this using native smartphone cameras (e.g., iPhone Camera) without needing third-party apps to instantly verify triage data.
*   **Chain-of-Thought Logs:** Transparent AI reasoning logs shown during the transition, detailing how the severity and department were deduced.

### 3. Zero-Server Real-Time Cross-Tab Sync
Designed to run on separate screens (e.g., Patient Tablet on desk, Dashboard on wall monitor) without needing an external database server:
*   Uses **`localStorage`** to write new patient registrations.
*   Leverages the browser's native **`storage` event listener** in React. The moment registration is completed in Tab A, Tab B updates instantly with the new patient's name, age, and phone number.

### 4. Dynamic Wait-Time Engine & Resource Allocation
*   **Algorithmic Predictions:** Wait times scale dynamically based on the active queue depth, doctor count, and severity levels.
*   **Resource Manager Widget:** Command Center staff can actively adjust the number of active doctors and average treatment time, which instantly recalculates and broadcasts new estimated wait times to all waiting patients' digital tickets.

### 5. Emergency Dispatch & Bypasses
*   Critical severity inputs automatically trigger a **Code Red Alert card** in the Command Center.
*   Staff can click "View Details" to see the registered demographics, contact details, and custom transcript of the chatbot discussion, then click "Accept & Route" to bypass the OPD waitlist.

### 6. Civil Hospital Load Balancer
*   If KGMU bed capacity peaks (above 90%), staff can trigger the **Load Balancer** to redirect non-critical patients (Severity 1 and 2) to Lucknow Civil Hospital, updating status logs instantly.
*   **Capacity SVG Gauges:** Beautiful circular progress meters visualize department strain across the hospital ecosystem.

---

## 📁 Component Directory Breakdown

*   `src/App.jsx`: State orchestrator, toast emitter, and modal managers.
*   `src/components/ChatInterface.jsx`: WhatsApp UI simulation with conversational step states and suggestion panels.
*   `src/components/QueueTable.jsx`: Filterable live queue records list and Lucknow Civil Hospital load balance overview.
*   `src/components/StatsCards.jsx`: Real-time active statistics blocks (Total OPD, average wait time, and current Code Reds).
*   `src/components/DashboardSidebar.jsx`: Hub control panel with quick links and status lights.
*   `src/index.css`: Tailwind layer imports, custom font variables, scrollbars, and glassmorphism styling presets.

---

## 🚀 Setup & Execution

### Prerequisites
*   Node.js (v18.0.0 or higher recommended)
*   npm (v9.0.0 or higher)

### Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser. Open it in two separate tabs/windows to test the real-time cross-tab synchronization.

### Production Compile
To build the application for hosting:
```bash
npm run build
```
The compiled output will be generated inside the `dist/` directory.

---

## 🔑 Demo Access Credentials

To access the secured **KGMU Staff Command Center**, use the following credentials on the login page (or click the **Demo Autofill Credentials** helper button):

*   **Username:** `kgmustaff`
*   **Password:** `lucknow2026`

---

## 🔒 Security & Privacy Compliance
*   **HIPAA & Consent:** Simulated data flow includes explicit consent banners before capturing phone details.
*   **Encryption Protocol:** Local storage updates are isolated within the hospital domain context, simulating an encrypted end-to-end telemetry system.
