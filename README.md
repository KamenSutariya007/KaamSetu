# KaamSetu — Home Maintenance Platform

**"Understand the problem, fix it safely, or find trusted help."**

KaamSetu is a full-stack home-maintenance platform combining AI diagnosis, safe DIY guidance, verified blue-collar professionals, smart scheduling, live technician tracking, and an appliance maintenance passport.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Full-Stack Web App** | Python 3, Django 5, HTML5 Templates (SSR), Pure Custom CSS3 Design System |
| **Real-time & APIs** | WebSockets (Django Channels / Daphne), Django REST Framework |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **Multi-Language (i18n)** | Strict isolated translation support for English, Gujarati, and Hindi |
| **Auth & Security** | Django Session & RBAC Auth, Email OTP verification, PBKDF2 hashing |
| **Design System** | Royal Blue & Coral modern UI tokens, responsive layouts, zero external UI libraries |

---

## Features

### 1. Customer
- **Authentication & Profile:** Registration, login with Email OTP verification, profile management, and persistent language switching (English / Gujarati / Hindi).
- **Home Checkup Station:** AI Fix Assistant supporting text and image problem diagnosis with safety warnings.
- **Provider & Partner Discovery:** Ranked recommendation sections (Best Match, Nearest, Highest Rated, Lowest Cost, Authorized Brand Partner, Emergency).
- **Comparison Tool:** Side-by-side comparison of up to 3 service providers/partners.
- **Booking & Scheduling:** Date/time slot picker, temporary 15-minute slot hold, and real-time confirmation.
- **Live Tracking:** Interactive map tracking (Demo Tracking Mode with animated route simulation).
- **Job Completion & Invoicing:** Secure OTP job completion verification and auto-generated Official Tax Invoice.
- **Household Maintenance Passport:** Digital log to track appliances, purchase dates, warranty info, and service history.
- **Fair Price Checker:** Transparent estimated market pricing for household repair services.
- **Support Desk:** Searchable FAQ, AI troubleshooting chat, support ticket submission, and history.

### 2. Individual Service Provider
- **Provider Workspace:** Real-time incoming job alerts, active job workflow (Accept → Prepare → En Route → Arrive → Start → Complete with OTP).
- **Schedule & Availability:** Calendar view, slot confirmation/rejection, and daily job management.
- **Performance & Trust:** Verified badges, customer reviews, ratings, and instant earnings breakdown.

### 3. Third-Party Brand Partner
- **Partner Organization Dashboard:** Verified company profile, technician CRUD management, and fleet coordination.
- **Automated Dispatch:** Dispatch incoming repair requests to available technicians with double-booking prevention.
- **Inventory & Warranty:** Spare parts inventory management, warranty claims, and quotation handling.
- **Business Analytics:** Revenue stats, active service counts, and team performance metrics.

### 4. Support Desk & Escalation
- **Agent Portal:** Ticket queue, assignment, thread responses, and escalation tiers (Support Agent to Senior Agent).
- **AI Automation:** Automatic ticket escalation triggers (billing disputes, hazardous safety issues, low confidence, repeat questions).

### 5. Administration
- **Control Center:** System-wide metrics (total customers, active providers, partners, bookings, tickets, and AI queries).
- **Operations:** Comprehensive bookings oversight and status audits.

### 6. Safety Guardrails & Legal Pages
- **Hazard Detection:** Automatic safety barriers preventing unsafe DIY advice on electrical, gas, structural, and fire hazards.
- **Informational Pages:** Dedicated About Us, Safety & Trust, Terms of Service, Privacy Policy, and Custom 404 pages.

---

## Repository Structure

```
KaamSetu/
├── backend/
│   ├── kaamsetu/          # Django project settings, routing (urls.py, asgi.py, wsgi.py)
│   ├── web/               # Web controllers, forms, translation dictionaries
│   ├── templates/         # HTML5 templates (pages, customer, provider, partner, support)
│   ├── static/            # Pure CSS3 design system, icons, client scripts
│   ├── accounts/          # User auth, roles, profile models, serializers
│   ├── services/          # Categories, DIY guides, rate cards, fair price engine
│   ├── providers/         # Providers, partners, technicians, recommendation engine
│   ├── bookings/          # Scheduling engine, slot holds, bookings, invoices
│   ├── ai_diagnosis/      # AI diagnosis engine with safety guardrail checks
│   ├── tracking/          # GPS tracking consumer and location simulator
│   ├── support/           # Helpdesk tickets, FAQ, AI support chat
│   ├── passport/          # Household appliances & maintenance history
│   ├── notifications/     # Notification dispatchers
│   └── core/              # Demo seed commands, test suite, network utilities
├── scripts/               # PowerShell automation tools
│   ├── setup.ps1          # One-time automated developer setup
│   ├── run-dev.ps1        # Dev runner with optional Cloudflare tunnel
│   ├── tunnel.ps1         # Public tunnel for mobile testing
│   ├── deploy-render.ps1  # Render production deployment helper
│   └── set-gmail-app-password.ps1
├── kaamsetu.py            # Root single-command application launcher
├── render.yaml            # Render deployment blueprint
├── .env.example           # Environment template
└── README.md
```

