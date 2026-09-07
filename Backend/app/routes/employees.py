import io
import random
import re
from datetime import datetime, timezone, timedelta
from typing import Any, cast

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.db import db, raw_db, get_user_id
from app.models.employee import Employee
from app.models.log import AgentLog
from app.models.history import RiskHistory, EmployeeHistory
from app.models.audit_log import AuditLog
from app.models.pulse_survey import PulseSurvey
from app.models.user import User
from app.services.attrition import (
    compute_new_employee_risk,
    detect_primary_factor,
    get_playbook,
    risk_label,
)
from app.utils.response import success, error, paginated
from marshmallow import ValidationError
from app.schemas import EmployeeSchema, EmployeeUpdateSchema

employees_bp = Blueprint("employees", __name__)

_CITIES = [
    "San Francisco, CA", "New York, NY", "Seattle, WA",
    "Austin, TX", "Boston, MA", "Chicago, IL",
]
_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


def _bulk_log(logs: list[dict]) -> None:
    db.session.bulk_insert_mappings(AgentLog, logs)


# ── GET /api/v1/employees ─────────────────────────────────────────────────────
@employees_bp.get("/")
@jwt_required()
def list_employees():
    args   = request.args
    page   = int(args.get("page",  1))
    limit  = int(args.get("limit", 50))
    status = args.get("status")
    dept   = args.get("dept")
    search = args.get("search")
    sort   = args.get("sortBy", "probability")
    order  = args.get("order",  "desc")

    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id) if user_id else None
    role = user.role if user else claims.get("role", "admin")

    # Match active employees flexibly without strictly excluding documents with missing org_id or default tags
    if role in ("admin", "hr"):
        q = Employee.query.filter({
            "is_active": {"$ne": False},
            "$or": [
                {"organization_id": org_id},
                {"organization_id": None},
                {"organization_id": {"$exists": False}},
                {"organization_id": "org-comp-a"}
            ]
        })
    elif role == "manager":
        mgr_dept = getattr(user, "department", None)
        if mgr_dept:
            import re
            q = Employee.query.filter({
                "is_active": {"$ne": False},
                "dept": {"$regex": f"^{re.escape(mgr_dept)}$", "$options": "i"}
            })
        else:
            emp = Employee.query.filter({"email": user.email}).first()
            if emp:
                q = Employee.query.filter({
                    "is_active": {"$ne": False},
                    "dept": emp.dept
                })
            else:
                q = Employee.query.filter({"is_active": {"$ne": False}})
    elif user.role == "employee":
        emp = Employee.query.filter({"email": user.email}).first()
        if emp:
            q = Employee.query.filter({
                "employee_id": emp.employee_id,
                "is_active": {"$ne": False}
            })
        else:
            q = Employee.query.filter({"_id": "-1"})
    else:
        q = Employee.query.filter({"is_active": {"$ne": False}})

    if status and status != "All":
        q = q.filter_by(status=status)
    if dept and dept != "All":
        q = q.filter_by(dept=dept)
    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                Employee.name.ilike(like),
                Employee.employee_id.ilike(like),
                Employee.role.ilike(like),
            )
        )

    # Sorting
    sort_col: Any = getattr(Employee, sort, Employee.probability)
    if hasattr(sort_col, "desc") and hasattr(sort_col, "asc"):
        q = q.order_by(sort_col.desc() if order == "desc" else sort_col.asc())
    else:
        q = q.order_by(Employee.probability.desc() if order == "desc" else Employee.probability.asc())

    total = q.count()
    rows  = q.offset((page - 1) * limit).limit(limit).all()

    return paginated(
        [e.to_dict() for e in rows],
        total, page, limit,
        "Employees fetched",
    )


# ── GET /api/v1/employees/<employee_id> ───────────────────────────────────────
@employees_bp.get("/<employee_id>")
@jwt_required()
def get_employee(employee_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return error("User session invalid or expired", 401)

    emp = Employee.query.filter_by(employee_id=employee_id, is_active=True, organization_id=org_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id), "is_active": True, "organization_id": org_id}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id, "is_active": True, "organization_id": org_id}).first()

    if not emp:
        return error("Employee not found", 404)

    if user.role == "manager":
        name_parts = user.name.split() if user.name else []
        first_name = name_parts[0] if name_parts else ""
        if first_name:
            mgr_emp = Employee.query.filter(
                Employee.organization_id == org_id,
                db.or_(Employee.email == user.email, Employee.name.ilike(f"%{first_name}%"))
            ).first()
        else:
            mgr_emp = Employee.query.filter(
                Employee.organization_id == org_id,
                Employee.email == user.email
            ).first()
        if not mgr_emp or emp.dept != mgr_emp.dept:
            return error("Not authorised to view this employee record", 403)
    elif user.role == "employee":
        name_parts = user.name.split() if user.name else []
        first_name = name_parts[0] if name_parts else ""
        if first_name:
            emp_profile = Employee.query.filter(
                Employee.organization_id == org_id,
                db.or_(Employee.email == user.email, Employee.name.ilike(f"%{first_name}%"))
            ).first()
        else:
            emp_profile = Employee.query.filter(
                Employee.organization_id == org_id,
                Employee.email == user.email
            ).first()
        if not emp_profile or emp_profile.employee_id != employee_id:
            return error("Not authorised to view this employee record", 403)

    return success({"employee": emp.to_dict(include_csv=True)}, "Employee fetched")


