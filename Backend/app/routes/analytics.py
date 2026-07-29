from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, timezone

from app.db import db
from app.models.employee import Employee
from app.models.schedule import InterventionAuth
from app.services.csv_engine import CsvEngine, FEATURE_IMPORTANCE, RADAR_DATA
from app.utils.response import success, error

analytics_bp = Blueprint("analytics", __name__)


def _engine() -> CsvEngine:
    return CsvEngine.instance()


@analytics_bp.get("/dashboard")
@jwt_required()
def dashboard():
    import numpy as np
    from datetime import datetime, timezone
    from app.db import db
    from app.models.history import RiskHistory

    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_role = claims.get("role")

    mgr_dept = None
    if user_role == "manager":
        from flask_jwt_extended import get_jwt_identity
        from app.models.user import User
        from app.db import get_user_id
        user_id = get_user_id(get_jwt_identity())
        user = User.query.get(user_id)
        if user:
            mgr_dept = getattr(user, "department", None)
            if not mgr_dept:
                # Fallback to employee record check
                name_parts = user.name.split() if user.name else []
                first_name = name_parts[0] if name_parts else ""
                if first_name:
                    emp = Employee.query.filter(
                        Employee.organization_id == org_id,
                        db.or_(Employee.email == user.email, Employee.name.ilike(f"%{first_name}%"))
                    ).first()
                else:
                    emp = Employee.query.filter(
                        Employee.organization_id == org_id,
                        Employee.email == user.email
                    ).first()
                if emp:
                    mgr_dept = emp.dept

    q = Employee.query.filter_by(is_active=True, organization_id=org_id)
    if mgr_dept:
        import re
        q = q.filter({"dept": {"$regex": f"^{re.escape(mgr_dept)}$", "$options": "i"}})

    total              = q.count()
    if total == 0:
        return success({
            "kpis": {
                "total":               0,
                "highRisk":            0,
                "executedPlaybooks":   0,
                "completionRate":      0,
                "currentRiskIndex":    0,
                "totalMitigationPct":  0,
            },
            "deptData":  [],
            "trendData": [],
        }, "Dashboard data fetched (empty)")

    high_risk          = q.filter_by(status="High").count()
    executed_playbooks = q.filter_by(playbook_status="Executed").count()
    completion_rate    = round((executed_playbooks / total * 100)) if total else 0

    # Dynamic calculation of current overall risk index
    match_stage = {"is_active": True, "organization_id": org_id}
    if mgr_dept:
        import re
        match_stage["dept"] = {"$regex": f"^{re.escape(mgr_dept)}$", "$options": "i"}

    pipeline_avg = [
        {"$match": match_stage},
        {"$group": {"_id": None, "avg_prob": {"$avg": "$probability"}}}
    ]
    avg_res = list(db.employees.aggregate(pipeline_avg))
    avg_prob = avg_res[0]["avg_prob"] if avg_res and avg_res[0].get("avg_prob") is not None else 0.0
    current_risk_index = round(avg_prob / 5.0, 1)
    total_mitigation_pct   = min((executed_playbooks * 8), 95)

    # Department high-risk breakdown for bar chart using MongoDB Aggregation
    match_stage_high = {"is_active": True, "status": "High", "organization_id": org_id}
    if mgr_dept:
        import re
        match_stage_high["dept"] = {"$regex": f"^{re.escape(mgr_dept)}$", "$options": "i"}

    dept_pipeline = [
        {"$match": match_stage_high},
        {"$group": {"_id": "$dept", "count": {"$sum": 1}}}
    ]
    dept_agg = list(db.employees.aggregate(dept_pipeline))
    colors = ["#EF4444", "#F59E0B", "#06B6D4", "#22C55E", "#8B5CF6", "#EC4899", "#3B82F6"]
    dept_data = []
    for idx, item in enumerate(dept_agg):
        if item["_id"]:
            dept_data.append({
                "name": item["_id"],
                "count": item["count"],
                "color": colors[idx % len(colors)]
            })

    # Time-Series Forecasting Model (Numpy Linear Regression)
    active_emps_query = Employee.query.filter_by(is_active=True, organization_id=org_id)
    if mgr_dept:
        import re
        active_emps_query = active_emps_query.filter({"dept": {"$regex": f"^{re.escape(mgr_dept)}$", "$options": "i"}})
    active_emps = active_emps_query.all()
    active_emp_ids = [e.employee_id for e in active_emps]
    
    avg_active_prob = sum([e.probability for e in active_emps]) / len(active_emps) if active_emps else 16.2 * 5.0
    dynamic_base_index = avg_active_prob / 5.0
    base_probs = [
        round(dynamic_base_index - 1.0, 1),
        round(dynamic_base_index - 0.7, 1),
        round(dynamic_base_index - 0.3, 1),
        round(dynamic_base_index, 1)
    ]
    
    if active_emp_ids:
        # Query risk history in MongoDB
        history = RiskHistory.query.filter({"employee_id": {"$in": active_emp_ids}}).all()
        if history:
            now_dt = datetime.now(timezone.utc)
            month_sums = {}
            month_counts = {}
            for h in history:
                recorded_at_dt = h.recorded_at
                if isinstance(recorded_at_dt, str):
                    try:
                        recorded_at_dt = datetime.fromisoformat(recorded_at_dt)
                    except ValueError:
                        recorded_at_dt = datetime.now(timezone.utc)
                delta_days = (now_dt - recorded_at_dt.replace(tzinfo=timezone.utc)).days
                month_idx = min(3, max(0, delta_days // 30))
                month_sums[month_idx] = month_sums.get(month_idx, 0.0) + h.probability
                month_counts[month_idx] = month_counts.get(month_idx, 0) + 1
            
            calculated_probs = []
            for i in range(3, -1, -1):
                if month_counts.get(i, 0) > 0:
                    calculated_probs.append(month_sums[i] / month_counts[i] / 5.0)
                else:
                    calculated_probs.append(dynamic_base_index - i * 0.3)
            if len(calculated_probs) == 4:
                base_probs = calculated_probs

    x = np.arange(len(base_probs))
    y = np.array(base_probs)
    slope, intercept = np.polyfit(x, y, 1)
    
    w5_projected = max(3.5, slope * 4 + intercept)
    w6_projected = max(3.5, slope * 5 + intercept)
    
    all_baseline = base_probs + [w5_projected, w6_projected]
    
    trend_data = []
    for idx, name in enumerate(["W1", "W2", "W3", "W4", "W5", "W6"]):
        base = round(all_baseline[idx], 1)
        opt_reduction = executed_playbooks * 0.95 * (idx + 1) / 6.0
        optimized = round(max(base - opt_reduction, 3.2), 1)
        trend_data.append({
            "name": name,
            "baseline": base,
            "optimized": optimized
        })

    return success({
        "kpis": {
            "total":               total,
            "highRisk":            high_risk,
            "executedPlaybooks":   executed_playbooks,
            "completionRate":      completion_rate,
            "currentRiskIndex":    current_risk_index,
            "totalMitigationPct":  total_mitigation_pct,
        },
        "deptData":  dept_data,
        "trendData": trend_data,
    }, "Dashboard data fetched")


# ── GET /api/v1/analytics/risk-summary ────────────────────────────────────────
@analytics_bp.get("/risk-summary")
@jwt_required()
def risk_summary():
    from app.db import db

    pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "avg_probability": {"$avg": "$probability"}
        }}
    ]
    agg = list(db.employees.aggregate(pipeline))

    dist = {"High": {"count": 0, "avgProbability": 0},
            "Medium": {"count": 0, "avgProbability": 0},
            "Low": {"count": 0, "avgProbability": 0}}
    for row in agg:
        dist[row["_id"]] = {
            "count":          row["count"],
            "avgProbability": round(row["avg_probability"] or 0, 1),
        }

    return success({"distribution": dist}, "Risk summary fetched")



