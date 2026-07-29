from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class AgentLog:
    """
    Mirrors the frontend LogEntry interface (MongoDB collection: agent_logs).
    """
    __tablename__ = "agent_logs"

    employee_id: Any = MongoFieldExpr("employee_id")
    created_at: Any = MongoFieldExpr("created_at")
    query: Any = None

    def __init__(self, source, text, type="info", employee_id=None, created_at=None, id=None, _id=None):
        self.id = id or _id
        self.source = source
        self.text = text
        self.type = type
        self.employee_id = employee_id
        self.created_at = created_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "source": self.source,
            "text": self.text,
            "type": self.type,
            "employee_id": self.employee_id,
            "created_at": self.created_at
        }
        if self.id:
            try:
                db.agent_logs.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.agent_logs.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.agent_logs.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return AgentLog(
            id=str(doc.get("_id")),
            source=doc.get("source"),
            text=doc.get("text"),
            type=doc.get("type", "info"),
            employee_id=doc.get("employee_id"),
            created_at=doc.get("created_at")
        )

    def to_dict(self) -> dict:
        return {
            "source":     self.source,
            "text":       self.text,
            "type":       self.type,
            "employeeId": self.employee_id,
            "createdAt":  self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }

    def __repr__(self) -> str:
        return f"<AgentLog [{self.source}] {self.text[:40]}>"

# Expose Query helper
AgentLog.query = MongoQueryProperty(db.agent_logs, AgentLog)
