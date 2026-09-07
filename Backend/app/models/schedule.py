from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty




class ReportSchedule:
    """
    Stores scheduled report generation jobs (MongoDB collection: report_schedules)
    """
    __tablename__ = "report_schedules"

    name: Any = MongoFieldExpr("name")
    frequency: Any = MongoFieldExpr("frequency")
    format: Any = MongoFieldExpr("format")
    recipients: Any = MongoFieldExpr("recipients")
    created_at: Any = MongoFieldExpr("created_at")
    query: Any = None

    def __init__(self, name, frequency, format, recipients, created_at=None, id=None, _id=None):
        self.id = id or _id
        self.name = name
        self.frequency = frequency
        self.format = format
        self.recipients = recipients
        self.created_at = created_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "name": self.name,
            "frequency": self.frequency,
            "format": self.format,
            "recipients": self.recipients,
            "created_at": self.created_at
        }
        if self.id:
            try:
                db.report_schedules.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.report_schedules.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.report_schedules.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return ReportSchedule(
            id=str(doc.get("_id")),
            name=doc.get("name"),
            frequency=doc.get("frequency"),
            format=doc.get("format"),
            recipients=doc.get("recipients"),
            created_at=doc.get("created_at")
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "frequency": self.frequency,
            "format": self.format,
            "recipients": self.recipients,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

ReportSchedule.query = MongoQueryProperty(db.report_schedules, ReportSchedule)


class InterventionAuth:
    """
    Stores capital intervention sign-offs (MongoDB collection: intervention_authorizations)
    """
    __tablename__ = "intervention_authorizations"

    dept: Any = MongoFieldExpr("dept")
    created_at: Any = MongoFieldExpr("created_at")
    query: Any = None

    def __init__(self, dept, amount, created_at=None, id=None, _id=None):
        self.id = id or _id
        self.dept = dept
        self.amount = amount
        self.created_at = created_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "dept": self.dept,
            "amount": self.amount,
            "created_at": self.created_at
        }
        if self.id:
            try:
                db.intervention_authorizations.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.intervention_authorizations.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.intervention_authorizations.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return InterventionAuth(
            id=str(doc.get("_id")),
            dept=doc.get("dept"),
            amount=doc.get("amount"),
            created_at=doc.get("created_at")
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "dept": self.dept,
            "amount": self.amount,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

# Expose queries
InterventionAuth.query = MongoQueryProperty(db.intervention_authorizations, InterventionAuth)
