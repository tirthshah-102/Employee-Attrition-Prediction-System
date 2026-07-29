from datetime import datetime, timezone
from app.db import db, MongoQuery, MongoQueryProperty

class PulseSurvey:
    """
    Pulse Survey records for historical tracking (MongoDB collection: pulse_surveys).
    """
    __tablename__ = "pulse_surveys"

    def __init__(self, employee_id, workload_satisfaction, growth_satisfaction, comp_satisfaction, manager_score, work_life_balance, organization_id="org-comp-a", submitted_at=None, id=None, _id=None):
        self.id = id or _id
        self.employee_id = employee_id
        self.organization_id = organization_id
        self.workload_satisfaction = workload_satisfaction
        self.growth_satisfaction = growth_satisfaction
        self.comp_satisfaction = comp_satisfaction
        self.manager_score = manager_score
        self.work_life_balance = work_life_balance
        self.submitted_at = submitted_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "employee_id": self.employee_id,
            "organization_id": self.organization_id,
            "workload_satisfaction": self.workload_satisfaction,
            "growth_satisfaction": self.growth_satisfaction,
            "comp_satisfaction": self.comp_satisfaction,
            "manager_score": self.manager_score,
            "work_life_balance": self.work_life_balance,
            "submitted_at": self.submitted_at
        }
        if self.id:
            try:
                db.pulse_surveys.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.pulse_surveys.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.pulse_surveys.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return PulseSurvey(
            id=str(doc.get("_id")),
            employee_id=doc.get("employee_id"),
            organization_id=doc.get("organization_id", "org-comp-a"),
            workload_satisfaction=doc.get("workload_satisfaction"),
            growth_satisfaction=doc.get("growth_satisfaction"),
            comp_satisfaction=doc.get("comp_satisfaction"),
            manager_score=doc.get("manager_score"),
            work_life_balance=doc.get("work_life_balance"),
            submitted_at=doc.get("submitted_at")
        )

    def to_dict(self) -> dict:
        return {
            "id":                   str(self.id) if self.id else None,
            "employeeId":           self.employee_id,
            "organizationId":       self.organization_id,
            "workloadSatisfaction": self.workload_satisfaction,
            "growthSatisfaction":   self.growth_satisfaction,
            "compSatisfaction":     self.comp_satisfaction,
            "managerScore":         self.manager_score,
            "workLifeBalance":      self.work_life_balance,
            "submittedAt":          self.submitted_at.isoformat() if isinstance(self.submitted_at, datetime) else self.submitted_at,
        }

    def __repr__(self) -> str:
        return f"<PulseSurvey {self.employee_id} submitted at {self.submitted_at}>"

# Expose Query helper
PulseSurvey.query = MongoQueryProperty(db.pulse_surveys, PulseSurvey)