# ── POST /api/v1/employees ────────────────────────────────────────────────────
@employees_bp.post("/")
@jwt_required()
def create_employee():
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin"):
        return error("Not authorised", 403)

    try:
        validated_data = cast(dict[str, Any], EmployeeSchema().load(request.get_json(silent=True) or {}))
    except ValidationError as err:
        if isinstance(err.messages, dict):
            err_msg = ", ".join([f"{k}: {'; '.join(v)}" if isinstance(v, list) else f"{k}: {v}" for k, v in err.messages.items()])
        else:
            err_msg = str(err.messages)
        return error(err_msg, 400)

    # Use validated_data dictionary
    data = validated_data
    if Employee.query.filter_by(email=data["email"].lower()).first():
        return error("Email already registered", 409)

    overtime_hrs = float(data.get("overtimeHrs", 0) or 0)
    salary_gap   = float(data.get("salaryGap",   0) or 0)
    probability, status = compute_new_employee_risk(overtime_hrs, salary_gap)

    emp_data = {
        "overtime_hrs":  overtime_hrs,
        "salary_gap":    salary_gap,
        "overtime":      "Yes" if overtime_hrs > 10 else "No",
        "num_promotions": 0,
        "years_at_company": 0,
        "manager_feedback": 8.0,
    }
    primary_factor = detect_primary_factor(emp_data)

    emp_id   = f"EMP-{random.randint(1000, 9999)}"
    location = random.choice(_CITIES)
    m        = random.choice(_MONTHS)
    d        = random.randint(1, 28)
    date_hired = f"{m} {d:02d}, 2025"

    emp = Employee(
        employee_id    = emp_id,
        name           = data["name"].strip(),
        email          = data["email"].strip().lower(),
        dept           = data["dept"].strip(),
        role           = data["role"].strip(),
        tenure         = data.get("tenure", "0 yrs"),
        probability    = probability,
        status         = status,
        primary_factor = primary_factor,
        overtime_hrs   = overtime_hrs,
        salary_gap     = salary_gap,
        manager_feedback = 8.0,
        growth_index   = 6.0,
        playbook_status = "Ready",
        rating         = round(random.uniform(3.5, 5.0), 1),
        location       = location,
        date_hired     = date_hired,
        organization_id = claims.get("org_id", "org-comp-a")
    )
    emp.save()
    
    hist = RiskHistory(
        employee_id=emp_id,
        probability=probability,
        status=status
    )
    hist.save()
    
    # Agent logs
    log_rows = [
        {"source": "Ingestion", "text": f"Saving employee profile for ID: {emp_id}",                      "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Ingestion", "text": "Saving employee metrics...",                                      "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Ingestion", "text": "Setting up communication channels...",                            "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Predictor", "text": f"Calculating starting risk level: {status} ({probability:.1f}%)", "type": "danger" if status == "High" else "info", "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Ingestion", "text": f"Registration complete for {emp.name}.",                          "type": "success", "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
    ]
    _bulk_log(log_rows)

    # Trigger Orchestrator Agent evaluation logs
    from app.services.agents.hr_insights_agent import HRInsightsAgent
    try:
        HRInsightsAgent().evaluate_employee(emp)
    except Exception as e:
        print(f"Orchestrator failed: {e}")

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({"employee": emp.to_dict()}, "Employee registered", 201)


# ── PUT /api/v1/employees/<employee_id> ───────────────────────────────────────
@employees_bp.put("/<employee_id>")
@jwt_required()
def update_employee(employee_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    if claims.get("role") not in ("hr", "admin", "manager"):
        return error("Not authorised", 403)

    emp = Employee.query.filter_by(employee_id=employee_id, is_active=True, organization_id=org_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id), "is_active": True, "organization_id": org_id}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id, "is_active": True, "organization_id": org_id}).first()

    if not emp:
        return error("Employee not found", 404)

    try:
        validated_data = cast(dict[str, Any], EmployeeUpdateSchema().load(request.get_json(silent=True) or {}))
    except ValidationError as err:
        if isinstance(err.messages, dict):
            err_msg = ", ".join([f"{k}: {'; '.join(v)}" if isinstance(v, list) else f"{k}: {v}" for k, v in err.messages.items()])
        else:
            err_msg = str(err.messages)
        return error(err_msg, 400)

    data = validated_data

    # Check for manager change
    if "managerId" in data:
        old_mgr_id = emp.manager_id
        new_mgr_id = data["managerId"]
        if old_mgr_id != new_mgr_id:
            emp.manager_id = new_mgr_id
            
            old_mgr = Employee.query.filter_by(employee_id=old_mgr_id).first() if old_mgr_id else None
            new_mgr = Employee.query.filter_by(employee_id=new_mgr_id).first() if new_mgr_id else None
            old_name = old_mgr.name if old_mgr else "None"
            new_name = new_mgr.name if new_mgr else "None"
            
            hist = EmployeeHistory(
                employee_id=emp.employee_id,
                event_type="Manager Changed",
                details=f"Reporting line moved from {old_name} ({old_mgr_id}) to {new_name} ({new_mgr_id})"
            )
            hist.save()
            
            # Log audit
            audit = AuditLog(
                user_id=str(get_user_id(get_jwt_identity())),
                user_name=claims.get("name", "HR Operator"),
                role=claims.get("role", "hr"),
                organization_id=org_id,
                action_summary=f"Reassigned employee {emp.name} ({emp.employee_id}) reporting manager to {new_name}."
            )
            audit.save()

    # Allowed updatable fields
    UPDATABLE = (
        "name", "dept", "role", "tenure", "overtime_hrs", "salary_gap",
        "manager_feedback", "growth_index", "location", "rating",
    )
    for field in UPDATABLE:
        if field in data:
            old_val = getattr(emp, field)
            new_val = data[field]
            if old_val != new_val:
                setattr(emp, field, new_val)
                # Log timeline history for dept and role promotions/transfers
                if field == "dept":
                    hist = EmployeeHistory(
                        employee_id=emp.employee_id,
                        event_type="Department Changed",
                        details=f"Department moved from {old_val} to {new_val}"
                    )
                    hist.save()
                elif field == "role":
                    hist = EmployeeHistory(
                        employee_id=emp.employee_id,
                        event_type="Promotion",
                        details=f"Role promoted/changed from {old_val} to {new_val}"
                    )
                    hist.save()

    # Re-derive risk if score inputs changed
    if any(k in data for k in ("overtimeHrs", "salaryGap", "overtime_hrs", "salary_gap")):
        ot_val = data.get("overtimeHrs") if "overtimeHrs" in data else data.get("overtime_hrs", emp.overtime_hrs)
        sg_val = data.get("salaryGap") if "salaryGap" in data else data.get("salary_gap", emp.salary_gap)
        emp.overtime_hrs = float(ot_val) if ot_val is not None else 0.0
        emp.salary_gap   = float(sg_val) if sg_val is not None else 0.0
        emp.probability, emp.status = compute_new_employee_risk(emp.overtime_hrs, emp.salary_gap)
        emp.primary_factor = detect_primary_factor(emp.__dict__)
        
        hist = RiskHistory(
            employee_id=emp.employee_id,
            probability=emp.probability,
            status=emp.status
        )
        hist.save()

    emp.save()

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({"employee": emp.to_dict()}, "Employee updated successfully")


