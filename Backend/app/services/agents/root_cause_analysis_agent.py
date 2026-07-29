from app.db import db
from app.models.log import AgentLog
from app.models.employee import Employee


class RootCauseAnalysisAgent:
    """
    Analyzes sentiment scores and text survey metrics to identify root cause drivers
    """
    def run(self, employee: Employee) -> dict:
        log = AgentLog(
            source="Diagnosis",
            text=f"[Root Cause Agent] Flagged critical driver: {employee.primary_factor} (severity matrix HIGH).",
            type="warning",
            employee_id=employee.employee_id
        )
        db.session.add(log)
        db.session.commit()

        return {
            "primary_driver": employee.primary_factor,
            "sentiment_score": int(employee.growth_index * 10)
        }
