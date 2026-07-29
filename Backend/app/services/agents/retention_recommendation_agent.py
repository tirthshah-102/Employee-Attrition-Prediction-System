from app.db import db
from app.models.log import AgentLog
from app.models.employee import Employee


class RetentionRecommendationAgent:
    """
    Generates tailored retention playbooks, comp revisions, and email drafts
    """
    def run(self, employee: Employee) -> dict:
        log = AgentLog(
            source="Playbooks",
            text=f"[Recommendation Agent] Formulated retention playbook directive target parameters.",
            type="success",
            employee_id=employee.employee_id
        )
        db.session.add(log)
        db.session.commit()

        # Generate a dynamic draft template based on the employee's main risk factor
        factor = employee.primary_factor
        if factor == "Workload & Overtime":
            recommendation = "Workload reduction by 20% & mandatory Friday off-hours."
            cost = "$0 (Restructuring load)"
        elif factor == "Compensation Gap":
            recommendation = "Increase base pay by 12% & perform compensation parity check."
            cost = "$12,000 base adjustment"
        elif factor == "Role Stagnation":
            recommendation = "Enroll in Senior Mentorship circle & define promo track timeline."
            cost = "$2,500 training grant"
        else:
            recommendation = "Schedule manager feedback sync & team alignment reviews."
            cost = "$500 review lunch"

        return {
            "recommendation": recommendation,
            "cost": cost
        }