# ── GET /api/v1/analytics/csv-overview ────────────────────────────────────────
# Full 59,598-row Pandas summary — all derived with Pandas
@analytics_bp.get("/csv-overview")
@jwt_required()
def csv_overview():
    return success(_engine().full_overview(), "CSV overview fetched")


# ── GET /api/v1/analytics/feature-importance ──────────────────────────────────
# RootCausePage.tsx radar + bar chart data
@analytics_bp.get("/feature-importance")
@jwt_required()
def feature_importance():
    return success({
        "importance": FEATURE_IMPORTANCE,
        "radarData":  RADAR_DATA,
    }, "Feature importance fetched")


# ── GET /api/v1/analytics/dept/<dept> ────────────────────────────────────────
# Per-department deep dive (Healthcare | Technology | Finance | Education | Media)
@analytics_bp.get("/dept/<dept>")
@jwt_required()
def dept_detail(dept: str):
    import pandas as pd
    engine = _engine()
    df = engine.df[engine.df["job_role"] == dept]
    assert isinstance(df, pd.DataFrame)
    if df.empty:
        return error(f"No CSV data for department: {dept}", 404)

    return success({
        "department":         dept,
        "total":              len(df),
        "riskDistribution":   engine.risk_distribution(df),
        "scoreStats":         engine.score_stats(df),
        "avgIncome":          engine.avg("yearly_income",    df),
        "avgTenure":          engine.avg("years_at_company", df),
        "avgAge":             engine.avg("age", df),
        "overtimePct":        round((df["overtime"] == "Yes").sum() / len(df) * 100, 1),
        "satisfactionDist":   engine.count_by("job_satisfaction",  df),
        "wlbDist":            engine.count_by("work_life_balance",  df),
        "perfDist":           engine.count_by("performance_rating", df),
        "salaryAnalysis":     engine.salary_analysis(job_role=dept),
    }, f"{dept} analytics fetched")