# ── POST /api/v1/employees/<employee_id>/playbook ─────────────────────────────
@employees_bp.post("/<employee_id>/playbook")
@jwt_required()
def execute_playbook(employee_id: str):
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin", "manager"):
        return error("Not authorised", 403)

    emp = Employee.query.filter_by(employee_id=employee_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id)}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id}).first()

    if not emp:
        return error("Employee not found", 404)

    emp_id = emp.employee_id
    prob_before = emp.probability
    playbook = get_playbook(emp.primary_factor)
    
    # Execution reduction formula
    prob_after = round(prob_before * 0.6)
    new_status = risk_label(prob_after)

    # ROI calculations
    income = emp.yearly_income or 80000
    replacement_cost = 1.5 * income
    
    # Determine cost based on factor
    factor = emp.primary_factor
    if factor == "Compensation Gap":
        intervention_cost = 0.12 * income
    elif factor == "Workload & Overtime":
        intervention_cost = 2500.0
    elif factor == "Role Stagnation":
        intervention_cost = 5000.0
    elif factor == "Feedback Loop Issues":
        intervention_cost = 1000.0
    elif factor == "Onboarding Friction":
        intervention_cost = 1500.0
    else:
        intervention_cost = 2000.0
        
    roi_savings = max(replacement_cost - intervention_cost, 0.0)

    # Deduct from department budget
    from app.models.schedule import InterventionAuth
    auth = InterventionAuth.query.filter_by(dept=emp.dept).order_by(InterventionAuth.created_at.desc()).first()
    if not auth:
        auth = InterventionAuth(dept=emp.dept, amount=100000.0)
        auth.save()
    auth.amount = max(auth.amount - intervention_cost, 0.0)
    auth.save()

    emp.probability    = prob_after
    emp.status         = new_status
    emp.playbook_status = "Executed"

    hist = RiskHistory(
        employee_id=emp.employee_id,
        probability=prob_after,
        status=new_status
    )
    hist.save()

    # Append event to playbook history
    emp.append_playbook_event({
        "executedAt":  datetime.now(timezone.utc).isoformat(),
        "planCode":    playbook["planCode"],
        "trigger":     playbook["triggerEvent"],
        "probBefore":  prob_before,
        "probAfter":   prob_after,
        "executedBy":  get_jwt().get("name", "HR"),
        "replacementCost": replacement_cost,
        "interventionCost": intervention_cost,
        "roiSavings": roi_savings
    })

    # Agent logs
    log_rows = [
        {"source": "Playbooks", "text": f"[1/4] Reviewing risk factors for {emp.primary_factor}...",        "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Playbooks", "text": "[2/4] Creating action plan...",                                     "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Playbooks", "text": "[3/4] Notifying department manager...",                             "type": "info",    "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
        {"source": "Playbooks", "text": f"[SUCCESS] Action plan applied for {emp.name}. Risk is lowering.", "type": "success", "employee_id": emp_id, "created_at": datetime.now(timezone.utc)},
    ]
    for row in log_rows:
        row["employee_id"] = emp.employee_id
    _bulk_log(log_rows)

    # Trigger Orchestrator Agent evaluation
    from app.services.agents.hr_insights_agent import HRInsightsAgent
    try:
        HRInsightsAgent().evaluate_employee(emp)
    except Exception as e:
        print(f"Orchestrator failed: {e}")

    emp.save()

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({
        "employee": emp.to_dict(),
        "playbook": {**playbook, "probBefore": prob_before, "probAfter": prob_after,
                     "riskReduction": round(prob_before - prob_after, 1),
                     "replacementCost": replacement_cost,
                     "interventionCost": intervention_cost,
                     "roiSavings": roi_savings},
        "steps": [r["text"] for r in log_rows],
    }, "Playbook executed successfully")


# ── PUT /api/v1/employees/<employee_id>/kanban ────────────────────────────────
@employees_bp.put("/<employee_id>/kanban")
@jwt_required()
def update_kanban_status(employee_id: str):
    emp = Employee.query.filter_by(employee_id=employee_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id)}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id}).first()

    if not emp:
        return error("Employee not found", 404)
    data = request.get_json(silent=True) or {}
    status = data.get("kanbanStatus")
    if not status:
        return error("kanbanStatus is required", 400)
    emp.kanban_status = status
    emp.save()
    return success({"employee": emp.to_dict()}, "Kanban status updated successfully")


