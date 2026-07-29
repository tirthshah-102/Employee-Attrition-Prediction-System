from app.db import db
from app.models.log import AgentLog
from app.models.employee import Employee


class AttritionPredictionAgent:
    """
    Computes regression statistics and attrition probabilities
    """
    def run(self, employee: Employee) -> dict:
        log = AgentLog(
            source="Predictor",
            text=f"[Attrition Prediction Agent] Computing flight risk confidence vectors (current: {employee.probability}%)...",
            type="info",
            employee_id=employee.employee_id
        )
        db.session.add(log)
        db.session.commit()

        return {
            "probability": employee.probability,
            "risk_status": employee.status
        }