# ── GET /api/v1/analytics/csv-employees ──────────────────────────────────────
# Paginated raw ML predictions list with Pandas filtering
@analytics_bp.get("/csv-employees")
@jwt_required()
def csv_employees():
    args    = request.args
    result  = _engine().employee_list(
        page      = int(args.get("page",  1)),
        limit     = int(args.get("limit", 20)),
        risk      = args.get("risk"),
        job_role  = args.get("jobRole"),
        job_level = args.get("jobLevel"),
        overtime  = args.get("overtime"),
        search    = args.get("search"),
    )
    from flask import jsonify
    from datetime import datetime, timezone
    import math
    return jsonify({
        "success":    True,
        "message":    "CSV employees fetched",
        "data":       result["data"],
        "pagination": {
            "total":      result["total"],
            "page":       result["page"],
            "limit":      result["limit"],
            "totalPages": result["totalPages"],
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


# ── GET /api/v1/analytics/salary-benchmark ───────────────────────────────────
@analytics_bp.get("/salary-benchmark")
@jwt_required()
def salary_benchmark():
    job_role  = request.args.get("jobRole")
    job_level = request.args.get("jobLevel")
    result    = _engine().salary_analysis(job_role=job_role, job_level=job_level)
    return success(result, "Salary benchmark fetched")


# ── GET /api/v1/analytics/tenure-analysis ────────────────────────────────────
@analytics_bp.get("/tenure-analysis")
@jwt_required()
def tenure_analysis():
    return success({"buckets": _engine().tenure_buckets()}, "Tenure analysis fetched")


# ── Report Export & Scheduling Endpoints ─────────────────────────────────────
# (Removed)


@analytics_bp.post("/authorize")
@jwt_required()
def create_authorization():
    data = request.get_json(silent=True) or {}
    dept = data.get("dept")
    amount = data.get("amount")
    if not dept or not amount:
        return error("dept and amount are required", 400)
        
    auth = InterventionAuth(
        dept=dept,
        amount=float(amount)
    )
    db.session.add(auth)
    db.session.commit()
    
    authorizations = InterventionAuth.query.order_by(InterventionAuth.created_at.desc()).all()
    return success({"authorizations": [a.to_dict() for a in authorizations]}, "Capital intervention authorized", 201)


@analytics_bp.get("/authorize")
@jwt_required()
def list_authorizations():
    authorizations = InterventionAuth.query.order_by(InterventionAuth.created_at.desc()).all()
    return success({"authorizations": [a.to_dict() for a in authorizations]}, "Authorizations fetched")


# ── POST /api/v1/analytics/simulate-risk ─────────────────────────────────────
@analytics_bp.post("/simulate-risk")
@jwt_required()
def simulate_risk():
    data = request.get_json(silent=True) or {}
    try:
        overtime_hrs = float(data.get("overtimeHrs", 0.0))
        salary_gap = float(data.get("salaryGap", 0.0))
        manager_feedback = float(data.get("managerFeedback", 7.0))
    except (ValueError, TypeError):
        return error("Invalid input parameter types. Must be numeric.", 400)

    # Dynamic What-If Risk Formula
    base_risk = 15.0
    if overtime_hrs > 10:
        base_risk += (overtime_hrs - 10) * 4
    if salary_gap < 0:
        base_risk += abs(salary_gap) * 2
    if manager_feedback < 7:
        base_risk += (7 - manager_feedback) * 6
    elif manager_feedback > 8:
        base_risk -= (manager_feedback - 8) * 3

    prob = min(max(base_risk, 5.0), 98.0)
    from app.services.attrition import risk_label
    status = risk_label(prob)
    
    # Estimate ROI metrics
    replacement_cost = 120000.0
    intervention_cost = 0.0
    if salary_gap < 0:
        intervention_cost += abs(salary_gap) * 800.0
    if overtime_hrs > 10:
        intervention_cost += 1500.0
        
    estimated_saving = max(replacement_cost - intervention_cost, 0.0)

    return success({
        "probability": round(prob, 2),
        "status": status,
        "replacementCost": replacement_cost,
        "interventionCost": intervention_cost,
        "roiSavings": estimated_saving
    }, "Risk simulation computed successfully")


# ── POST /api/v1/analytics/pre-hiring-simulate ──────────────────────────────
# (Removed)




# ── GET /api/v1/analytics/recommendation/<employee_id> ─────────────────────────
@analytics_bp.get("/recommendation/<employee_id>")
@jwt_required()
def get_recommendation(employee_id):
    import os
    import json
    import urllib.request
    from app.models.employee import Employee
    
    employee = Employee.query.filter_by(employee_id=employee_id).first()
    if not employee:
        employee = Employee.query.filter_by(employee_id=str(employee_id)).first()
        
    if not employee:
        return error("Employee not found", 404)
        
    from app.models.settings import SystemSetting
    key_setting = SystemSetting.query.filter_by(key="groqApiKey").first()
    api_key = key_setting.value if key_setting and key_setting.value else os.getenv("GROQ_API_KEY")
    
    ai_text = None
    if api_key:
        try:
            prompt = (
                f"Create a single-sentence action plan recommendation for this employee to mitigate their attrition risk. "
                f"Employee Name: {employee.name}, Job Role: {employee.role}, Department: {employee.dept}, "
                f"Risk Factor: {employee.primary_factor}, Risk Probability: {employee.probability}%, "
                f"Weekly Overtime: {employee.overtime_hrs} hours, Salary Gap: {employee.salary_gap}%, "
                f"Manager Feedback Score: {employee.manager_feedback}/10.\n"
                f"Provide ONLY the single-sentence recommendation text. Do not include any greeting or conversational filler. Keep it concise, actionable and under 30 words."
            )
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are an expert HR attrition mitigation agent. Respond with a single concise, actionable recommendation sentence."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            
            url = "https://api.groq.com/openai/v1/chat/completions"
            req_data = json.dumps(payload).encode("utf-8")
            
            req = urllib.request.Request(
                url, 
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    res_data = json.loads(response.read().decode("utf-8"))
                    ai_text = res_data["choices"][0]["message"]["content"].strip()
                    if ai_text.startswith('"') and ai_text.endswith('"'):
                        ai_text = ai_text[1:-1]
        except Exception as e:
            print(f"[recommendation] Groq request failed: {e}")
            
    if not ai_text:
        factor = employee.primary_factor
        name = employee.name
        if factor == 'Workload & Overtime':
            ai_text = f"Reduce weekly overtime. Reallocate task distribution and schedule a mandatory 1-on-1 check-in with {name} to balance project workload."
        elif factor == 'Role Stagnation':
            ai_text = f"Schedule a career pathing alignment meeting. Establish clear milestones for promotion and assign a senior mentor to help {name} upskill."
        elif factor == 'Feedback Loop Issues':
            ai_text = f"Improve manager feedback cycles. Implement anonymous feedback channels and conduct weekly performance alignment sessions with {name}."
        elif factor == 'Compensation Gap':
            ai_text = f"Conduct an urgent salary calibration review. Align {name}'s salary with regional market benchmarks and evaluate a retention bonus."
        elif factor == 'Onboarding Friction':
            ai_text = f"Enhance onboarding support. Assign a peer buddy and schedule structured check-ins at 30, 60, and 90 days to ease {name}'s transition."
        else:
            ai_text = f"Schedule a structured check-in with {name} to discuss retention strategies and custom career adjustments."
            
    return success({"recommendation": ai_text}, "Recommendation generated successfully")


@analytics_bp.get("/retention-tracker")
@jwt_required()
def get_retention_tracker():
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    
    total = Employee.query.filter_by(is_active=True, organization_id=org_id).count()
    executed_playbooks = Employee.query.filter_by(is_active=True, playbook_status="Executed", organization_id=org_id).count()
    
    # Calculate savings
    saved_count = max(1, round(executed_playbooks * 0.75))
    replacement_cost_avg = 32000.0 # Average replacement cost per employee
    total_savings = saved_count * replacement_cost_avg
    
    return success({
        "metrics": {
            "activeCampaigns": executed_playbooks,
            "successRate": 78,
            "employeesSaved": saved_count,
            "totalSavings": total_savings,
            "hiringCostMitigated": saved_count * 8000.0
        },
        "campaigns": [
            {"id": "camp-1", "name": "Q2 Compensation Benchmarking", "status": "Completed", "impact": "+14% retention"},
            {"id": "camp-2", "name": "Engineering Overtime Cap", "status": "Active", "impact": "Pending verification"},
            {"id": "camp-3", "name": "Manager 1-on-1 Feedback Calibration", "status": "Completed", "impact": "+22% feedback satisfaction"}
        ]
    }, "Retention tracking metrics fetched")








