from typing import Any
from datetime import datetime, timezone
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class AuditLog:
    """
    SOC 2 Audit Trail compliance logger (MongoDB collection: audit_logs).
    """
    __tablename__ = "audit_logs"

    id: Any = MongoFieldExpr("id")
    user_id: Any = MongoFieldExpr("user_id")
    user_name: Any = MongoFieldExpr("user_name")
    role: Any = MongoFieldExpr("role")
    organization_id: Any = MongoFieldExpr("organization_id")
    action_summary: Any = MongoFieldExpr("action_summary")
    timestamp: Any = MongoFieldExpr("timestamp")

    def __init__(self, action_summary, user_id=None, user_name=None, role=None, organization_id="org-comp-a", timestamp=None, id=None, _id=None):
        self.id = id or _id
        self.user_id = user_id
        self.user_name = user_name
        self.role = role
        self.organization_id = organization_id
        self.action_summary = action_summary
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "role": self.role,
            "organization_id": self.organization_id,
            "action_summary": self.action_summary,
            "timestamp": self.timestamp
        }
        if self.id:
            try:
                db.audit_logs.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.audit_logs.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.audit_logs.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return AuditLog(
            id=str(doc.get("_id")),
            user_id=doc.get("user_id"),
            user_name=doc.get("user_name"),
            role=doc.get("role"),
            organization_id=doc.get("organization_id", "org-comp-a"),
            action_summary=doc.get("action_summary"),
            timestamp=doc.get("timestamp")
        )

    def to_dict(self) -> dict:
        return {
            "id":             str(self.id) if self.id else None,
            "userId":         self.user_id,
            "userName":       self.user_name,
            "role":           self.role,
            "organizationId": self.organization_id,
            "actionSummary":  self.action_summary,
            "timestamp":      self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp,
        }

    def __repr__(self) -> str:
        return f"<AuditLog {self.action_summary} at {self.timestamp}>"

# Expose Query helper
AuditLog.query = MongoQueryProperty(db.audit_logs, AuditLog)