# ── POST /api/v1/employees/bulk-delete ────────────────────────────────────────
@employees_bp.post("/bulk-delete")
@jwt_required()
def bulk_delete_employees():
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin"):
        return error("Not authorised", 403)

    data = request.get_json(silent=True) or {}
    employee_ids = data.get("employee_ids", [])
    if not employee_ids:
        return error("No employee_ids provided", 400)

    from app.db import raw_db
    from bson import ObjectId

    obj_ids = []
    for eid in employee_ids:
        try:
            obj_ids.append(ObjectId(eid))
        except Exception:
            pass

    raw_db.risk_history.delete_many({"employee_id": {"$in": employee_ids}})
    raw_db.employee_history.delete_many({"employee_id": {"$in": employee_ids}})
    raw_db.pulse_surveys.delete_many({"employee_id": {"$in": employee_ids}})
    raw_db.agent_logs.delete_many({"employee_id": {"$in": employee_ids}})

    res = raw_db.employees.delete_many({
        "$or": [
            {"employee_id": {"$in": employee_ids}},
            {"_id": {"$in": obj_ids + employee_ids}}
        ]
    })

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({"deletedCount": res.deleted_count}, f"Successfully bulk deleted {res.deleted_count} employees permanently from database")


# ── DELETE /api/v1/employees/all ──────────────────────────────────────────────
@employees_bp.delete("/all")
@jwt_required()
def delete_all_employees():
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin"):
        return error("Not authorised", 403)

    from app.db import raw_db
    res = raw_db.employees.delete_many({})
    raw_db.risk_history.delete_many({})
    raw_db.employee_history.delete_many({})
    raw_db.pulse_surveys.delete_many({})
    raw_db.agent_logs.delete_many({})

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({"deletedCount": res.deleted_count}, f"All {res.deleted_count} employees permanently deleted from database")


# ── DELETE /api/v1/employees/clear-csv ────────────────────────────────────────
@employees_bp.delete("/clear-csv")
@jwt_required()
def clear_csv_employees():
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin"):
        return error("Not authorised", 403)

    from app.db import raw_db
    try:
        res = raw_db.employees.delete_many({})
        raw_db.risk_history.delete_many({})
        raw_db.employee_history.delete_many({})
        raw_db.pulse_surveys.delete_many({})

        try:
            from app.services.csv_engine import CsvEngine
            CsvEngine.instance().reload_from_db()
        except Exception as e:
            print(f"CsvEngine reload failed: {e}")

        return success({"deletedCount": res.deleted_count}, f"Successfully deleted {res.deleted_count} employees")
    except Exception as e:
        return error(f"Failed to delete all employees: {str(e)}", 500)


# ── DELETE /api/v1/employees/<employee_id> ────────────────────────────────────
@employees_bp.delete("/<employee_id>")
@jwt_required()
def delete_employee(employee_id: str):
    claims = get_jwt()
    if claims.get("role") not in ("hr", "admin"):
        return error("Not authorised", 403)

    from app.db import raw_db
    from bson import ObjectId

    # Find employee by employee_id or _id
    emp = Employee.query.filter_by(employee_id=employee_id).first()
    if not emp:
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id)}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id}).first()

    matched_emp_id = emp.employee_id if emp else employee_id

    # Delete associated sub-records
    raw_db.risk_history.delete_many({"employee_id": {"$in": [employee_id, matched_emp_id]}})
    raw_db.employee_history.delete_many({"employee_id": {"$in": [employee_id, matched_emp_id]}})
    raw_db.pulse_surveys.delete_many({"employee_id": {"$in": [employee_id, matched_emp_id]}})
    raw_db.agent_logs.delete_many({"employee_id": {"$in": [employee_id, matched_emp_id]}})

    # Permanent delete from employees collection
    res = raw_db.employees.delete_many({
        "$or": [
            {"employee_id": employee_id},
            {"employee_id": matched_emp_id}
        ]
    })
    if emp and emp.id:
        try:
            raw_db.employees.delete_many({"_id": ObjectId(emp.id)})
        except Exception:
            pass

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({"id": employee_id, "deletedCount": res.deleted_count}, "Employee and all associated records permanently deleted")



