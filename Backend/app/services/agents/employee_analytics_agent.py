from app.db import db
from app.models.log import AgentLog
from app.models.employee import Employee


class EmployeeAnalyticsAgent:
    """
    Scans raw database metrics for a target employee profile
    """
    def run(self, employee: Employee) -> dict:
        log = AgentLog(
            source="Analytics",
            text=f"[Employee Analytics Agent] Scanning JIRA sprint boards & attendance records for {employee.name}...",
            type="info",
            employee_id=employee.employee_id
        )
        db.session.add(log)
        db.session.commit()

        return {
            "weekly_hours": employee.overtime_hrs + 40,
            "rating": employee.rating,
            "manager_feedback": employee.manager_feedback
        }
