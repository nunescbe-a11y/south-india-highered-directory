# South India HigherEd Directory & AI Sales Agent Studio

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/nunescbe-a11y/south-india-highered-directory)
[![Census](https://img.shields.io/badge/Institutions-4%2C990_Verified-emerald)](https://github.com/nunescbe-a11y/south-india-highered-directory)
[![Anti--Spam](https://img.shields.io/badge/Anti--Spam-100%2F100_Inbox_Safe-brightgreen)](https://github.com/nunescbe-a11y/south-india-highered-directory)

Interactive census, multi-district higher education directory, and autonomous AI Sales Agent Closer Studio covering **4,990 accredited institutions** across all **52 districts** in Tamil Nadu and Kerala with integrated **Anti-Spam Email Dispatcher & Deliverability Inspector**.

---

## 🌐 Live & Local URLs

| Service | Link |
| :--- | :--- |
| **Local Development** | [http://localhost:3005](http://localhost:3005) |
| **API Health Check** | [http://localhost:3005/api/health](http://localhost:3005/api/health) |
| **Email Service Config** | [http://localhost:3005/api/email/config](http://localhost:3005/api/email/config) |
| **GitHub Repository** | [https://github.com/nunescbe-a11y/south-india-highered-directory](https://github.com/nunescbe-a11y/south-india-highered-directory) |

---

## ✉️ Anti-Spam Email Dispatcher & Deliverability Shield

Built to prevent cold/educational B2B outreach from landing in Gmail / Outlook spam or promotions folders:

1. **Target Pre-Configuration**:
   - **Primary Recipient (To)**: `nunesalcotest@gmail.com`
   - **Carbon Copy (CC)**: `nunescbe@gmail.com`
2. **Real-Time Deliverability Score (100/100)**:
   - Scans subject line and message body before dispatch.
   - Automatically eliminates blacklisted marketing buzzwords (`100% free`, `urgent`, `act now`).
   - Validates natural subject casing (zero ALL CAPS) and optimal length (20-65 chars).
   - Enforces CAN-SPAM compliance with physical corporate postal address (`Door No. 124, 7th Street, Gandhipuram, Coimbatore - 641012`) and one-click opt-out notice.
3. **Dual Dispatch Modes**:
   - **Mode 1: Verified Gmail SMTP** — Dispatches directly via authenticated Google servers with DKIM & SPF cryptographic signatures.
   - **Mode 2: Native Mailto Client** — Pre-fills default email clients (Apple Mail, Outlook, Thunderbird) with CC headers and clean body copy.

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
2. Select your repository: `nunescbe-a11y/south-india-highered-directory`.
3. Configure build settings:
   - **Framework preset**: `None`
   - **Build output directory**: `public`
4. Click **Save and Deploy**. Cloudflare Pages will automatically deploy your permanent `*.pages.dev` domain on every push!