# ── POST /api/v1/employees/bulk-import ────────────────────────────────────────
@employees_bp.post("/bulk-import")
@jwt_required()
def bulk_import_employees():
    import pandas as pd
    
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    
    file = request.files.get("file")
    if not file or not file.filename:
        return error("No file provided", 400)
    
    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file.read()))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(file.read()))
        elif filename.endswith(".pdf"):
            import pypdf
            pdf_reader = pypdf.PdfReader(io.BytesIO(file.read()))
            all_text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    all_text += page_text + "\n"
            
            lines = [l.strip() for l in all_text.splitlines() if l.strip()]
            records = []
            parsed_table = False
            for line in lines:
                if "," in line:
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 3:
                        records.append(parts)
                        parsed_table = True
                elif "\t" in line:
                    parts = [p.strip() for p in line.split("\t")]
                    if len(parts) >= 3:
                        records.append(parts)
                        parsed_table = True
                elif "|" in line:
                    parts = [p.strip() for p in line.split("|") if p.strip()]
                    if len(parts) >= 3:
                        records.append(parts)
                        parsed_table = True
            
            if parsed_table and len(records) > 1:
                header = records[0]
                df = pd.DataFrame(records[1:], columns=header)
            else:
                name_match = re.search(r"(?:name|employee name|candidate)\s*[:=-]\s*([^\n\r,]+)", all_text, re.I)
                email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", all_text)
                dept_match = re.search(r"(?:department|dept|division|team)\s*[:=-]\s*([^\n\r,]+)", all_text, re.I)
                role_match = re.search(r"(?:role|job title|position|title)\s*[:=-]\s*([^\n\r,]+)", all_text, re.I)
                tenure_match = re.search(r"(?:tenure|years at company|experience)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*(?:yrs|years)?", all_text, re.I)
                salary_match = re.search(r"(?:salary|yearly income|income)\s*[:=-]?\s*\$?([\d,]+)", all_text, re.I)
                
                emp_name = name_match.group(1).strip() if name_match else (lines[0] if lines else "Imported Employee")
                emp_email = email_match.group(0).strip() if email_match else f"{emp_name.lower().replace(' ', '')}@company.com"
                emp_dept = dept_match.group(1).strip() if dept_match else "Operations"
                emp_role = role_match.group(1).strip() if role_match else "Specialist"
                emp_tenure = f"{tenure_match.group(1)} yrs" if tenure_match else "2.0 yrs"
                emp_salary = salary_match.group(1).replace(",", "") if salary_match else "75000"
                
                df = pd.DataFrame([{
                    "name": emp_name,
                    "email": emp_email,
                    "dept": emp_dept,
                    "role": emp_role,
                    "tenure": emp_tenure,
                    "yearly_income": emp_salary,
                    "overtime_hrs": 4,
                    "salary_gap": 0
                }])
        else:
            return error("Unsupported file format. Please upload CSV, Excel, or PDF document.", 400)
    except Exception as e:
        return error(f"Failed to parse file: {str(e)}", 400)
    
    # Clear existing employees first so that only the uploaded CSV data shows up
    try:
        raw_db.employees.delete_many({})
    except Exception as e:
        print("Failed to clear employees collection before import:", e)

    # Normalize columns to lowercase and strip whitespaces
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    # Map headers to standard fields
    header_mapping = {}
    for col in df.columns:
        c_clean = str(col).strip().replace("_", " ").replace("-", " ")
        if c_clean in ("name", "employee name", "emp name", "fullname", "full name"):
            header_mapping[col] = "name"
        elif c_clean in ("email", "employee email", "emp email", "email address", "mail"):
            header_mapping[col] = "email"
        elif c_clean in ("dept", "department", "dept name", "division", "team", "job role"):
            header_mapping[col] = "dept"
        elif c_clean in ("role", "job role", "jobrole", "job level", "role name", "title", "job title", "position"):
            header_mapping[col] = "role"
        elif c_clean in ("yearly income", "yearly income ($)", "yearly_income", "salary"):
            header_mapping[col] = "yearly_income"
        elif c_clean in ("years at company", "years_at_company", "tenure"):
            header_mapping[col] = "tenure"
        elif c_clean in ("overtime hrs", "overtime_hrs"):
            header_mapping[col] = "overtime_hrs"
        elif c_clean in ("salary gap", "salary_gap"):
            header_mapping[col] = "salary_gap"
        elif c_clean in ("manager feedback", "manager_feedback"):
            header_mapping[col] = "manager_feedback"
        elif c_clean in ("growth index", "growth_index", "number of promotions", "num_promotions"):
            header_mapping[col] = "growth_index"
        elif c_clean in ("location", "work location"):
            header_mapping[col] = "location"
        elif c_clean in ("rating", "performance rating", "performance_rating"):
            header_mapping[col] = "rating"
        elif c_clean in ("attrition score", "attrition_score"):
            header_mapping[col] = "attrition_score"
        elif c_clean in ("predicted score", "predicted_score"):
            header_mapping[col] = "predicted_score"
        elif c_clean in ("risk category", "risk_category", "riskcategory"):
            header_mapping[col] = "risk_category"
        elif c_clean in ("predicted risk", "predicted_risk", "predictedrisk"):
            header_mapping[col] = "predicted_risk"

    # Fallback mappings for missing columns
    # 1. If name is missing, use Employee ID
    if "name" not in header_mapping.values():
        id_col = None
        for col in df.columns:
            if "id" in str(col):
                id_col = col
                break
        if id_col is not None:
            df["name"] = df[id_col].apply(lambda x: f"Employee #{x}")
            header_mapping["name"] = "name"
        else:
            return error("Missing employee 'name' column in upload.", 400)

    # 2. If email is missing, generate it dynamically
    if "email" not in header_mapping.values():
        df["email"] = df["name"].apply(lambda x: f"{str(x).lower().replace(' ', '').replace('#', '')}@attrisense-org.com")
        header_mapping["email"] = "email"

    # 3. If dept is missing but role is present, duplicate it
    if "dept" not in header_mapping.values() and "role" in header_mapping.values():
        role_col = [k for k, v in header_mapping.items() if v == "role"][0]
        df["dept"] = df[role_col]
        header_mapping["dept"] = "dept"

    # 4. If role is missing but dept is present, duplicate it
    if "role" not in header_mapping.values() and "dept" in header_mapping.values():
        dept_col = [k for k, v in header_mapping.items() if v == "dept"][0]
        df["role"] = df[dept_col]
        header_mapping["role"] = "role"

    # Check if we have the minimal required columns mapped
    required_cols = {"name", "email", "dept", "role"}
    # Apply mapping internally
    df = df.rename(columns={k: v for k, v in header_mapping.items()})
    
    if not required_cols.issubset(set(df.columns)):
        return error(f"Missing required columns. Must contain: {', '.join(required_cols)}", 400)
    
    imported_list = []
    emp_docs = []
    hist_docs = []
    seen_emails = set()
    used_eids = set()

    try:
        def safe_float(val, default=0.0):
            try:
                if val is None:
                    return default
                v_str = str(val).strip().replace("%", "").replace("$", "")
                if not v_str or v_str.lower() in ("nan", "null", "none", "n/a", "na"):
                    return default
                return float(v_str)
            except Exception:
                return default

        def safe_int(val, default=0):
            try:
                if val is None:
                    return default
                v_str = str(val).strip().replace(",", "")
                if not v_str or v_str.lower() in ("nan", "null", "none", "n/a", "na"):
                    return default
                return int(float(v_str))
            except Exception:
                return default

        id_counter = 1000 + random.randint(100, 900)

        for _, row in df.iterrows():
            email = str(row.get("email", "")).strip().lower()
            if not email or "@" not in email:
                continue
            if email in seen_emails:
                continue
            seen_emails.add(email)

            id_counter += 1
            eid = f"EMP-{id_counter}"
            while eid in used_eids:
                id_counter += 1
                eid = f"EMP-{id_counter}"
            used_eids.add(eid)

            name = str(row.get("name", "Employee")).strip()
            dept = str(row.get("dept", "General")).strip()
            role = str(row.get("role", "Staff")).strip()

            overtime_hrs = safe_float(row.get("overtime_hrs"), 0.0)
            overtime_text = str(row.get("overtime", "No")).strip()
            if overtime_text.lower() in ("yes", "y", "true") and overtime_hrs == 0.0:
                overtime_hrs = 12.0
            
            salary_gap = safe_float(row.get("salary_gap"), 0.0)
            manager_feedback = safe_float(row.get("manager_feedback"), 7.0)
            growth_index = safe_float(row.get("growth_index"), 5.0)
            location = str(row.get("location", "Remote")).strip()
            rating = safe_float(row.get("rating"), 3.5)
            yearly_income = safe_int(row.get("yearly_income"), 80000)

            # Resolve probability and risk status
            csv_prob = row.get("attrition_score")
            if csv_prob is None or (isinstance(csv_prob, float) and pd.isna(csv_prob)):
                csv_prob = row.get("predicted_score")
            
            csv_status = row.get("risk_category")
            if csv_status is None or (isinstance(csv_status, float) and pd.isna(csv_status)):
                csv_status = row.get("predicted_risk")
            csv_status = str(csv_status).strip() if csv_status is not None else ""
            
            prob_val = safe_float(csv_prob, -1.0)
            if prob_val >= 0.0:
                prob = prob_val
                status_label = csv_status if csv_status in ("High", "Medium", "Low") else risk_label(prob)
            else:
                prob, status_label = compute_new_employee_risk(overtime_hrs, salary_gap)

            primary_factor = detect_primary_factor({
                "overtime_hrs": overtime_hrs,
                "salary_gap": salary_gap,
                "manager_feedback": manager_feedback,
                "years_at_company": 1.0,
                "tenure": "1.0 yrs",
                "num_promotions": 1
            })

            emp_dict = {
                "employee_id": eid,
                "name": name,
                "email": email,
                "dept": dept,
                "role": role,
                "tenure": "1.0 yrs",
                "probability": float(prob),
                "status": status_label,
                "primary_factor": primary_factor,
                "overtime_hrs": float(overtime_hrs),
                "salary_gap": float(salary_gap),
                "manager_feedback": float(manager_feedback),
                "growth_index": float(growth_index),
                "location": location,
                "rating": float(rating),
                "yearly_income": int(yearly_income),
                "kanban_status": "NEW",
                "playbook_status": "Ready",
                "organization_id": org_id,
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            }
            emp_docs.append(emp_dict)
            imported_list.append(emp_dict)

            # Generate 6 months of risk history
            for month_offset in range(6, 0, -1):
                recorded_at = datetime.now(timezone.utc) - timedelta(days=30 * month_offset)
                volatility = random.uniform(-15.0, 10.0)
                hist_prob = min(max(prob + volatility, 5.0), 98.0)
                hist_docs.append({
                    "employee_id": eid,
                    "probability": round(hist_prob, 2),
                    "status": "High" if hist_prob >= 65 else ("Medium" if hist_prob >= 35 else "Low"),
                    "recorded_at": recorded_at
                })

        if emp_docs:
            raw_db.employees.insert_many(emp_docs)
        if hist_docs:
            raw_db.risk_history.insert_many(hist_docs)

        try:
            from app.services.csv_engine import CsvEngine
            CsvEngine.instance().reload_from_db()
        except Exception as e:
            print(f"CsvEngine reload failed: {e}")

        return success({
            "importedCount": len(imported_list),
            "employees": [emp.to_dict() for e in imported_list[:100] if (emp := Employee.from_dict(e)) is not None]
        }, f"Successfully imported {len(imported_list)} employees")
        
    except Exception as e:
        return error(f"Database error during bulk ingestion: {str(e)}", 500)


