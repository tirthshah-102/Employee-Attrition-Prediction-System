"""
python scripts/seed.py

Seeds the MongoDB database with:
  1. Default admin user  → admin@attrisense.ai / Admin@123
  2. The 11 initial employees (frontend mock data)
  3. Top 500 High-risk records from the CSV (loaded with Pandas)
  4. Initial agent log entries
"""

import os
import sys
import random
import datetime
from datetime import datetime, timezone

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.db import db
from app.models.user     import User
from app.models.employee import Employee
from app.models.log      import AgentLog
from app.models.settings import SystemSetting
from app.models.schedule import ReportSchedule, InterventionAuth
from app.models.history  import RiskHistory
from app.models.copilot_chat import ChatMessage

# ── 1. Frontend SystemContext.tsx initial employees ───────────────────────────
INITIAL_EMPLOYEES = [
    {"employee_id":"EMP-0412","name":"Sarah Jenkins",   "email":"s.jenkins@attrisense.ai",  "dept":"Engineering",       "role":"Senior React Developer", "tenure":"2.4 yrs","probability":91.2,"status":"High",  "primary_factor":"Workload & Overtime", "overtime_hrs":18,"salary_gap":-4.5, "manager_feedback":6.2,"growth_index":5.5,"playbook_status":"Ready","location":"San Francisco, CA","date_hired":"Mar 12, 2024","rating":4.8},
    {"employee_id":"EMP-0922","name":"Michael Chen",    "email":"m.chen@attrisense.ai",     "dept":"Sales & BD",        "role":"Key Account Manager",   "tenure":"1.2 yrs","probability":84.5,"status":"High",  "primary_factor":"Compensation Gap",    "overtime_hrs": 4,"salary_gap":-18.4,"manager_feedback":8.5,"growth_index":7.2,"playbook_status":"Ready","location":"New York, NY",    "date_hired":"Feb 10, 2025","rating":4.2},
    {"employee_id":"EMP-1108","name":"Elena Rostova",   "email":"e.rostova@attrisense.ai",  "dept":"Engineering",       "role":"Full Stack Engineer",   "tenure":"3.1 yrs","probability":78.9,"status":"High",  "primary_factor":"Role Stagnation",     "overtime_hrs": 8,"salary_gap": 2.1, "manager_feedback":7.0,"growth_index":3.2,"playbook_status":"Ready","location":"London, UK",      "date_hired":"May 04, 2023","rating":4.6},
    {"employee_id":"EMP-0567","name":"Marcus Vance",    "email":"m.vance@attrisense.ai",    "dept":"Marketing",         "role":"Growth Specialist",     "tenure":"0.8 yrs","probability":73.1,"status":"High",  "primary_factor":"Onboarding Friction", "overtime_hrs": 3,"salary_gap":-12.0,"manager_feedback":4.8,"growth_index":6.0,"playbook_status":"Ready","location":"Austin, TX",      "date_hired":"Oct 15, 2025","rating":3.9},
    {"employee_id":"EMP-1321","name":"David Kim",       "email":"d.kim@attrisense.ai",      "dept":"Product Management","role":"Product Owner",         "tenure":"1.5 yrs","probability":64.2,"status":"Medium","primary_factor":"Feedback Loop Issues","overtime_hrs": 6,"salary_gap":-2.0, "manager_feedback":4.2,"growth_index":8.0,"playbook_status":"Ready","location":"Seattle, WA",     "date_hired":"Jul 22, 2024","rating":4.5},
    {"employee_id":"EMP-0248","name":"Chloe Dubois",    "email":"c.dubois@attrisense.ai",   "dept":"Marketing",         "role":"SEO Lead",              "tenure":"2.1 yrs","probability":58.7,"status":"Medium","primary_factor":"Role Stagnation",     "overtime_hrs": 2,"salary_gap": 0.5, "manager_feedback":7.5,"growth_index":4.5,"playbook_status":"Ready","location":"Paris, FR",       "date_hired":"Jan 14, 2024","rating":4.1},
    {"employee_id":"EMP-0734","name":"Aarav Patel",     "email":"a.patel@attrisense.ai",    "dept":"Engineering",       "role":"DevOps Architect",      "tenure":"4.2 yrs","probability":42.1,"status":"Low",   "primary_factor":"Workload & Overtime", "overtime_hrs":14,"salary_gap": 8.2, "manager_feedback":9.0,"growth_index":7.8,"playbook_status":"Ready","location":"Bangalore, IN",   "date_hired":"Apr 02, 2022","rating":4.9},
    {"employee_id":"EMP-1502","name":"Sophia Martinez", "email":"s.martinez@attrisense.ai", "dept":"Sales & BD",        "role":"BD Executive",          "tenure":"0.5 yrs","probability":35.4,"status":"Low",   "primary_factor":"Onboarding Friction", "overtime_hrs": 1,"salary_gap":-5.0, "manager_feedback":7.2,"growth_index":6.8,"playbook_status":"Ready","location":"Chicago, IL",     "date_hired":"Nov 12, 2025","rating":4.0},
    {"employee_id":"EMP-0881","name":"James Wilson",    "email":"j.wilson@attrisense.ai",   "dept":"Product Management","role":"Product Designer",      "tenure":"2.8 yrs","probability":18.2,"status":"Low",   "primary_factor":"Feedback Loop Issues","overtime_hrs": 2,"salary_gap":-1.0, "manager_feedback":8.2,"growth_index":8.5,"playbook_status":"Ready","location":"Boston, MA",      "date_hired":"Aug 04, 2023","rating":4.7},
    {"employee_id":"EMP-1204","name":"Priya Sharma",    "email":"p.sharma@attrisense.ai",   "dept":"Engineering",       "role":"QA Lead",               "tenure":"3.5 yrs","probability":28.5,"status":"Low",   "primary_factor":"Workload & Overtime", "overtime_hrs": 6,"salary_gap":-3.0, "manager_feedback":7.8,"growth_index":6.0,"playbook_status":"Ready","location":"Mumbai, IN",      "date_hired":"Dec 15, 2022","rating":4.4},
    {"employee_id":"EMP-1411","name":"Robert Taylor",   "email":"r.taylor@attrisense.ai",   "dept":"Marketing",         "role":"Talent Partner",        "tenure":"1.1 yrs","probability":45.4,"status":"Medium","primary_factor":"Role Stagnation",     "overtime_hrs": 4,"salary_gap":-8.0, "manager_feedback":6.0,"growth_index":5.0,"playbook_status":"Ready","location":"Denver, CO",      "date_hired":"May 10, 2025","rating":4.3},
]

