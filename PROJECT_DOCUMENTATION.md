# KaamSetu (કામસેતુ) — Complete Project Documentation

> **"Understand the problem, fix it safely, or find trusted help."**  
> KaamSetu is an end-to-end, production-ready home maintenance ecosystem connecting homeowners and businesses with verified local service professionals, AI-driven diagnostics with safety guards, real-time tracking, warranty tracking, and a household maintenance passport.

---

## 📑 Table of Contents

1. [Project Overview & Core Mission](#1-project-overview--core-mission)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Complete Directory & File Structure](#4-complete-directory--file-structure)
5. [User Roles & RBAC (Role-Based Access Control)](#5-user-roles--rbac-role-based-access-control)
6. [Backend Architecture & Data Models](#6-backend-architecture--data-models)
7. [Core Algorithms & Business Workflows](#7-core-algorithms--business-workflows)
8. [Frontend Architecture & UI Modules](#8-frontend-architecture--ui-modules)
9. [Comprehensive REST API Reference](#9-comprehensive-rest-api-reference)
10. [Environment Variables & Configuration](#10-environment-variables--configuration)
11. [Deployment & DevOps (Render, Vercel & Scripts)](#11-deployment--devops-render-vercel--scripts)
12. [Testing, Security & Demo Verification](#12-testing-security--demo-verification)

---

## 1. Project Overview & Core Mission

Home maintenance issues frequently leave users feeling uncertain: *Is this emergency dangerous? Can I fix it myself? Who can I trust? What should it realistically cost?*

**KaamSetu** addresses these challenges directly through:
1. **AI Fix Assistant (Safety-Guarded)**: Users upload an issue description or image. An AI engine (powered by Google Gemini / rule-based fallback) identifies the problem. If high hazard (gas leak, live voltage, fire hazard), DIY instructions are actively blocked, directing the user to professional assistance.
2. **Smart Recommendation Engine**: Matches service requests using an 8-factor weighted ranking (category expertise, identity verification, geographic proximity, live availability, rating history, completion volume, on-time percentage, and response speed).
3. **Zero Double-Booking Scheduling**: Robust appointment slot reservation system featuring temporary holds, atomic database locks, and provider confirmation.
4. **Live GPS & Route Simulation**: Real-time technician journey visualization with OTP-verified job completion and auto-generated digital PDF/HTML receipts.
5. **Household Maintenance Passport**: A digital appliance and system inventory tracking warranty expirations, model details, service history, and recommended servicing cycles.
6. **Fair Price Checker**: Protects consumers against overcharging by benchmarking typical part and labor rates across local zones.
7. **Bilingual Experience**: Native support for **English** and **Gujarati (ગુજરાતી)** interfaces.

---

## 2. System Architecture

```
                                  [ Web Clients (Desktop / Mobile) ]
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [ Vercel CDN / Edge ]                             [ WebSocket Client ]
             Frontend: React 19 + Vite                                   │
             URL: https://kaamsetu.app                                   │
                       │ (REST APIs / JSON)                              │
                       ▼                                                 ▼
             [ Render Cloud Platform ]                         [ Daphne ASGI Server ]
             Gunicorn + Django REST Framework 5.x              Django Channels 4.x
             API: https://kaamsetu-api-vtac.onrender.com                 │
                       │                                                 │
          ┌────────────┼───────────────────────────┐                     │
          ▼            ▼                           ▼                     ▼
   [ PostgreSQL ]  [ Google Gemini AI ]     [ Gmail SMTP ]       [ Redis / In-Memory ]
   (KaamSetu DB)   (Diagnosis Engine)       (OTP & Alerts)       (Channel Layer)
```

### Architectural Highlights
- **Decoupled Monorepo**: Independent `backend/` (Django REST) and `frontend/` (React SPA) communicating over REST endpoints with JWT authentication and WebSocket channels.
- **Stateless Authentication**: Access & Refresh JWTs issued via `SimpleJWT` with Axios response interceptors handling transparent background token renewals.
- **Fail-Safe Fallbacks**: Works out of the box locally via SQLite and offline demo modes, and transitions seamlessly to PostgreSQL and Google Gemini in cloud staging/production.

---

## 3. Technology Stack

### Frontend
| Component | Technology | Description |
|---|---|---|
| Framework | React 19.2 | Ultra-fast declarative UI rendering |
| Build Tool | Vite 8.2 | Fast HMR (Hot Module Replacement) and optimized bundling |
| Styling | Tailwind CSS v4 | Utility-first responsive design with dark mode accents |
| Routing | React Router v7 | Dynamic client-side routing with role guards |
| Maps & Geo | Leaflet & React-Leaflet | Interactive GPS tracking, live marker animation |
| HTTP Client | Axios 1.19 | Configured with token refresh interceptors |
| Icons | Lucide React | Modern, lightweight icon suite |
| State/Query | TanStack React Query & Context API | Centralized authentication and bilingual state |
| Linter/Tester | Oxlint & Vitest | Fast static analysis and unit testing |

### Backend
| Component | Technology | Description |
|---|---|---|
| Language | Python 3.12+ | Core runtime |
| Web Framework | Django 5.x | High-level web framework with ORM and security middleware |
| API Framework | Django REST Framework (DRF) 3.15+ | Robust serializer and viewset engine |
| WebSockets | Django Channels 4.x & Daphne 4.x | Real-time live tracking and asynchronous notifications |
| Auth & Security | SimpleJWT & Django PBKDF2 | Industry-standard token authentication and password hashing |
| Static Serving | WhiteNoise 6.6 | High-performance static asset streaming on Render |
| WSGI Server | Gunicorn 22.x | Production WSGI HTTP server |
| Email System | Django SMTP / Google Mail App Password | Reliable delivery of OTP verification emails |
| AI Integration | Google Gemini API (google-genai / REST) | Multimodal (image/text) diagnosis and safety triage |

### Database & Infrastructure
- **Database**: PostgreSQL (Render Cloud Managed) in production; SQLite for zero-config local development.
- **Backend Hosting**: Render (`render.yaml` Blueprint specification, Web Service + Managed PostgreSQL).
- **Frontend Hosting**: Vercel Edge Network (`vercel.json` with API proxying & SPA routing).
- **Domain**: `https://kaamsetu.app` & `https://frontend-zeta-ten-20.vercel.app`.

---

## 4. Complete Directory & File Structure

```
KaamSetu/
├── .env                               # Active local environment variables (secrets)
├── .env.example                       # Documented template for all configuration keys
├── .gitignore                         # Git exclusion rules
├── package.json                       # Root workspaces / script runner
├── README.md                          # Quick start and repository readme
├── PROJECT_DOCUMENTATION.md           # Master project documentation (This file)
├── render.yaml                        # Infrastructure-as-Code for Render Cloud deployment
├── kaamsetu.py                        # Root convenience helper CLI
│
├── scripts/                           # Automation and deployment toolchain
│   ├── deploy-render.ps1              # Deploys/re-deploys backend to Render via REST API
│   ├── sync-render-email-env.ps1      # Syncs local SMTP/service credentials to Render
│   ├── set-gmail-app-password.ps1     # Configures Gmail 16-char App Password in .env
│   ├── run-dev.ps1                    # Boots backend, frontend, and local dev network
│   ├── setup.ps1                      # Complete first-time environment installation script
│   ├── tunnel.ps1                     # Exposes local development to internet/mobile testing
│   └── pack-for-transfer.ps1          # Packages codebase excluding build caches
│
├── backend/                           # Django REST backend application
│   ├── manage.py                      # Django administrative script
│   ├── requirements.txt               # Python package dependencies
│   ├── build.sh                       # Render deployment build script (migrate + static)
│   ├── firebase-service-account.json  # Firebase Admin SDK credentials (optional)
│   │
│   ├── kaamsetu/                      # Project root package (settings & core routes)
│   │   ├── __init__.py
│   │   ├── asgi.py                    # ASGI setup for WebSockets (Daphne)
│   │   ├── settings.py                # Main Django settings, databases, auth, email
│   │   ├── urls.py                    # Root URL routing table
│   │   └── wsgi.py                    # WSGI entrypoint for Gunicorn
│   │
│   ├── accounts/                      # Auth, Profiles, OTP, Roles & Permissions
│   │   ├── email_service.py           # Robust OTP dispatch logic (SMTP & Resend fallback)
│   │   ├── models.py                  # Custom User, Profile, OTPVerification
│   │   ├── serializers.py             # Auth & user profile serializers
│   │   ├── urls.py                    # /api/auth/* endpoints
│   │   └── views.py                   # Login, Register, OTP verify, password reset
│   │
│   ├── services/                      # Service Categories, Guides & Fair Price Checker
│   │   ├── models.py                  # ServiceCategory, ServiceGuide, PriceRange
│   │   ├── urls.py                    # /api/services/*
│   │   └── views.py                   # Category listing, price estimations
│   │
│   ├── providers/                     # Providers, Partners, Technicians & Smart Matching
│   │   ├── models.py                  # ProviderProfile, PartnerProfile, Technician, Review
│   │   ├── recommendation.py          # 8-factor ranking algorithm
│   │   ├── urls.py                    # /api/providers/*
│   │   └── views.py                   # Search, compare, dashboard statistics
│   │
│   ├── bookings/                      # Scheduling, Slot Holds, Invoices & Job Lifecycle
│   │   ├── models.py                  # Booking, BookingSlot, SlotHold, Invoice
│   │   ├── calendar_urls.py           # /api/calendar/*
│   │   ├── urls.py                    # /api/bookings/*
│   │   └── views.py                   # Hold slot, confirm, OTP completion, invoicing
│   │
│   ├── ai_diagnosis/                  # AI Assistant with Safety Rule Evaluation
│   │   ├── models.py                  # AIDiagnosisLog
│   │   ├── safety.py                  # Hazard filters (gas, high voltage, structural)
│   │   ├── urls.py                    # /api/ai/*
│   │   └── views.py                   # Gemini & rule-based multimodal analysis
│   │
│   ├── tracking/                      # GPS Location Services & WebSocket Broadcasts
│   │   ├── consumers.py               # Live tracking WebSocket channel consumer
│   │   ├── models.py                  # LocationUpdate, TrackingSession
│   │   ├── urls.py                    # /api/tracking/*
│   │   └── views.py                   # Polling & REST update fallbacks
│   │
│   ├── passport/                      # Household Maintenance Passport
│   │   ├── models.py                  # HouseholdAsset, MaintenanceLog
│   │   ├── urls.py                    # /api/passport/*
│   │   └── views.py                   # Asset CRUD, warranty alerts, service histories
│   │
│   ├── support/                       # Helpdesk, AI Support Chat & Escalations
│   │   ├── models.py                  # SupportTicket, TicketMessage, FAQItem
│   │   ├── urls.py                    # /api/support/*
│   │   └── views.py                   # Ticket creation, auto-escalation triggers
│   │
│   ├── notifications/                 # In-App Notification System
│   │   ├── models.py                  # Notification
│   │   ├── urls.py                    # /api/notifications/*
│   │   └── views.py                   # Mark read, fetch user notifications
│   │
│   └── core/                          # Admin Metrics, Permissions, Tests & Seed Command
│       ├── permissions.py             # Role-based DRF permission classes
│       ├── tests.py                   # 11 rigorous unit and integration tests
│       ├── urls.py                    # /api/admin/*
│       ├── views.py                   # System-wide metrics, stats, booking lists
│       └── management/commands/
│           └── seed_demo_data.py      # Seeds realistic providers, categories, bookings
│
└── frontend/                          # React SPA
    ├── index.html                     # HTML5 root template
    ├── package.json                   # Dependencies & npm scripts
    ├── vite.config.js                 # Vite build & development proxy configuration
    ├── vercel.json                    # Vercel deployment rewrites & headers
    │
    └── src/
        ├── main.jsx                   # React application mount
        ├── App.jsx                    # Root router, Layout wrapper & Route Guards
        ├── index.css                  # Tailwind styles and global CSS variables
        │
        ├── api/
        │   └── client.js              # Axios instance with auto-refreshing JWT interceptors
        │
        ├── context/
        │   ├── AuthContext.jsx        # Current user, tokens, login/logout functions
        │   └── LanguageContext.jsx    # English / Gujarati locale state & translator
        │
        ├── i18n/                      # Internationalization dictionaries
        │   ├── en.js                  # English translations
        │   └── gu.js                  # Gujarati (ગુજરાતી) translations
        │
        ├── components/                # Reusable UI components
        │   ├── Navbar.jsx             # Top navigation with role links & language toggle
        │   ├── Footer.jsx             # Site footer
        │   ├── DashboardLayout.jsx    # Role-specific sidebar and top navigation layout
        │   ├── ProtectedRoute.jsx     # Route security barrier preventing unauthorized roles
        │   ├── TrackingMap.jsx        # Leaflet live route and technician map
        │   └── NotificationBell.jsx   # Unread notifications dropdown
        │
        └── pages/                     # Application views categorized by persona
            ├── LandingPage.jsx        # Public home, hero, services showcase
            ├── LoginPage.jsx          # Login with role redirection & demo credentials
            ├── RegisterPage.jsx       # Multi-role registration with OTP verification
            ├── AIAssistantPage.jsx    # Multimodal diagnostic tool with image uploader
            ├── BookServicePage.jsx    # Slot selection, holding, and checkout
            ├── ProvidersPage.jsx      # Provider directory with filters and comparison
            ├── FairPricePage.jsx      # Local price estimator
            ├── GuidesPage.jsx         # DIY maintenance knowledge base
            ├── SupportPage.jsx        # Support ticket submission and FAQ bot
            │
            ├── customer/              # Customer Portal
            │   ├── CustomerDashboard.jsx
            │   ├── CustomerBookings.jsx
            │   ├── BookingDetail.jsx  # Detailed tracking, live map, OTP display
            │   └── PassportPage.jsx   # Household asset management
            │
            ├── provider/              # Individual Technician Portal
            │   ├── ProviderDashboard.jsx
            │   ├── ProviderJobs.jsx   # Job state machine (Accept -> Travel -> Start -> OTP)
            │   └── ProviderCalendar.jsx
            │
            ├── partner/               # Business / Agency Partner Portal
            │   ├── PartnerDashboard.jsx
            │   ├── TechnicianManagement.jsx
            │   └── WarrantyClaims.jsx
            │
            ├── support/               # Support Desk Portal
            │   └── SupportDeskPage.jsx # Ticket queues, replies, escalation manager
            │
            └── admin/                 # Administrator Portal
                └── AdminDashboard.jsx # System overview, analytics, booking overseer
```

---

## 5. User Roles & RBAC (Role-Based Access Control)

KaamSetu enforces a strict 6-tier role model across the entire frontend and backend:

```mermaid
graph TD
    User([KaamSetu User]) --> Customer[1. Customer]
    User --> Provider[2. Individual Provider]
    User --> Partner[3. Third-Party Partner]
    User --> Support[4. Support Agent]
    User --> SeniorSupport[5. Senior Support Agent]
    User --> Admin[6. System Admin]

    Customer -->|Manages| C_Features[Home Fixes, Bookings, Passport, AI Assistant]
    Provider -->|Manages| P_Features[Direct Jobs, Calendar, Payouts, Live GPS]
    Partner -->|Manages| PA_Features[Fleet of Technicians, Quotations, Inventory]
    Support -->|Manages| S_Features[Ticket Resolution, Chat, Escalation]
    SeniorSupport -->|Manages| SS_Features[High-Priority Tickets, Safety Emergencies]
    Admin -->|Manages| A_Features[Platform Analytics, User Verification, Audit]
```

### Pre-Seeded Demo Credentials
All seeded users share the same password for testing: **`Demo@123`**

| Role | Username | Landing Dashboard | Key Responsibilities |
|---|---|---|---|
| **Customer** | `customer1` | `/customer` | Book jobs, diagnose with AI, view tracking, manage passport |
| **Provider** | `provider1` | `/provider` | Accept jobs, update journey status, verify OTP, earn revenue |
| **Partner** | `partner1` | `/partner` | Manage multi-technician teams, allocate jobs, warranties |
| **Support** | `support1` | `/support-desk` | Answer tickets, troubleshoot customer issues |
| **Senior Support** | `senior1` | `/support-desk` | Handle escalated safety or billing disputes |
| **Admin** | `admin` | `/admin` | Oversee system metrics, user growth, booking fulfillment |

---

## 6. Backend Architecture & Data Models

### 1. `accounts` App
- **`User` (AbstractUser)**: Extended with `phone_number`, `role`, `is_verified`, `preferred_language`.
- **`Profile`**: Holds address, bio, avatar, and geographical coordinates (`latitude`, `longitude`).
- **`OTPVerification`**: Tracks 6-digit email registration OTP codes with 60-second cooldowns and expiration timestamps.

### 2. `services` App
- **`ServiceCategory`**: e.g., Electrical, Plumbing, HVAC, Appliance Repair, Carpentry, Painting.
- **`ServiceGuide`**: DIY troubleshooting guides with step-by-step instructions, difficulty ratings, and safety advisories.
- **`PriceRange`**: Reference standard minimum and maximum market rates for fair-price audits.

### 3. `providers` App
- **`ProviderProfile`**: Category specializations, hourly/job rates, verified badge, trust score (1–100), response time, completed jobs count, and live coordinates.
- **`PartnerProfile`**: Organization profile, business license number, technician count, warranty policies.
- **`Technician`**: Assigned employees under a partner with specific skills and individual schedules.
- **`Review`**: Customer rating (1-5 stars), text feedback, and verified booking badge.

### 4. `bookings` App
- **`Booking`**: Central entity linking Customer, Provider/Partner, Category, Status (`pending`, `confirmed`, `in_transit`, `arrived`, `in_progress`, `completed`, `cancelled`), and completion OTP.
- **`BookingSlot`**: Calendar time slots with individual booking capacities.
- **`SlotHold`**: 15-minute temporary reservation preventing race conditions while a customer completes booking details.
- **`Invoice`**: Digital receipt with breakdown of labor, parts, taxes, discounts, and payment status.

### 5. `ai_diagnosis` App
- **`AIDiagnosisLog`**: Archives user query, optional uploaded photo, safety flag, detected urgency level, and suggested DIY vs Professional recommendation.

### 6. `tracking` App
- **`LocationUpdate`**: Timestamped lat/long points recording the technician's journey towards the job location.

### 7. `passport` App
- **`HouseholdAsset`**: Registered appliance/home asset (brand, model, purchase date, serial number, warranty expiration date, invoice scan).
- **`MaintenanceLog`**: Service records tied to specific household assets.

### 8. `support` App
- **`SupportTicket`**: Customer inquiries with status (`open`, `in_progress`, `resolved`, `escalated`) and priority (`low`, `medium`, `high`, `emergency`).
- **`TicketMessage`**: Threaded conversation history between users and support staff.

---

## 7. Core Algorithms & Business Workflows

### 1. Smart Provider Recommendation Engine
When a customer searches for assistance, providers are ranked by a composite weighted score:

$$\text{Score} = (0.30 \times \text{CatMatch}) + (0.20 \times \text{Verified}) + (0.15 \times \text{Distance}) + (0.15 \times \text{Available}) + (0.10 \times \text{Rating}) + (0.05 \times \text{Volume}) + (0.03 \times \text{OnTime}) + (0.02 \times \text{Response})$$

Results populate curated carousels:
- **Best Match** (Highest total weighted score)
- **Nearest Available** (Smallest geographical distance)
- **Highest Rated** (Top star average & verified reviews)
- **Fastest Arrival** (Shortest estimated arrival time)
- **Authorized Brand Partner** (Verified commercial entity)

### 2. Zero Double-Booking Architecture
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant API as Booking API
    participant DB as PostgreSQL
    actor Provider as Provider

    Customer->>API: Select appointment slot
    API->>DB: Begin Atomic Transaction
    DB->>DB: Check active SlotHolds & Confirmed Bookings
    alt Slot is already occupied
        API-->>Customer: 409 Conflict ("Slot no longer available")
    else Slot is free
        API->>DB: Insert SlotHold (Expires in 15 mins)
        API-->>Customer: 200 OK (Slot Held)
    end
    Customer->>API: Confirm & submit service request
    API->>DB: Convert SlotHold to Booking (status=Pending)
    API-->>Provider: Notify new incoming request
    Provider->>API: Accept slot
    API->>DB: Update status to Confirmed
```

### 3. Hazard AI Safety Triage
Before displaying any DIY instructions, user inputs pass through a comprehensive safety filter:
```
IF text contains ("gas leak", "sparking wire", "breaker smoking", "structural crack", "sewage backup")
   OR image analysis identifies hazard:
   -> Block DIY Instructions
   -> Trigger Red Alert UI Banner
   -> Immediately recommend Emergency-Ready Verified Professionals
   -> Provide standard emergency shutdown tips (e.g., "Shut main valve / breaker immediately")
```

### 4. Live Tracking & OTP Job Verification
- **Job Flow**: `Accepted` $\rightarrow$ `Preparing` $\rightarrow$ `Travelling` $\rightarrow$ `Arrived` $\rightarrow$ `In Progress` $\rightarrow$ `OTP Completed`.
- **OTP Protection**: The customer's dashboard displays a secure 4-digit completion OTP. The technician cannot mark the job complete or generate an invoice until the customer validates the work by providing this OTP in person.

---

## 8. Frontend Architecture & UI Modules

### 1. State Management & Authentication Flow
- **`AuthContext`**: Stores JWT tokens in `localStorage`. On application boot, verifies token validity and decodes user role and permissions.
- **`client.js` Interceptor**: Automatically attaches `Authorization: Bearer <token>` to outgoing requests. Catches `401 Unauthorized`, automatically calls `/api/auth/refresh/`, updates tokens, and retries the original request without disrupting the user.

### 2. Internationalization (i18n)
- Seamless real-time switching between English and Gujarati without page reload.
- Dictionaries in `src/i18n/en.js` and `src/i18n/gu.js`.
- Integrated via `LanguageContext` using the `t('key')` helper throughout all forms, headers, and dashboard widgets.

### 3. Role-Based Navigation Guard (`ProtectedRoute.jsx`)
```jsx
// Example usage in App.jsx
<Route path="/customer/*" element={
  <ProtectedRoute allowedRoles={['customer']}>
    <CustomerDashboard />
  </ProtectedRoute>
} />
```
Unauthorized attempts trigger automated redirection to the user's appropriate portal or the login screen.

---

## 9. Comprehensive REST API Reference

### 🔐 Authentication & Accounts
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Public | Register new customer or provider account |
| `POST` | `/api/auth/verify-otp/` | Public | Verify 6-digit registration code |
| `POST` | `/api/auth/resend-otp/` | Public | Request a new verification OTP |
| `POST` | `/api/auth/login/` | Public | Authenticate with username/password & receive JWT |
| `POST` | `/api/auth/refresh/` | Public | Exchange refresh token for new access token |
| `GET` | `/api/auth/profile/` | Authenticated | Retrieve current user profile |
| `PATCH` | `/api/auth/profile/` | Authenticated | Update user profile and coordinates |
| `POST` | `/api/auth/forgot-password/` | Public | Send password reset link to email |
| `POST` | `/api/auth/reset-password/` | Public | Set new password using reset token |

### 🛠️ Services & Diagnosis
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/services/categories/` | Public | List all active service categories |
| `GET` | `/api/services/guides/` | Public | List DIY repair guides |
| `POST` | `/api/services/fair-price/check/` | Public | Estimate reasonable local price ranges |
| `POST` | `/api/ai/analyze/` | Public | Multimodal (image + text) issue diagnosis |

### 👨‍🔧 Providers & Matching
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/providers/` | Public | Search and filter verified providers |
| `GET` | `/api/providers/recommendations/`| Public | Fetch ranked provider recommendation lists |
| `GET` | `/api/providers/:id/` | Public | Get public provider profile and reviews |
| `GET` | `/api/providers/partners/dashboard/`| Partner | Partner performance metrics & fleet overview |
| `POST` | `/api/providers/technicians/` | Partner | Add technician to partner fleet |

### 📅 Bookings & Scheduling
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings/` | Authenticated | List bookings (filtered by user role) |
| `POST` | `/api/bookings/` | Customer | Create a new booking request |
| `GET` | `/api/bookings/:id/` | Authenticated | Get detailed booking information |
| `GET` | `/api/bookings/:id/available-slots/`| Authenticated| Fetch open slots for chosen provider |
| `POST` | `/api/bookings/:id/hold-slot/` | Customer | Place temporary 15-minute hold on a slot |
| `POST` | `/api/bookings/:id/confirm-slot/` | Provider | Confirm and lock appointment |
| `PATCH` | `/api/bookings/:id/status/` | Provider | Progress job status (in_transit, arrived, etc.) |
| `POST` | `/api/bookings/:id/complete/` | Provider | Finalize job with customer's 4-digit OTP |
| `GET` | `/api/bookings/:id/invoice/` | Authenticated | View generated invoice receipt |

### 📍 Tracking & GPS
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tracking/:booking_id/` | Authenticated | Get current technician coordinates |
| `POST` | `/api/tracking/:booking_id/update/`| Provider | Transmit updated live coordinates |
| `WS` | `/ws/tracking/:booking_id/` | Authenticated | Real-time WebSocket location channel |

### 🏠 Household Passport & Support
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/passport/assets/` | Customer | List registered appliances/systems |
| `POST` | `/api/passport/assets/` | Customer | Register new home asset with warranty |
| `POST` | `/api/support/tickets/` | Customer | Submit new support inquiry |
| `POST` | `/api/support/chat/` | Authenticated | Interactive FAQ and automated AI help |
| `GET` | `/api/admin/dashboard/` | Admin | Aggregate system performance & audit metrics |

---

## 10. Environment Variables & Configuration

Configuration is managed via root `.env` (loaded by `backend/kaamsetu/settings.py` via `python-dotenv`):

```ini
# --- Django Core ---
SECRET_KEY=your-super-secret-django-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,kaamsetu-api-vtac.onrender.com,.onrender.com

# --- Database ---
# Local SQLite default:
DB_ENGINE=sqlite
# Production PostgreSQL (Render Database):
# DATABASE_URL=postgres://user:password@hostname:5432/kaamsetu

# --- Security & CORS ---
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://frontend-zeta-ten-20.vercel.app,https://kaamsetu.app
CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://frontend-zeta-ten-20.vercel.app,https://kaamsetu.app
FRONTEND_URL=http://localhost:5173
PUBLIC_FRONTEND_URL=https://frontend-zeta-ten-20.vercel.app

# --- Email OTP (Gmail SMTP) ---
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_TIMEOUT=20
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
EMAIL_VERIFICATION_REQUIRED=True
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5

# --- AI Diagnostics ---
# Google Gemini Key (https://aistudio.google.com)
GEMINI_API_KEY=AIzaSy...
# Or OpenAI:
# OPENAI_API_KEY=sk-...
# AI_ENABLED=True

# --- Render Cloud Deployment ---
RENDER_API_KEY=rnd_...
```

---

## 11. Deployment & DevOps (Render, Vercel & Scripts)

### 1. Render Backend Deployment (`render.yaml`)
The project includes a ready-to-use Render Blueprint specification:
- **Web Service**: `kaamsetu-api` running Python 3.12, Gunicorn WSGI server.
- **Build Command**: `bash build.sh` (runs `pip install -r requirements.txt`, `python manage.py collectstatic --noinput`, and `python manage.py migrate`).
- **Health Check**: `/api/services/categories/`.

### 2. Vercel Frontend Deployment (`vercel.json`)
The frontend is optimized for Vercel Edge hosting with automatic single-page routing:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://kaamsetu-api-vtac.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3. Automated PowerShell Scripts (`scripts/`)
- **`deploy-render.ps1`**: Queries Render API using `RENDER_API_KEY`, locates `kaamsetu-api`, and triggers a fresh deploy without requiring manual dashboard interaction.
- **`sync-render-email-env.ps1`**: Reads local `.env` and safely synchronizes Gmail SMTP settings directly into Render Environment Variables without touching `DATABASE_URL` or `SECRET_KEY`.
- **`run-dev.ps1`**: Boots both Django backend (`localhost:8000`) and Vite frontend (`localhost:5173`) simultaneously.
- **`tunnel.ps1`**: Starts a tunnel allowing mobile devices to test live tracking and real-time maps.

---

## 12. Testing, Security & Demo Verification

### Running Test Suites
```bash
# Run backend test suite (11 unit/integration tests)
cd backend
python manage.py test core

# Run frontend build check
cd ../frontend
npm run build
```

### Automated Backend Tests (`core/tests.py`)
1. **Authentication & Token Issuance**: Verifies valid JWT generation and claims.
2. **Booking Workflow State Machine**: Validates status sequence from pending through to completion.
3. **Double-Booking Prevention**: Proves two customers cannot claim or hold the same provider slot at the same time.
4. **Partner Technician Conflict Prevention**: Proves a technician cannot be assigned to overlapping jobs.
5. **OTP Verification**: Proves jobs cannot be completed with incorrect OTP tokens.
6. **Invoice Generation**: Asserts math accuracy on labor, parts, and net charges.
7. **AI Hazard Rules**: Confirms dangerous keywords immediately suppress DIY responses.
8. **Support Auto-Escalation**: Validates priority boosts when customers mention safety hazards or repeated unresolved issues.

---

## 👨‍💻 Developed with ❤️ for KaamSetu
*Building trust, efficiency, and safety across home services.*
