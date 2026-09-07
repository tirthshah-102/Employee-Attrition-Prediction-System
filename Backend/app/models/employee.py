import json
from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class Employee:
    """
    Primary employee NoSQL entity (MongoDB collection: employees).
    """
    __tablename__ = "employees"

    # Mock Field Expressions for query sorting/ilike compatibility
    id: Any = MongoFieldExpr("id")
    employee_id: Any = MongoFieldExpr("employee_id")
    name: Any = MongoFieldExpr("name")
    email: Any = MongoFieldExpr("email")
    dept: Any = MongoFieldExpr("dept")
    role: Any = MongoFieldExpr("role")
    probability: Any = MongoFieldExpr("probability")
    status: Any = MongoFieldExpr("status")
    is_active: Any = MongoFieldExpr("is_active")
    organization_id: Any = MongoFieldExpr("organization_id")
    query: Any = None

    def __init__(self, employee_id, name, email, dept, role, tenure=None, probability=0.0, status="Low", primary_factor="Unknown", overtime_hrs=0.0, salary_gap=0.0, manager_feedback=7.0, growth_index=5.0, playbook_status="Ready", kanban_status="NEW", location=None, date_hired=None, rating=3.5, manager_notes=None, organization_id="org-comp-a", manager_id=None, csv_employee_id=None, age=None, gender=None, job_role=None, job_level=None, yearly_income=None, years_at_company=None, job_satisfaction=None, work_life_balance=None, overtime=None, performance_rating=None, num_promotions=None, attrition_score=None, predicted_score=None, risk_category=None, predicted_risk=None, playbook_history=None, is_active=True, id=None, _id=None, created_at=None, updated_at=None):
        self.id = id or _id
        self.employee_id = employee_id
        self.name = name
        self.email = email
        self.dept = dept
        self.role = role
        self.tenure = tenure
        self.probability = probability
        self.status = status
        self.primary_factor = primary_factor
        self.overtime_hrs = overtime_hrs
        self.salary_gap = salary_gap
        self.manager_feedback = manager_feedback
        self.growth_index = growth_index
        self.playbook_status = playbook_status
        self.kanban_status = kanban_status
        self.location = location
        self.date_hired = date_hired
        self.rating = rating
        self.manager_notes = manager_notes
        self.organization_id = organization_id
        self.manager_id = manager_id
        
        self.csv_employee_id = csv_employee_id
        self.age = age
        self.gender = gender
        self.job_role = job_role
        self.job_level = job_level
        self.yearly_income = yearly_income
        self.years_at_company = years_at_company
        self.job_satisfaction = job_satisfaction
        self.work_life_balance = work_life_balance
        self.overtime = overtime
        self.performance_rating = performance_rating
        self.num_promotions = num_promotions
        self.attrition_score = attrition_score
        self.predicted_score = predicted_score
        self.risk_category = risk_category
        self.predicted_risk = predicted_risk
        
        self.playbook_history = playbook_history or []
        self.is_active = is_active
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def append_playbook_event(self, event: dict) -> None:
        self.playbook_history.append(event)

    def save(self):
        from bson import ObjectId
        doc = {
            "employee_id": self.employee_id,
            "name": self.name,
            "email": self.email.lower().strip() if self.email else "",
            "dept": self.dept,
            "role": self.role,
            "tenure": self.tenure,
            "probability": self.probability,
            "status": self.status,
            "primary_factor": self.primary_factor,
            "overtime_hrs": self.overtime_hrs,
            "salary_gap": self.salary_gap,
            "manager_feedback": self.manager_feedback,
            "growth_index": self.growth_index,
            "playbook_status": self.playbook_status,
            "kanban_status": self.kanban_status,
            "location": self.location,
            "date_hired": self.date_hired,
            "rating": self.rating,
            "manager_notes": self.manager_notes,
            "organization_id": self.organization_id,
            "manager_id": self.manager_id,
            
            "csv_employee_id": self.csv_employee_id,
            "age": self.age,
            "gender": self.gender,
            "job_role": self.job_role,
            "job_level": self.job_level,
            "yearly_income": self.yearly_income,
            "years_at_company": self.years_at_company,
            "job_satisfaction": self.job_satisfaction,
            "work_life_balance": self.work_life_balance,
            "overtime": self.overtime,
            "performance_rating": self.performance_rating,
            "num_promotions": self.num_promotions,
            "attrition_score": self.attrition_score,
            "predicted_score": self.predicted_score,
            "risk_category": self.risk_category,
            "predicted_risk": self.predicted_risk,
            
            "playbook_history": self.playbook_history,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": datetime.now(timezone.utc)
        }
        if self.id:
            try:
                db.employees.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.employees.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.employees.insert_one(doc)
            self.id = str(res.inserted_id)

    def delete(self):
        from bson import ObjectId
        if self.id:
            try:
                db.employees.delete_one({"_id": ObjectId(self.id)})
            except Exception:
                db.employees.delete_one({"_id": self.id})
        if self.employee_id:
            db.employees.delete_one({"employee_id": self.employee_id})

    def delete_doc(self):
        self.delete()


    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return Employee(
            id=str(doc.get("_id")),
            employee_id=doc.get("employee_id"),
            name=doc.get("name"),
            email=doc.get("email"),
            dept=doc.get("dept"),
            role=doc.get("role"),
            tenure=doc.get("tenure"),
            probability=doc.get("probability", 0.0),
            status=doc.get("status", "Low"),
            primary_factor=doc.get("primary_factor", "Unknown"),
            overtime_hrs=doc.get("overtime_hrs", 0.0),
            salary_gap=doc.get("salary_gap", 0.0),
            manager_feedback=doc.get("manager_feedback", 7.0),
            growth_index=doc.get("growth_index", 5.0),
            playbook_status=doc.get("playbook_status", "Ready"),
            kanban_status=doc.get("kanban_status", "NEW"),
            location=doc.get("location"),
            date_hired=doc.get("date_hired"),
            rating=doc.get("rating", 3.5),
            manager_notes=doc.get("manager_notes"),
            organization_id=doc.get("organization_id", "org-comp-a"),
            manager_id=doc.get("manager_id"),
            
            csv_employee_id=doc.get("csv_employee_id"),
            age=doc.get("age"),
            gender=doc.get("gender"),
            job_role=doc.get("job_role"),
            job_level=doc.get("job_level"),
            yearly_income=doc.get("yearly_income"),
            years_at_company=doc.get("years_at_company"),
            job_satisfaction=doc.get("job_satisfaction"),
            work_life_balance=doc.get("work_life_balance"),
            overtime=doc.get("overtime"),
            performance_rating=doc.get("performance_rating"),
            num_promotions=doc.get("num_promotions"),
            attrition_score=doc.get("attrition_score"),
            predicted_score=doc.get("predicted_score"),
            risk_category=doc.get("risk_category"),
            predicted_risk=doc.get("predicted_risk"),
            
            playbook_history=doc.get("playbook_history", []),
            is_active=doc.get("is_active", True),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at")
        )

    def to_dict(self, include_csv: bool = False) -> dict:
        data = {
            "id":              self.employee_id,
            "name":            self.name,
            "email":           self.email,
            "dept":            self.dept,
            "role":            self.role,
            "tenure":          self.tenure,
            "probability":     self.probability,
            "status":          self.status,
            "primaryFactor":   self.primary_factor,
            "overtimeHrs":     self.overtime_hrs,
            "salaryGap":       self.salary_gap,
            "managerFeedback": self.manager_feedback,
            "growthIndex":     self.growth_index,
            "playbookStatus":  self.playbook_status,
            "kanbanStatus":    self.kanban_status,
            "location":        self.location,
            "dateHired":       self.date_hired,
            "rating":          self.rating,
            "managerNotes":    self.manager_notes,
            "organizationId":  self.organization_id,
            "managerId":       self.manager_id,
            "_dbId":           str(self.id) if self.id else None,
            "isActive":        self.is_active,
            "createdAt":       self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }
        if include_csv:
            data.update({
                "csvEmployeeId":   self.csv_employee_id,
                "age":             self.age,
                "gender":          self.gender,
                "jobRole":         self.job_role,
                "jobLevel":        self.job_level,
                "yearlyIncome":    self.yearly_income,
                "yearsAtCompany":  self.years_at_company,
                "jobSatisfaction": self.job_satisfaction,
                "workLifeBalance": self.work_life_balance,
                "overtime":        self.overtime,
                "performanceRating": self.performance_rating,
                "numPromotions":   self.num_promotions,
                "attritionScore":  self.attrition_score,
                "predictedScore":  self.predicted_score,
                "riskCategory":    self.risk_category,
                "predictedRisk":   self.predicted_risk,
            })
        return data

    def __repr__(self) -> str:
        return f"<Employee {self.employee_id} — {self.name} [{self.status}]>"

# Expose Query attribute
Employee.query = MongoQueryProperty(db.employees, Employee)
