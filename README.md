# South India HigherEd Directory & AI Sales Agent Studio

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/nunescbe-a11y/south-india-highered-directory)
[![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare-Live_Tunnel-orange?logo=cloudflare)](https://programming-mike-processing-prepared.trycloudflare.com)
[![Census](https://img.shields.io/badge/Institutions-4%2C990_Verified-emerald)](https://programming-mike-processing-prepared.trycloudflare.com)

Interactive census, multi-district higher education directory, and autonomous AI Sales Agent Closer Studio covering **4,990 accredited institutions** across all **52 districts** in Tamil Nadu and Kerala.

---

## 🌐 Live URLs

| Service | Permanent Link |
| :--- | :--- |
| **Cloudflare Public Web App** | [https://programming-mike-processing-prepared.trycloudflare.com](https://programming-mike-processing-prepared.trycloudflare.com) |
| **API Health Check** | [https://programming-mike-processing-prepared.trycloudflare.com/api/health](https://programming-mike-processing-prepared.trycloudflare.com/api/health) |
| **GitHub Source Code** | [https://github.com/nunescbe-a11y/south-india-highered-directory](https://github.com/nunescbe-a11y/south-india-highered-directory) |
| **Local Development** | [http://localhost:3005](http://localhost:3005) |

---

## ✨ Features & Design Upgrades

1. **Enterprise Header & Glassmorphic Navigation**:
   - Custom `NUNES` brand badge, live `4,990 CENSUS` status pill with pulsing radar indicator.
   - Frosted glass navbar (`backdrop-filter: blur(16px)`).
   - Global `Ctrl+K` / `/` shortcut to spotlight search.
   - Instant toast notification system for copy-to-clipboard actions.

2. **Full South India Directory & Census (4,990 Institutions)**:
   - Covers all 38 districts of Tamil Nadu (3,525 colleges) & 14 districts of Kerala (1,465 colleges).
   - Filter by District, Locality/Corridor, Academic Stream (Engineering, Arts & Science, Medical, Polytechnic, Management, Universities), NAAC Grade, and NIRF rank.
   - Instant direct WhatsApp and Email links (`wa.me` integration with pre-filled pitches).

3. **Autonomous AI Sales Agent Closer Studio**:
   - `POST /api/agent/generate-pitch`: Generates customized B2B proposal letters and subject lines for college decision makers.
   - `POST /api/agent/sales-reply`: Simulates an AI consultative closer addressing lab requirements, demo bookings, and quotation requests.
   - Works with Gemini API, OpenAI, or the built-in consultation engine.

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/nunescbe-a11y/south-india-highered-directory.git
cd south-india-highered-directory

# Install dependencies
npm install

# Start local server on http://localhost:3005
npm start
```

Or on Windows, simply double-click `start.bat`.

---

## ⛅ Deploying to Cloudflare Pages (1-Click)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select repository: `nunescbe-a11y/south-india-highered-directory`.
3. Configure build settings:
   - **Framework preset**: `None`
   - **Build output directory**: `public`
4. Click **Save and Deploy**. Cloudflare Pages will automatically deploy your permanent `*.pages.dev` domain on every push!
