# South India HigherEd Directory & AI Sales Agent Studio

Local deployment of the Google AI Studio application (`c72bf539-7e58-4006-978b-bdd22b71d601`).

---

## 🚀 Live Local URL
- **Web App**: [http://localhost:3005](http://localhost:3005)
- **Health Check**: [http://localhost:3005/api/health](http://localhost:3005/api/health)
- **Colleges Dataset API**: [http://localhost:3005/api/colleges](http://localhost:3005/api/colleges)

---

## 🛠️ Quick Start & Launcher

### Option 1: Double-click launcher
Double click `start.bat` in this folder:
```cmd
start.bat
```

### Option 2: Command line
```cmd
npm start
```

---

## 📦 What Was Set Up

1. **Standalone Production Web Application**:
   - Extracted and hosted all production client bundles (`index.html`, `assets/index-Bo9Sf2mK.js`, `assets/index-B10GJjlm.css`).
   - Removed external Google AI Studio iframe constraints so it runs completely independent of Google Cloud Run / AI Studio sessions.

2. **Full Higher Education Dataset**:
   - Packaged with 4,990 accredited institutions across 52 districts in Tamil Nadu & Kerala (`SouthIndia_HigherEd_Directory_SourceCode_And_Dataset.json`).
   - Instant search and filtering across Engineering, Arts & Science, Medical, Polytechnic, Management, Law, and Universities.

3. **Autonomous AI Sales Agent Closer Studio**:
   - `POST /api/agent/generate-pitch`: Generates customized subject lines and executive forward pitches for Principals and Lab Directors.
   - `POST /api/agent/sales-reply`: Simulates an AI consultative sales closer responding to objections, questions on pricing, and demo scheduling.
   - Built-in intelligent consultation fallback engine guarantees 100% uptime with zero crashes even when external AI quotas are busy.

4. **Optional Gemini API Key Configuration**:
   - In `.env`, you can add your free Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey):
     ```env
     PORT=3005
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