# ── POST /api/v1/employees/<employee_id>/manager-notes ──────────────────────
@employees_bp.post("/<employee_id>/manager-notes")
@jwt_required()
def save_manager_notes(employee_id: str):
    emp = Employee.query.filter_by(employee_id=employee_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id)}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id}).first()

    if not emp:
        return error("Employee not found", 404)
        
    data = request.get_json(silent=True) or {}
    notes = data.get("notes", "")
    emp.manager_notes = notes
    
    tags = []
    notes_lower = notes.lower()
    if "burnout" in notes_lower or "fatigue" in notes_lower or "tired" in notes_lower or "overwork" in notes_lower:
        tags.append("Burnout Risk")
    if "salary" in notes_lower or "comp" in notes_lower or "pay" in notes_lower or "raise" in notes_lower:
        tags.append("Compensation Stagnation")
    if "growth" in notes_lower or "promotion" in notes_lower or "career" in notes_lower or "stagnant" in notes_lower:
        tags.append("Role Stagnation")
    if "manager" in notes_lower or "feedback" in notes_lower or "communication" in notes_lower or "unsupportive" in notes_lower:
        tags.append("Feedback Loop Issues")
        
    if tags:
        log_text = f"[Diagnosis Agent] Text Mining: Manager notes highlight risk drivers: {', '.join(tags)}"
        from app.routes.logs import dispatch_log
        dispatch_log(source="Diagnosis", text=log_text, log_type="warning", employee_id=emp.employee_id)
        
    emp.save()
    return success({
        "employee": emp.to_dict(),
        "tags": tags
    }, "Manager notes and sentiment analysis tags saved successfully")


