import os
import requests
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from app.db import db
from app.models.employee import Employee
from app.models.settings import SystemSetting
from app.routes.logs import dispatch_log

scheduler = BackgroundScheduler()

def dispatch_webhook_alerts():
    """
    Scans for high-risk employees (probability >= 65%) and dispatches webhooks.
    """
    # Use app_context to query database in a background thread
    from run import app
    with app.app_context():
        high_risk_employees = Employee.query.filter(Employee.probability >= 65.0, Employee.is_active == True).all()
        if not high_risk_employees:
            return

        # Fetch configured webhook urls from settings
        slack_setting = SystemSetting.query.filter_by(key="slackWebhookUrl").first()
        teams_setting = SystemSetting.query.filter_by(key="teamsWebhookUrl").first()

        # Fallback to env variables if not in database
        slack_url = (slack_setting.value if slack_setting else None) or os.getenv("SLACK_WEBHOOK_URL")
        teams_url = (teams_setting.value if teams_setting else None) or os.getenv("TEAMS_WEBHOOK_URL")

        if not slack_url and not teams_url:
            return

        for emp in high_risk_employees:
            message = f"⚠️ *CRITICAL ATTRITION RISK DETECTED* ⚠️\n\n*Employee:* {emp.name} ({emp.employee_id})\n*Department:* {emp.dept}\n*Role:* {emp.role}\n*Risk Probability:* {emp.probability:.1f}%\n*Primary Driver:* {emp.primary_factor}\n\nImmediate intervention recommended via Playbook."
            
            # Send Slack
            if slack_url and slack_url.startswith("http"):
                try:
                    requests.post(slack_url, json={"text": message}, timeout=5)
                    dispatch_log(
                        source="Security Alert",
                        text=f"Slack alert dispatched for critical risk employee {emp.employee_id}.",
                        log_type="warning",
                        employee_id=emp.employee_id
                    )
                except Exception as e:
                    print("Slack webhook error:", e)

            # Send Teams
            if teams_url and teams_url.startswith("http"):
                try:
                    requests.post(teams_url, json={"text": message}, timeout=5)
                    dispatch_log(
                        source="Security Alert",
                        text=f"Teams alert dispatched for critical risk employee {emp.employee_id}.",
                        log_type="warning",
                        employee_id=emp.employee_id
                    )
                except Exception as e:
                    print("Teams webhook error:", e)

def run_automated_report():
    """
    Runs automated reporting task.
    """
    from run import app
    with app.app_context():
        # Query total headcount and high risk nodes
        total = Employee.query.filter_by(is_active=True).count()
        high = Employee.query.filter(Employee.probability >= 65.0, Employee.is_active == True).count()
        
        log_msg = f"[Scheduler Agent] Automated Report Run: Monitored {total} active FTEs. {high} critical risk nodes detected."
        dispatch_log(
            source="Scheduler",
            text=log_msg,
            log_type="info"
        )
        print(log_msg)

def setup_scheduler():
    # Start scheduler jobs
    if not scheduler.running:
        # Run report job every 15 minutes
        scheduler.add_job(run_automated_report, 'interval', minutes=15, id='run_automated_report')
        # Run webhook alert check every 5 minutes
        scheduler.add_job(dispatch_webhook_alerts, 'interval', minutes=5, id='dispatch_webhook_alerts')
        scheduler.start()
        print("[Scheduler] APScheduler background service initialized.")
