from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class RiskHistory:
    """
    Tracks monthly attrition risk probability metrics over a rolling timeframe (MongoDB collection: risk_history).
    """
    __tablename__ = "risk_history"

    employee_id: Any = MongoFieldExpr("employee_id")
    recorded_at: Any = MongoFieldExpr("recorded_at")
    query: Any = None

    def __init__(self, employee_id, probability, status="Low", recorded_at=None, id=None, _id=None):
        self.id = id or _id
        self.employee_id = employee_id
        self.probability = probability
        self.status = status
        self.recorded_at = recorded_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "employee_id": self.employee_id,
            "probability": self.probability,
            "status": self.status,
            "recorded_at": self.recorded_at
        }
        if self.id:
            try:
                db.risk_history.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.risk_history.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.risk_history.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return RiskHistory(
            id=str(doc.get("_id")),
            employee_id=doc.get("employee_id"),
            probability=doc.get("probability"),
            status=doc.get("status", "Low"),
            recorded_at=doc.get("recorded_at")
        )

    def to_dict(self) -> dict:
        return {
            "id":          str(self.id) if self.id else None,
            "employeeId":  self.employee_id,
            "probability": self.probability,
            "status":      self.status,
            "recordedAt":  self.recorded_at.isoformat() if isinstance(self.recorded_at, datetime) else self.recorded_at
        }

class EmployeeHistory:
    """
    Timeline tracking for employee career events: promotions, salary changes, manager updates (MongoDB collection: employee_history).
    """
    __tablename__ = "employee_history"

    employee_id: Any = MongoFieldExpr("employee_id")
    timestamp: Any = MongoFieldExpr("timestamp")
    query: Any = None

    def __init__(self, employee_id, event_type, details, timestamp=None, id=None, _id=None):
        self.id = id or _id
        self.employee_id = employee_id
        self.event_type = event_type
        self.details = details
        self.timestamp = timestamp or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "employee_id": self.employee_id,
            "event_type": self.event_type,
            "details": self.details,
            "timestamp": self.timestamp
        }
        if self.id:
            try:
                db.employee_history.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.employee_history.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.employee_history.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return EmployeeHistory(
            id=str(doc.get("_id")),
            employee_id=doc.get("employee_id"),
            event_type=doc.get("event_type"),
            details=doc.get("details"),
            timestamp=doc.get("timestamp")
        )

    def to_dict(self) -> dict:
        return {
            "id":         str(self.id) if self.id else None,
            "employeeId": self.employee_id,
            "eventType":  self.event_type,
            "details":    self.details,
            "timestamp":  self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp
        }

# Expose queries
RiskHistory.query = MongoQueryProperty(db.risk_history, RiskHistory)
EmployeeHistory.query = MongoQueryProperty(db.employee_history, EmployeeHistory)