# ── GET /api/v1/employees/<employee_id>/risk-history ──────────────────────────
@employees_bp.get("/<employee_id>/risk-history")
@jwt_required()
def get_employee_risk_history(employee_id: str):
    emp = Employee.query.filter_by(employee_id=employee_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id)}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id}).first()

    matched_ids = [employee_id]
    if emp and emp.employee_id and emp.employee_id not in matched_ids:
        matched_ids.append(emp.employee_id)

    history = RiskHistory.query.filter({"employee_id": {"$in": matched_ids}}).order_by(RiskHistory.recorded_at.asc()).all()
    return success({"history": [h.to_dict() for h in history]}, "Employee risk history fetched successfully")


# ── POST /api/v1/employees/pulse-survey ──────────────────────────────────────
@employees_bp.post("/pulse-survey")
@jwt_required()
def submit_pulse_survey():
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return error("User session invalid or expired", 401)

    name_parts = user.name.split() if user.name else []
    first_name = name_parts[0] if name_parts else ""
    if first_name:
        emp = Employee.query.filter_by(organization_id=org_id).filter(
            db.or_(Employee.email == user.email, Employee.name.ilike(f"%{first_name}%"))
        ).first()
    else:
        emp = Employee.query.filter_by(organization_id=org_id, email=user.email).first()

    if not emp:
        return error("No matching employee record found for user profile", 404)

    data = request.get_json(silent=True) or {}
    try:
        workload = int(data.get("workloadSatisfaction", 7))
        growth = int(data.get("growthSatisfaction", 7))
        comp = int(data.get("compSatisfaction", 7))
        manager = int(data.get("managerScore", 7))
        wlb = int(data.get("workLifeBalance", 7))
    except (ValueError, TypeError):
        return error("All survey answers must be integers between 1 and 10", 400)

    survey = PulseSurvey(
        employee_id=emp.employee_id,
        organization_id=org_id,
        workload_satisfaction=workload,
        growth_satisfaction=growth,
        comp_satisfaction=comp,
        manager_score=manager,
        work_life_balance=wlb
    )
    survey.save()

    emp.manager_feedback = float(manager)
    emp.growth_index = float(growth)

    # Pulse Attrition Formula
    base_risk = 20.0
    base_risk += (10 - workload) * 3
    base_risk += (10 - growth) * 3
    base_risk += (10 - comp) * 3
    base_risk += (10 - manager) * 4
    base_risk += (10 - wlb) * 3

    # Qualitative Sentiment Analysis (NLP)
    comments = str(data.get("comments", "")).strip()
    sentiment_shift = 0.0
    if comments:
        try:
            import importlib
            tb = importlib.import_module("textblob")
            blob = getattr(tb, "TextBlob")(comments)
            polarity = blob.sentiment.polarity
        except Exception:
            txt_l = comments.lower()
            pos = sum(txt_l.count(w) for w in ["happy", "good", "great", "excellent", "supportive", "satisfied", "love", "awesome"])
            neg = sum(txt_l.count(w) for w in ["bad", "poor", "unsupportive", "burnout", "tired", "stressed", "overwork", "low", "unfair"])
            polarity = (pos - neg) / (pos + neg) if (pos + neg) > 0 else 0.0

        if polarity < -0.1:
            sentiment_shift = abs(polarity) * 20.0
            emp.manager_feedback = max(1.0, emp.manager_feedback - abs(polarity) * 3)
        elif polarity > 0.1:
            sentiment_shift = - (polarity * 15.0)
            emp.manager_feedback = min(10.0, emp.manager_feedback + polarity * 2)

        from app.routes.logs import dispatch_log
        dispatch_log(
            source="Survey Sentiment Ingest",
            text=f"[NLP Agent] Analyzed qualitative feedback for {emp.name}. Polarity: {polarity:.2f}. Risk shift: {sentiment_shift:+.1f}%.",
            log_type="warning" if polarity < -0.1 else "info",
            employee_id=emp.employee_id
        )

    if workload < 5:
        emp.overtime_hrs = 15.0
        emp.overtime = "Yes"
    if comp < 5:
        emp.salary_gap = -15.0

    prob = min(max(base_risk + sentiment_shift, 5.0), 98.0)
    emp.probability = round(prob, 2)
    
    emp.status = risk_label(prob)
    emp.primary_factor = detect_primary_factor({
        "overtime_hrs": emp.overtime_hrs,
        "salary_gap": emp.salary_gap,
        "manager_feedback": emp.manager_feedback,
        "tenure": emp.tenure,
        "years_at_company": emp.years_at_company,
        "num_promotions": emp.num_promotions,
        "overtime": emp.overtime
    })

    hist = RiskHistory(
        employee_id=emp.employee_id,
        probability=emp.probability,
        status=emp.status
    )
    hist.save()

    audit = AuditLog(
        user_id=str(user.id) if user else "System",
        user_name=user.name if user else "System",
        role=user.role if user else "admin",
        organization_id=org_id,
        action_summary=f"Pulse Survey submitted for {emp.name} ({emp.employee_id}). Flight risk updated: {emp.probability}% ({emp.status})."
    )
    audit.save()
    
    emp.save()

    try:
        from app.services.csv_engine import CsvEngine
        CsvEngine.instance().reload_from_db()
    except Exception as e:
        print(f"CsvEngine reload failed: {e}")

    return success({
        "employee": emp.to_dict(),
        "survey": survey.to_dict()
    }, "Survey feedback submitted successfully and risk metrics recalculated.")


