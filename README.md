# KaamSetu — Home Maintenance Platform

**"Understand the problem, fix it safely, or find trusted help."**

KaamSetu is a full-stack home-maintenance platform combining AI diagnosis, safe DIY guidance, verified professionals, smart scheduling, live tracking, and household maintenance passport.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Leaflet, Axios, Lucide |
| Backend | Python 3, Django 5, Django REST Framework, Django Channels |
| Database | SQLite (demo) / PostgreSQL / MySQL |
| Real-time | WebSockets (Channels), Redis optional |
| Auth | JWT (SimpleJWT) with role-based access |

## Features (Implemented)

### Customer
- Register, login, profile, language preference (English / Gujarati)
- Home Checkup Station → AI Fix Assistant (text + image, bilingual)
- Provider/partner discovery with smart recommendation sections (Best Match, Nearest, Highest Rated, etc.)
- Compare up to 3 providers/partners
- Book service with preferred date/time and flexible timing
- Slot selection, temporary hold, provider confirmation flow
- Live tracking map (Demo Tracking Mode with simulated route)
- OTP job completion, auto-generated invoice, post-completion review
- Household Maintenance Passport (add/edit/delete appliances)
- Fair Price Checker with demo price labels
- Support desk: FAQ search, AI chat, ticket creation, ticket history

### Provider (Individual)
- Dashboard with incoming requests, job workflow (accept → prepare → travel → arrive → start → OTP complete)
- Calendar view, earnings/trust score, verification status
- Slot confirm/reject, before/after photo support via API

### Partner (Third Party)
- Full partner dashboard: organization profile, verification, technicians CRUD
- Incoming requests with technician assignment (double-booking prevention)
- Warranty claims, spare parts inventory, quotations
- Active/completed jobs, revenue stats

### Support
- Support agent desk: ticket list, assignment, replies, escalation
- AI support with automatic escalation rules (billing, safety, low confidence, repeat questions)

### Admin
- System stats dashboard (users, providers, partners, bookings, tickets, AI diagnoses)
- Bookings list view

### Safety & Demo Modes
- Dangerous issues (gas, fire, electrical, structural) block unsafe DIY instructions
- **Demo AI Mode** — rule-based diagnosis when `AI_ENABLED=False`
- **Demo Tracking Mode** — animated map route, clearly labelled
- **Approximate Demo Price** — all demo prices labelled
- **Demo Data** — seeded accounts and records labelled

## Folder Structure

