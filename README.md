# AttriSense AI - Enterprise Employee Retention Intelligence Platform

AttriSense AI is an enterprise-grade, high-fidelity SaaS intelligence platform designed to predict employee attrition risk, diagnose core friction drivers, and formulate customized retention action plans before resignations occur.

Built with a sleek, high-contrast, premium dark and light themed dashboard, the application presents high-density workforce insights using curated color systems, responsive charts, and real-time backend agent telemetry logs.

---

## Combined Project Architecture

Here is the structural mapping of the entire codebase, enclosing both the React + TypeScript Frontend and the Python + Flask Backend:

```text
HR System/
├── Backend/                            # Python Backend System
│   ├── app/                            # Flask Application Modules
│   │   ├── models/                     # MongoDB NoSQL Document Models
│   │   │   ├── __init__.py
│   │   │   ├── employee.py             # Employee model (matches SystemContext)
│   │   │   ├── user.py                 # User model (hr, admin, manager, employee)
│   │   │   ├── log.py                  # AgentLog model (matches LogEntry)
│   │   │   ├── copilot_chat.py         # Copilot chat message persistence
│   │   │   ├── history.py              # RiskHistory & EmployeeHistory models
│   │   │   ├── pulse_survey.py         # Pulse survey response model
│   │   │   ├── schedule.py             # Scheduled task model (InterventionAuth)
│   │   │   ├── settings.py             # System configuration settings model
│   │   │   └── audit_log.py            # SOC 2 compliance audit trail model
│   │   ├── routes/                     # REST API Endpoints
│   │   │   ├── analytics.py            # /api/v1/analytics/* (Pandas reports)
│   │   │   ├── auth.py                 # /api/v1/auth/* (JWT Login/Register/MFA/Password)
│   │   │   ├── employees.py            # /api/v1/employees/* (CRUD, deactivations)
│   │   │   ├── copilot.py              # /api/v1/copilot/* (AI chat completions)
│   │   │   ├── logs.py                 # /api/v1/agent-logs/* (SSE telemetry stream)
│   │   │   ├── reports.py              # /api/v1/reports/* (PDF/Excel export & scheduler)
│   │   │   └── settings_route.py       # /api/v1/settings/* (Config + Audit Trail)
│   │   ├── services/                   # Data Analytics & Notebook Logic
│   │   │   ├── agents/                 # Multi-Agent sub-agent definitions
│   │   │   ├── attrition.py            # ML Scoring & recommendation engine
│   │   │   ├── csv_engine.py           # Pandas engine (in-memory dataframes)
│   │   │   └── scheduler.py            # APScheduler background jobs
│   │   └── utils/
│   │       ├── auth.py                 # Custom JWT auth decorators
│   │       └── response.py             # API response wrappers
│   ├── data/
│   │   └── attrition_predictions.csv   # 59,598-row ML output dataset
│   ├── scripts/
│   │   └── seed.py                     # Database seeder script
│   ├── .env.example                    # Backend environment templates
│   ├── requirements.txt                # Python dependencies
│   └── run.py                          # Backend server entry point
│
├── UI/                                 # UI Mockups & Design Assets
│   └── *.jpg                           # Screenshots (AI Assistant, Dashboard, etc.)
│
├── public/                             # Static public assets (favicon, SVG icons)
├── src/                                # Frontend Source Files
│   ├── assets/                         # SVG logos and images
│   ├── components/                     # Shared Global Components
│   │   ├── Navbar.tsx                  # Main top navigation header
│   │   ├── DashboardLayout.tsx         # Workspace layout sidebar and telemetry
│   │   ├── DashboardPreview.tsx        # Preview charts inside Landing
│   │   ├── AgentShowcase.tsx           # Multi-Agent details carousel
│   │   ├── FeaturesGrid.tsx            # Core features grid layout
│   │   ├── ErrorBoundary.tsx           # React crash recovery boundary
│   │   └── ToastProvider.tsx           # Global toast notification system
│   ├── context/
│   │   └── SystemContext.tsx           # Global State (Auth, Employee DB, Ingest Logs)
│   ├── pages/                          # Application Pages
│   │   ├── LandingPage.tsx             # Interactive Portal & Showcase
│   │   ├── LoginPage.tsx               # Zod-validated authentication vault
│   │   ├── NotFoundPage.tsx            # 404 catch-all error page
│   │   ├── Dashboard.tsx               # Analytics charts and risk profiles queue
│   │   ├── EmployeeListPage.tsx        # Employee Directory & Ingestion Panel
│   │   ├── EmployeeDetailPage.tsx      # Profile metrics & historical telemetry
│   │   ├── RiskAnalyticsPage.tsx       # Live Risk Driver simulation console
│   │   ├── Copilot/                    # Interactive Agent Chat workspace
│   │   ├── PredictionCenter/           # ML simulation & sub-components
│   │   │   ├── PredictionCenter.tsx    # Parent workspace page
│   │   │   └── components/             # Sub-components (FeatureContribution, etc.)
│   │   ├── Reports/                    # Summary reporter & exporter (PDF/Excel)
│   │   ├── Settings/                   # System node config, keys & status
│   │   └── Survey/                     # Employee Pulse Survey self-service portal
│   ├── utils/
│   │   └── api.ts                      # Axios config & Token JWT interceptors
│   ├── App.tsx                         # Client Routing and Provider binding
│   ├── index.css                       # Font settings, custom variables & styling
│   └── main.tsx                        # Frontend entry point
│
├── .env.example                        # Frontend environment template
├── .gitignore                          # Global Ignore Rules
├── package.json                        # Node dependencies
├── package-lock.json
├── tsconfig.json                       # TS Configurations
├── vite.config.ts                      # Vite build settings (Tailwind v4 compiler)
└── README.md                           # Main documentation file
```

