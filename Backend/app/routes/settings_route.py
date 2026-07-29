from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.db import db
from app.models.settings import SystemSetting
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.response import success, error

settings_bp = Blueprint("settings", __name__)


@settings_bp.get("/")
@jwt_required()
def get_settings():
    settings = SystemSetting.query.all()
    # If no settings exist yet, initialize them
    if not settings:
        default_settings = [
            ("confidenceThreshold", "0.75"),
            ("modelVersion", "v4.2.RC-1"),
            ("mfaEnforced", "false")
        ]
        for key, val in default_settings:
            db.session.add(SystemSetting(key=key, value=val))
        db.session.commit()
        settings = SystemSetting.query.all()

    return success({s.key: s.value for s in settings}, "Settings fetched")


@settings_bp.put("/")
@jwt_required()
def update_settings():
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    from app.db import get_user_id
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    
    logged_actions = []
    for key, val in data.items():
        setting = SystemSetting.query.filter_by(key=key).first()
        old_val = setting.value if setting else "None"
        if setting:
            setting.value = str(val)
            setting.save()
        else:
            db.session.add(SystemSetting(key=key, value=str(val)))
        
        logged_actions.append(f"Updated setting '{key}' from '{old_val}' to '{val}'")
            
    # Log to Audit trail for SOC 2 compliance
    for action in logged_actions:
        audit = AuditLog(
            user_id=str(user.id),
            user_name=user.name,
            role=user.role,
            organization_id=org_id,
            action_summary=action
        )
        db.session.add(audit)

    db.session.commit()
    settings = SystemSetting.query.all()
    return success({s.key: s.value for s in settings}, "Settings updated")


@settings_bp.get("/audit-trail")
@jwt_required()
def get_audit_trail():
    claims = get_jwt()
    role = claims.get("role")
    if role != "admin":
        return error("Not authorised. IT Administrator access required.", 403)
        
    org_id = claims.get("org_id", "org-comp-a")
    
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 15))
    search = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip()

    query = AuditLog.query.filter_by(organization_id=org_id)
    if role_filter:
        query = query.filter_by(role=role_filter)
    if search:
        query = query.filter(AuditLog.action_summary.ilike(f"%{search}%"))

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return success({
        "auditTrail": [l.to_dict() for l in logs],
        "total": total,
        "page": page,
        "limit": limit
    }, "Audit trail logs fetched successfully")
