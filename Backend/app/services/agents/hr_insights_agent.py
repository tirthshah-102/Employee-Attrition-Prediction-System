from app.db import db
from app.models.log import AgentLog
from app.models.employee import Employee
from app.services.agents.employee_analytics_agent import EmployeeAnalyticsAgent
from app.services.agents.attrition_prediction_agent import AttritionPredictionAgent
from app.services.agents.root_cause_analysis_agent import RootCauseAnalysisAgent
from app.services.agents.retention_recommendation_agent import RetentionRecommendationAgent


class HRInsightsAgent:
    """
    Orchestrator Agent: Directs the sub-agents and aggregates analysis results
    """
    def __init__(self):
        self.analytics = EmployeeAnalyticsAgent()
        self.predictor = AttritionPredictionAgent()
        self.diagnoser = RootCauseAnalysisAgent()
        self.recommend = RetentionRecommendationAgent()

    def evaluate_employee(self, employee: Employee) -> dict:
        # Run agent chain
        analytics_result = self.analytics.run(employee)
        predictor_result = self.predictor.run(employee)
        diagnoser_result = self.diagnoser.run(employee)
        recommend_result = self.recommend.run(employee)

        # Log orchestration compile event
        log = AgentLog(
            source="Reporter",
            text=f"[Orchestrator Agent] Full multi-agent evaluation compile complete for {employee.name}.",
            type="success",
            employee_id=employee.employee_id
        )
        db.session.add(log)
        db.session.commit()

        return {
            "employeeId": employee.employee_id,
            "name": employee.name,
            "analytics": analytics_result,
            "predictor": predictor_result,
            "diagnoser": diagnoser_result,
            "recommend": recommend_result
        }