---

## Design Identity and Theme Switcher

The user interface implements a state-of-the-art theme switcher that handles both Command Center Dark Mode and Clean Enterprise Light Mode with high contrast and legibility:

* **Dark Mode Identity:**
  * Background: `#070A13` (Obsidian space theme)
  * Surface: `#0D1220` (Glassmorphic dark surfaces)
  * Highlight Glows: `#5865F2` (Indigo/Blue accents)
* **Light Mode Identity:**
  * Background: `#F4F6FA` (Sleek light-gray workspace surface)
  * Card Surfaces: `#FFFFFF` (Crisp white panels)
  * Text Headers & Main: `#0F172A` (Deep charcoal dark slate)
  * Secondary Titles: `#475569` (Subtle dark grey)
* **Typography:**
  * Primary Interface Font: **Inter** and **Plus Jakarta Sans**
  * Telemetry Metrics & Logs: **JetBrains Mono** (Monospace)

---

## Frontend Core Views and Submodules

The React frontend utilizes **React Router DOM** to map client routes to modular, high-fidelity workspace components:

### 1. Main Application Pages
* **Landing Page (`LandingPage.tsx`):** A portal showcasing product pitches and the **AI Agent Showcase** detail selector card where operators click to review active agents.
* **Security Authorization Vault (`LoginPage.tsx`):** Built with **Zod** schema validation. Streams simulated diagnostic log feeds before loading the workspace.
* **Workforce Command Center (`Dashboard.tsx`):** Evaluates macro workforce statuses (monitored count, overall attrition, high-risk queue) and displays optimizations using Recharts Area & Bar graphs.
* **Active Employee Directory (`EmployeeListPage.tsx`):** Lists all employees. Features custom search, multi-factor sorting, and a **Register Employee** form linked to a live streaming index console.
* **Personnel Profile Metrics (`EmployeeDetailPage.tsx`):** Detailed analysis card listing individual ratings, locations, delta metrics against salary benchmarks, historical risk trends (Area Chart), and chronological agent log feeds.
* **Simulated Risk Tuner (`RiskAnalyticsPage.tsx`):** Interactive sliders to dynamically adjust employee variables (workload, pay gap, stagnation) and view real-time changes.

### 2. Specialized Interactive Submodules
* **Prediction Center (`pages/PredictionCenter/`):** An advanced workspace allowing operators to test inputs (`InputConsole.tsx`), simulate predictions, and verify results inside a centered glassmorphic Prediction Result overlay containing **SHAP/LIME Explainable AI** contribution bar charts.
* **Copilot Workspace (`pages/Copilot/`):** A custom chatbot terminal styling live responses and diagnostics from backend AI agents.
* **Reports Center (`pages/Reports/`):** Interactive reporting module supporting on-demand generation and downloads of formatted PDF briefs and Excel spreadsheets. Also includes automated report scheduler configuration options.
* **Settings Node (`pages/Settings/`):** Monitors API server endpoints, keys, operator user management, MFA configuration, and SOC 2 audit trail logs.

---

## Python Backend Service Integration

The backend is built with **Flask 3.0**, **MongoDB (PyMongo NoSQL)**, and **Pandas** to support frontend analytics queries against mock datasets and provide document models for persistent storage.

### 1. Key Services & Engines
* **MongoDB NoSQL Layer (`app/db.py`):**
  * Configures global connection pooling to local or Atlas MongoDB URI.
  * Implements an SQL-compatibility wrapper (`MongoQuery`, `MongoFieldExpr`) to parse SQLAlchemy-like query syntax directly into MongoDB filters.
* **Pandas Analytics Engine (`app/services/csv_engine.py`):**
  * Loads a **59,598-row ML output dataset** (`data/attrition_predictions.csv`) into a memory-cached Pandas DataFrame.
  * Queries and aggregates metrics dynamically.