---

## Quick Start & Setup

### Prerequisites
- Python 3.10+
- Git
- Windows PowerShell (or macOS / Linux terminal)

> **Windows PowerShell Tip:**
> If you encounter script execution errors (`running scripts is disabled on this system`), enable running local scripts for your user:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/KamenSutariya007/KaamSetu.git
cd KaamSetu
```

---

### Step 2: Environment Configuration

Copy the sample environment file:

```powershell
# Windows PowerShell:
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

| Key | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | Pre-configured in `.env.example` |
| `DEBUG` | Enable debug mode | `True` |
| `DB_ENGINE` | Database type (`sqlite`, `postgresql`, `mysql`) | `sqlite` |
| `AI_ENABLED` | Set `True` with OpenAI key for live AI | `False` (uses Demo AI mode) |
| `OPENAI_API_KEY` | OpenAI API key | *Optional for demo* |
| `USE_REDIS` | Use Redis for WebSocket channel layer | `False` (uses In-Memory layer) |
| `DEMO_MODE` | Display demo badges and fallback simulations | `True` |
| `SLOT_HOLD_MINUTES` | Hold window for chosen appointment slot | `15` |

---

### Step 3: Automated Setup (Windows)

You can run the setup script:

```powershell
.\scripts\setup.ps1
```

Or perform the manual setup below:

```bash
cd backend
python -m venv venv

# Activate venv:
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Run migrations:
python manage.py migrate

# Seed pre-populated demo data:
python manage.py seed_demo_data
```

---

### Step 4: Run KaamSetu

You can launch the web application using any of the following options:

#### Option A: Single-Command Starter (Recommended)
From the project root:
```powershell
python kaamsetu.py
```

#### Option B: Dev Script with Public Tunnel (Mobile Testing)
```powershell
.\scripts\run-dev.ps1
```
*(Starts the Django web app and an optional Cloudflare tunnel so you can test email links and SMS flows on physical phones).*

#### Option C: Direct Django Server
```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## Demo Accounts

All demo accounts share the password: **`Demo@123`**

| Role | Username | Direct URL | Description |
|---|---|---|---|
| **Customer** | `customer1` | `/customer` | Books services, views passport, tracks jobs |
| **Provider** | `provider1` | `/provider` | Accepts jobs, updates status, verifies OTP |
| **Partner** | `partner1` | `/partner` | Assigns technicians, manages warranty & inventory |
| **Support Agent** | `support1` | `/support-desk` | Answers customer tickets and escalations |
| **Senior Agent** | `senior1` | `/support-desk` | Handles supervisor escalations |
| **Admin** | `admin` | `/admin` | System health overview and management |

---

## Testing & Verification

Run the Django automated verification suite:

```bash
cd backend
python manage.py check
python manage.py test core
```

### Key Automated Tests (`core/tests.py`)
- Authentication & JWT token issuance
- Booking creation and lifecycle state machine transitions
- **Slot double-booking prevention** (simultaneous hold conflicts)
- **Partner technician double-booking prevention**
- OTP verification and automatic tax invoice generation
- AI safety guardrails against dangerous hazard DIY instructions
- Multi-tier support escalation triggers
- Provider slot reject and reschedule handling

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | User authentication & JWT issuance |
| `POST` | `/api/auth/register/` | Customer onboarding |
| `POST` | `/api/ai/analyze/` | AI diagnosis engine with image upload |
| `GET` | `/api/providers/recommendations/` | Smart algorithmic provider ranking |
| `POST` | `/api/bookings/` | Create a new service booking |
| `GET` | `/api/bookings/<id>/available-slots/` | Real-time available provider slots |
| `POST` | `/api/bookings/<id>/hold-slot/` | Reserve slot with temporary lock |
| `POST` | `/api/bookings/<id>/confirm-slot/` | Provider confirmation |
| `POST` | `/api/bookings/<id>/complete/` | Complete job with customer OTP |
| `GET` | `/api/bookings/<id>/invoice/` | View/download official tax invoice |
| `POST` | `/api/services/fair-price/check/` | Fair price estimator |
| `GET` | `/api/support/faq/` | Searchable knowledge base |
| `POST` | `/api/support/chat/` | Live AI diagnostic chat support |
| `WS` | `/ws/tracking/<id>/` | Real-time WebSocket technician location updates |

---

## Production Deployment (Render)

KaamSetu includes a complete Render blueprint ([`render.yaml`](file:///f:/KaamSetu/render.yaml)).

To deploy:
1. Push your repository to GitHub.
2. In Render, select **New + Blueprint** and link your KaamSetu repository.
3. Configure your production environment variables (`SECRET_KEY`, `DB_ENGINE=postgresql`, `USE_REDIS=True`).
4. Or use the automated deploy helper script:
   ```powershell
   .\scripts\deploy-render.ps1
   ```

---

## License & Contributing

Built with pride for households and trade professionals across Gujarat.
Contributions, issues, and feature requests are welcome!