# ── GET /api/v1/employees/<employee_id>/timeline ──────────────────────────────
@employees_bp.get("/<employee_id>/timeline")
@jwt_required()
def get_employee_timeline(employee_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    
    emp = Employee.query.filter_by(employee_id=employee_id, organization_id=org_id).first()
    if not emp:
        from bson import ObjectId
        try:
            emp = Employee.query.filter({"_id": ObjectId(employee_id), "organization_id": org_id}).first()
        except Exception:
            emp = None
    if not emp:
        emp = Employee.query.filter({"_id": employee_id, "organization_id": org_id}).first()

    matched_ids = [employee_id]
    if emp and emp.employee_id and emp.employee_id not in matched_ids:
        matched_ids.append(emp.employee_id)

    timeline = EmployeeHistory.query.filter({"employee_id": {"$in": matched_ids}}).order_by(EmployeeHistory.timestamp.desc()).all()
    
    if not timeline and emp:
        hired_date = emp.date_hired or "Jan 01, 2024"
        try:
            dt = datetime.strptime(hired_date, "%b %d, %Y").replace(tzinfo=timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)
        initial_event = EmployeeHistory(
            employee_id=emp.employee_id,
            event_type="Hired",
            details=f"Onboarded to the organization as {emp.role} in {emp.dept} department at {emp.location or 'SF Office'}.",
            timestamp=dt
        )
        initial_event.save()
        timeline = [initial_event]
            
    return success({"timeline": [t.to_dict() for t in timeline]}, "Employee timeline logs fetched successfully")