* **Attrition Logic Handler (`app/services/attrition.py`):**
  * Integrates the notebook-trained scikit-learn models or ported formulas to score new employees.
  * Computes recommendations based on workload ratios, salary gap benchmarks, and feedback indicators.

---

## Attrition Mathematical Formulation

The attrition probability is calculated via a structured weight aggregation algorithm mirroring Notebook Cell 2. The formula maps categorical parameters to scores:

```text
Attrition Score = Job Satisfaction Weight
                + Work Life Balance Weight
                + Overtime Weight
                + Performance Rating Weight
                + Recognition Weight
                + Company Reputation Weight
                + Promotion Stagnation Weight
                + Leadership Opportunities Weight
                + Innovation Opportunities Weight
```

### Weight Mapping Configurations
* **Job Satisfaction:** Very High (+0), High (+5), Medium (+12), Low (+20)
* **Work Life Balance:** Excellent (+0), Good (+5), Fair (+11), Poor (+18)
* **Overtime Workload:** Yes (+15), No (+0)
* **Performance Rating:** High (+0), Average (+5), Below Average (+9), Low (+12)
* **Employee Recognition:** Very High (+0), High (+2), Medium (+6), Low (+10)
* **Company Reputation:** Excellent (+0), Good (+2), Fair (+5), Poor (+8)
* **Promotions Factor:** calculated as `min(max(7 - promotions * 2, 0), 7)`
* **Leadership Opportunities:** Yes (+0), No (+5)
* **Innovation Opportunities:** Yes (+0), No (+5)

Scores are capped between `0` and `100`. Values $\ge 65$ are labeled **High Risk**, values $\ge 35$ are labeled **Medium Risk**, and others are **Low Risk**.

---

## Advanced Agentic AI and UI/UX Capabilities

AttriSense AI goes beyond basic charts to provide autonomous reasoning agents and state-of-the-art interactive modules:

### 1. Multi-Agent System Breakdown
The platform features 5 distinct, collaborating sub-agents orchestrating workforce evaluation:
1. **Employee Analytics Agent:** Fetches telemetry variables (Salary Gap, Overtime Hours, Ratings) and coordinates database queries.
2. **Attrition Prediction Agent:** Calculates the mathematical flight-risk score of employees based on their current features.
3. **Root Cause Analysis Agent:** Translates the feature delta against benchmarks into SHAP/LIME feature contributions (Risk Factors vs Protective Factors).
4. **Retention Recommendation Agent:** Generates tailored, actionable steps (e.g. compensation adjustments, structured mentorship) and drafts email proposals automatically.
5. **HR Insights Agent:** Condenses all historical runs, active parameters, and interventions into executive briefs for senior leadership.