# ── 2. SystemContext.tsx rawLogs ──────────────────────────────────────────────
INITIAL_LOGS = [
    {"source":"Analytics","text":"Data sync complete. 59,598 employee profiles verified from ML dataset.","type":"info"},
    {"source":"Predictor","text":"Checking employee risk levels...","type":"info"},
    {"source":"Analytics","text":"Engagement decrease (-42%) observed for Elena Rostova (EMP-1108).","type":"warning","employee_id":"EMP-1108"},
    {"source":"Predictor","text":"Elena Rostova flagged at 78.9% (High Risk).","type":"danger","employee_id":"EMP-1108"},
    {"source":"Diagnosis","text":"Risk analysis: High workload and lack of growth identified for EMP-1108.","type":"info","employee_id":"EMP-1108"},
    {"source":"Playbooks","text":"Action plan suggested: Career Development Plan.","type":"success"},
    {"source":"Reporter", "text":"Action plan prepared for Elena Rostova. Ready for review.","type":"success","employee_id":"EMP-1108"},
]


def seed():
    app = create_app()
    with app.app_context():
        print("[db] Dropping and recreating all collections...")
        for col_name in db.list_collection_names():
            db.drop_collection(col_name)
        print("[db] Collections dropped\n")

        # ── Multi-Tenant Users ──────────────────────────────────────────────────
        # Company A Users (org-comp-a)
        admin = User(name="HR Admin A", email="admin", role="admin", organization_id="org-comp-a")
        admin.set_password("admin")
        admin.save()

        manager = User(name="Elena Rostova (Eng Manager)", email="manager", role="manager", organization_id="org-comp-a")
        manager.set_password("manager")
        manager.save()

        employee_user = User(name="Sarah Jenkins", email="employee", role="employee", organization_id="org-comp-a")
        employee_user.set_password("employee")
        employee_user.save()

        # Company B Users (org-comp-b)
        admin_b = User(name="HR Admin B", email="compb_admin", role="admin", organization_id="org-comp-b")
        admin_b.set_password("admin")
        admin_b.save()

        print("[auth] Seeding Multi-Tenant users completed.")

        # ── Initial employees (Company A) ───────────────────────────────────────
        manager_mapping = {
            "EMP-0412": "EMP-1108",
            "EMP-0734": "EMP-1108",
            "EMP-1204": "EMP-1108",
            "EMP-0248": "EMP-0567",
        }

        for row in INITIAL_EMPLOYEES:
            emp = Employee(**row)
            emp.organization_id = "org-comp-a"
            emp.manager_id = manager_mapping.get(emp.employee_id)
            emp.save()
        print(f"[data] Seeded {len(INITIAL_EMPLOYEES)} frontend initial employees for org-comp-a")

        # ── Historical risk trajectory ───────────────────────────────────────
        import datetime
        print("[data] Seeding historical risk data...")
        for row in INITIAL_EMPLOYEES:
            base_prob = row["probability"]
            for month_offset in range(6, 0, -1):
                recorded_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30 * month_offset)
                volatility = random.uniform(-15.0, 10.0)
                hist_prob = min(max(base_prob + volatility, 5.0), 98.0)
                hist = RiskHistory(
                    employee_id=row["employee_id"],
                    probability=round(hist_prob, 2),
                    status="High" if hist_prob >= 65 else ("Medium" if hist_prob >= 35 else "Low"),
                    recorded_at=recorded_at
                )
                hist.save()

        # ── Agent logs ─────────────────────────────────────────────────────────
        for row in INITIAL_LOGS:
            log = AgentLog(**row)
            log.save()
        print(f"[data] Seeded {len(INITIAL_LOGS)} agent logs")

        # ── Settings thresholds ────────────────────────────────────────────────
        default_settings = [
            SystemSetting(key="confidenceThreshold", value="0.75"),
            SystemSetting(key="modelVersion", value="v4.2.RC-1"),
            SystemSetting(key="mfaEnforced", value="false")
        ]
        for s in default_settings:
            s.save()
            
        # ── Report schedules ──────────────────────────────────────────────────
        default_schedules = [
            ReportSchedule(name="Weekly Volatility Forecast", frequency="Weekly", format="PDF", recipients="hr-ops@company.com"),
            ReportSchedule(name="Monthly Cost-Mitigation Report", frequency="Monthly", format="CSV", recipients="board@company.com")
        ]
        for s in default_schedules:
            s.save()

        # ── Intervention authorizations ───────────────────────────────────────
        default_auths = [
            InterventionAuth(dept="Engineering", amount=45000.00),
            InterventionAuth(dept="Sales & BD", amount=25000.00)
        ]
        for a in default_auths:
            a.save()
            
        print("[data] Seeded settings, schedules, and authorizations")

        # ── Top 500 High-risk from CSV (Pandas) ───────────────────────────────
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data", "attrition_predictions.csv",
        )
        if not os.path.exists(csv_path):
            print(f"[warning] CSV not found at {csv_path} — skipping CSV seed")
        else:
            df = pd.read_csv(csv_path)
            df = df.rename(columns={
                "Employee ID":          "employee_id",
                "Age":                  "age",
                "Gender":               "gender",
                "Job Role":             "job_role",
                "Job Level":            "job_level",
                "Yearly Income ($)":    "yearly_income",
                "Years at Company":     "years_at_company",
                "Job Satisfaction":     "job_satisfaction",
                "Work-Life Balance":    "work_life_balance",
                "Overtime":             "overtime",
                "Performance Rating":   "performance_rating",
                "Number of Promotions": "num_promotions",
                "Attrition_Score":      "attrition_score",
                "Predicted_Score":      "predicted_score",
                "Risk_Category":        "risk_category",
                "Predicted_Risk":       "predicted_risk",
            })

            high_df = (
                df[df["risk_category"] == "High"]
                .sort_values("predicted_score", ascending=False)
                .head(2000)
            )

            csv_employees = []
            months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            idx = 0
            for _, r in high_df.iterrows():
                eid = f"CSV-{int(r['employee_id']):05d}"
                factor = (
                    "Workload & Overtime"  if r["overtime"] == "Yes"
                    else "Role Stagnation" if r["num_promotions"] == 0
                    else "Feedback Loop Issues" if r["job_satisfaction"] == "Low"
                    else "Compensation Gap"
                )
                perf_to_rating = {"High": 4.5, "Average": 3.5, "Below Average": 2.5, "Low": 2.0}
                org_id = "org-comp-a" if idx < 1500 else "org-comp-b"
                
                assigned_mgr = None
                if org_id == "org-comp-a":
                    job_r = str(r["job_role"])
                    if "Eng" in job_r or "Tech" in job_r:
                        assigned_mgr = "EMP-1108"
                    elif "Sales" in job_r:
                        assigned_mgr = "EMP-0922"
                    elif "Marketing" in job_r:
                        assigned_mgr = "EMP-0567"
                    elif "Product" in job_r or "PM" in job_r:
                        assigned_mgr = "EMP-1321"

                emp = Employee(
                    employee_id    = eid,
                    name           = f"Employee #{int(r['employee_id'])}",
                    email          = f"emp{int(r['employee_id'])}@{org_id}.ai",
                    dept           = r["job_role"],
                    role           = f"{r['job_level']} {r['job_role']} Specialist",
                    tenure         = f"{int(r['years_at_company'])} yrs",
                    probability    = float(r["predicted_score"]),
                    status         = str(r["predicted_risk"]),
                    primary_factor = factor,
                    overtime_hrs   = 12.0 if r["overtime"] == "Yes" else 3.0,
                    salary_gap     = -15.0 if r["yearly_income"] < 6000 else (-5.0 if r["yearly_income"] < 9000 else 2.0),
                    manager_feedback = 8.0 if r["performance_rating"] == "High" else 6.0,
                    growth_index   = float(r["num_promotions"]) * 2 + 3.0,
                    playbook_status = "Ready",
                    location       = "Remote",
                    date_hired     = f"{random.choice(months)} 01, {2024 - int(r['years_at_company'])}",
                    rating         = perf_to_rating.get(str(r["performance_rating"]), 3.5),
                    organization_id = org_id,
                    manager_id      = assigned_mgr,
                    csv_employee_id  = int(r["employee_id"]),
                    age              = int(r["age"]),
                    gender           = str(r["gender"]),
                    job_role         = str(r["job_role"]),
                    job_level        = str(r["job_level"]),
                    yearly_income    = int(r["yearly_income"]),
                    years_at_company = int(r["years_at_company"]),
                    job_satisfaction = str(r["job_satisfaction"]),
                    work_life_balance= str(r["work_life_balance"]),
                    overtime         = str(r["overtime"]),
                    performance_rating = str(r["performance_rating"]),
                    num_promotions   = int(r["num_promotions"]),
                    attrition_score  = float(r["attrition_score"]),
                    predicted_score  = float(r["predicted_score"]),
                    risk_category    = str(r["risk_category"]),
                    predicted_risk   = str(r["predicted_risk"]),
                )
                csv_employees.append(emp)
                idx += 1

            # Mongo Batch Insert
            insert_docs = []
            for emp in csv_employees:
                doc = {k: v for k, v in emp.__dict__.items() if k not in ('id', '_id')}
                insert_docs.append(doc)
            db.employees.insert_many(insert_docs)
            print(f"[data] Seeded {len(csv_employees)} High-risk employees from CSV (Pandas)")

            # Seed risk history in bulk for the CSV employees
            csv_history = []
            for emp in csv_employees:
                base_prob = emp.probability
                for month_offset in range(6, 0, -1):
                    recorded_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30 * month_offset)
                    volatility = random.uniform(-15.0, 10.0)
                    hist_prob = min(max(base_prob + volatility, 5.0), 98.0)
                    hist = RiskHistory(
                        employee_id=emp.employee_id,
                        probability=round(hist_prob, 2),
                        status="High" if hist_prob >= 65 else ("Medium" if hist_prob >= 35 else "Low"),
                        recorded_at=recorded_at
                    )
                    csv_history.append(hist)
            
            db.risk_history.insert_many([{k: v for k, v in h.__dict__.items() if k not in ('id', '_id')} for h in csv_history])


            # Seed historical playbook executions
            print("[data] Seeding historical playbook execution outcomes...")
            now = datetime.datetime.now(datetime.timezone.utc)
            
            intervened_emps = Employee.query.limit(15).all()
            for idx, emp in enumerate(intervened_emps):
                if idx % 3 == 0:
                    exec_days_ago = 45
                    pb_name = "Workload Calibrator"
                    cost = 1500.0
                elif idx % 3 == 1:
                    exec_days_ago = 100
                    pb_name = "Comp Calibrator"
                    cost = 4500.0
                else:
                    exec_days_ago = 200
                    pb_name = "Career Path Directive"
                    cost = 2000.0
                    
                exec_time = now - datetime.timedelta(days=exec_days_ago)
                emp.playbook_status = "Executed"
                emp.append_playbook_event({
                    "playbook": pb_name,
                    "executed_at": exec_time.isoformat(),
                    "cost": cost,
                    "status": "Executed"
                })
                if idx in (3, 7):
                    emp.is_active = False
                emp.save()

        print("\n[success] Seed complete!")


if __name__ == "__main__":
    seed()