```
KaamSetu/
├── backend/
│   ├── KaamSetu/          # Django project (settings, urls, asgi)
│   ├── accounts/          # User auth, profiles, 6 roles
│   ├── services/          # Categories, guides, price ranges, fair price
│   ├── providers/         # Providers, partners, recommendations, technicians
│   ├── bookings/          # Bookings, scheduling engine, slot holds, invoices
│   ├── ai_diagnosis/      # AI diagnosis with safety rules
│   ├── tracking/          # GPS tracking + WebSocket consumer
│   ├── support/           # Tickets, FAQ, AI chat, escalation
│   ├── passport/          # Household assets & maintenance records
│   ├── notifications/     # In-app notifications
│   └── core/              # Admin APIs, permissions, seed command, tests
├── frontend/
│   └── src/
│       ├── api/client.js  # Axios API client with JWT refresh
│       ├── components/    # Navbar, DashboardLayout, TrackingMap, etc.
│       ├── context/       # Auth & language contexts
│       ├── i18n/          # EN/GU translations
│       └── pages/         # All route pages by role
├── .env.example
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret (change in production) |
| `DEBUG` | `True` for development |
| `DB_ENGINE` | `sqlite`, `postgresql`, or `mysql` |
| `AI_ENABLED` | `True` with `OPENAI_API_KEY` for real AI |
| `OPENAI_API_KEY` | OpenAI key (backend only, never in frontend) |
| `USE_REDIS` | Enable Redis for Channels |
| `DEMO_MODE` | Demo labels and fallbacks |
| `MAX_UPLOAD_SIZE_MB` | File upload limit |
| `SLOT_HOLD_MINUTES` | Temporary slot hold duration (default 15) |

## Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Backend runs at http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend.

### WebSocket (optional, production)

```bash
USE_REDIS=True
REDIS_URL=redis://127.0.0.1:6379/0
daphne KaamSetu.asgi:application
```

## Demo Accounts

Password for all: **Demo@123**

| Role | Username | Dashboard URL |
|------|----------|---------------|
| Customer | customer1 | `/customer` |
| Individual Provider | provider1 | `/provider` |
| Third Party Partner | partner1 | `/partner` |
| Support Agent | support1 | `/support-desk` |
| Senior Support Agent | senior1 | `/support-desk` |
| Admin | admin | `/admin` |

All demo data is labelled with Demo Data badges.

## Testing

```bash
cd backend
python manage.py check
python manage.py test core
```

```bash
cd frontend
npm run build
```

### Test coverage (core/tests.py — 11 tests)
- Authentication & JWT
- Booking creation & status transitions
- **Double booking prevention** (two customers cannot hold same provider slot)
- **Technician double booking prevention**
- OTP completion & invoice generation
- AI safety rules (dangerous issues)
- Support escalation
- Reject-slot action

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | JWT login |
| POST | `/api/auth/register/` | Register customer |
| POST | `/api/ai/analyze/` | AI diagnosis (multipart) |
| GET | `/api/providers/recommendations/` | Smart provider ranking |
| POST | `/api/bookings/` | Create booking |
| GET | `/api/bookings/:id/available-slots/` | Available appointment slots |
| POST | `/api/bookings/:id/hold-slot/` | Hold slot temporarily |
| POST | `/api/bookings/:id/confirm-slot/` | Provider confirms slot |
| POST | `/api/bookings/:id/complete/` | OTP completion |
| GET | `/api/bookings/:id/invoice/` | Generated invoice |
| POST | `/api/services/fair-price/check/` | Fair price checker |
| GET | `/api/providers/partners/dashboard/` | Partner dashboard stats |
| POST | `/api/support/chat/` | AI support chat |
| GET | `/api/support/faq/` | FAQ search |
| GET | `/api/admin/dashboard/` | Admin stats |
| WS | `/ws/tracking/:id/` | Live location WebSocket |

## Provider Recommendation Weights

| Factor | Weight |
|--------|--------|
| Category match | 30% |
| Verification | 20% |
| Distance | 15% |
| Availability | 15% |
| Rating | 10% |
| Completed jobs | 5% |
| On-time completion | 3% |
| Response rate | 2% |

Sections: Best Match, Nearest Available, Highest Rated, Lowest Cost, Fastest Arrival, Authorized Brand Partner, Emergency Available, Top Local Professional.

## Security Notes

- Passwords hashed with Django PBKDF2
- JWT access + refresh tokens; auto-refresh on 401
- Role-based API permissions on all sensitive endpoints
- Frontend `ProtectedRoute` blocks cross-role URL access
- AI keys, DB credentials, JWT secret — backend `.env` only
- Dangerous issue safety rules prevent unsafe DIY instructions
- File upload size limits via `MAX_UPLOAD_SIZE_MB`

## Production Deployment

1. Set `DEBUG=False`, strong `SECRET_KEY`
2. Use PostgreSQL (`DB_ENGINE=postgresql`)
3. Enable Redis for Channels WebSockets
4. Serve with Gunicorn + Daphne behind Nginx
5. Build frontend: `npm run build` and serve `dist/`
6. Configure CORS for production domain
7. Use httpOnly cookies for JWT in production (currently localStorage)

## Known Limitations

- Payment integration is placeholder ("Payment Demo")
- Email/SMS notifications are console/log placeholders
- Real OpenAI requires `AI_ENABLED=True` + valid API key
- WebSocket tracking consumer lacks JWT auth (use REST polling fallback in demo)
- Admin panel covers stats + bookings list; full CRUD for all entities is partial
- Calendar views use list format, not full week/month grid
- Some UI strings remain English-only (i18n coverage is partial outside nav/forms)
- Frontend tracking uses REST polling; WebSocket client hook not wired in UI