### 2. Enhanced Copilot (LLM Dynamic Capabilities & Tool Calling)
The interactive Chat Copilot ([copilot.py](file:///d:/Internship/ST/HR%20System/Backend/app/routes/copilot.py)) acts as an autonomous Agentic Assistant with the following capabilities:
* **Dynamic Tool Calling:** The LLM can interpret natural language questions and execute backend python tools on demand:
  * **Database Queries:** Runs real-time aggregation queries on employee records.
  * **Risk Simulation:** Computes the mathematical result of hypotheticals.

---

## REST API Reference

All backend server routes are prefixed with `/api/v1/`. Protected routes require a JWT bearer header:
```text
Authorization: Bearer <token>
```

### 1. Authentication & Security
| Method | Endpoint | Body | Access | Notes |
|---|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password, totpCode? }` | Public | Returns authentication JWT token and user profile details |
| `POST` | `/auth/register` | `{ name, email, password, role }` | Public | Creates a new operator/HR user account |
| `GET` | `/auth/me` | — | Protected | Returns details of the logged-in user session |
| `PUT` | `/auth/change-password` | `{ currentPassword, newPassword }` | Protected | Changes password for the logged-in user |
| `GET` | `/auth/users` | — | Protected | Lists all active operator accounts in the organization |
| `POST` | `/auth/users` | `{ name, email, role }` | Protected | Creates a new operator user account |
| `DELETE`| `/auth/users/<user_id>` | — | Protected | Deactivates an operator account |
| `GET` | `/auth/mfa/setup` | — | Protected | Generates TOTP secret and provisioning URI for MFA setup |
| `POST` | `/auth/mfa/enable` | `{ totpCode }` | Protected | Verifies TOTP code and enables MFA for the account |
| `POST` | `/auth/mfa/disable` | — | Protected | Disables MFA for the logged-in user |

### 2. Employee Directory Management
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| `GET` | `/employees/` | Protected | Query filters supported: `status`, `dept`, `search`, `page`, `limit` |
| `POST` | `/employees/` | Protected | Body: `{ name, email, dept, role, tenure, overtimeHrs, salaryGap }` |
| `GET` | `/employees/<id>`| Protected | Returns full profile, delta analysis, and historical scores |
| `PUT` | `/employees/<id>`| Protected | Updates employee properties (e.g., slider tweaks) |
| `PATCH`| `/employees/<id>/deactivate` | Protected | Soft-deletes/deactivates the employee profile |
| `POST` | `/employees/pulse-survey` | Protected | Submits employee pulse survey responses |

### 3. Analytics (Pandas Aggregated Feeds)
| Method | Endpoint | Access | Feeds |
|---|---|---|---|
| `GET` | `/analytics/dashboard` | Protected | Summary metrics, weekly forecast data, and department risk distributions |
| `GET` | `/analytics/risk-summary` | Protected | Overall risk summary statistics |
| `GET` | `/analytics/feature-importance` | Protected | Relative factor weights (for RootCause radar charts) |
| `GET` | `/analytics/csv-overview` | Protected | Evaluates overview metrics of the 59,598 predictions |
| `GET` | `/analytics/csv-employees` | Protected | Queries predictions: `?risk=High&jobRole=Technology&page=1&limit=20` |
| `GET` | `/analytics/dept/<dept>` | Protected | Detailed metrics for a specific department |
| `GET` | `/analytics/salary-benchmark` | Protected | Returns salary ranges: `?jobRole=Technology&jobLevel=Senior` |
| `GET` | `/analytics/tenure-analysis` | Protected | Categorized analysis of attrition grouped by years of service |
| `POST` | `/analytics/pre-hiring-simulate` | Protected | Simulates candidate attrition risk based on input parameters |
| `GET` | `/analytics/retention-tracker` | Protected | Returns retention ROI metrics and intervention impact data |

### 4. Telemetry Logs
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| `GET` | `/agent-logs/` | Protected | Telemetry logs query: `?limit=25&employeeId=EMP-0012` |
| `POST` | `/agent-logs/` | Protected | Appends custom diagnostic logs during manual adjustments |
| `GET` | `/agent-logs/stream` | Public (SSE) | Server-Sent Events stream for real-time log telemetry |

### 5. AI Copilot
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| `POST` | `/copilot/chat` | Protected | Body: `{ message, employeeId?, sessionId? }` — AI-powered chat |
| `GET` | `/copilot/history` | Protected | Returns chat history for a session: `?sessionId=default-session` |

### 6. Reports & Exports
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| `GET` | `/reports/export/pdf` | Protected | Generates and downloads styled PDF brief containing stats and employees |
| `GET` | `/reports/export/excel` | Protected | Generates and downloads monitored employee list as `.xlsx` sheet |
| `GET` | `/reports/scheduler` | Protected | Fetches active automated report scheduling configs |
| `POST` | `/reports/scheduler` | Protected | Updates report scheduler configurations and saves settings |

### 7. Settings & Audit Trail
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| `GET` | `/settings/` | Protected | Returns all system configuration key-value pairs |
| `PUT` | `/settings/` | Protected | Updates system settings (logs changes to audit trail) |
| `GET` | `/settings/audit-trail` | Admin Only | Returns SOC 2 compliance audit trail logs |

---

## Execution and Setup Guide

### 1. Backend Server Setup (Python)
Navigate to the `Backend` directory and perform the setup:

```powershell
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create local environment config
cp .env.example .env
# Open '.env' and set your keys (MONGO_URI, MONGO_DB_NAME, SECRET_KEY, JWT_SECRET_KEY, GROQ_API_KEY)

# Populate MongoDB Collections (Drops existing & inserts Admin, Manager, Employees & historical metrics)
python scripts/seed.py

# Start Flask Application
python run.py
# Backend runs at -> http://localhost:5000
```
* **Default HR Admin Login:** `admin` / `admin`
* **Default Manager Login:** `manager` / `manager`
* **Default Employee Login:** `employee` / `employee`

---

### 2. Frontend Workspace Setup (React)
Navigate to the root directory containing `package.json`:

```powershell
# Install Node dependencies
npm install

# Run the development environment
npm run dev
# Interface starts at -> http://localhost:5173
```

Ensure your `.env` configuration points to the active backend address:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

To compile the production build:
```powershell
npm run build
```

---

## Project Contributors

Development, integrations, and Git repositories managed by:
* **Tirth Shah** (github.com/tirthshah-SingleTap)
* **Pratishtha Virpura** (github.com/pratishthavirpura-SingleTap)
* **Meet Shingala** (github.com/meetshingal-SingleTap)
* **Niyati Patel** (github.com/niyatipatel-SingleTap)
* **Keyur Trivedi** (github.com/keyurtrivedi-singletap)
