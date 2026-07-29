"""
attrition.py
============
Implements the scoring and recommendation logic from the Jupyter notebook:

  Cell 2  → compute_attrition_score()  — engineered target variable
  Cell 6  → recommend()                — rule-based retention tips
  Cell 5  → risk_label()               — High / Medium / Low thresholds

Also defines:
  detect_primary_factor()  — maps employee signals → primaryFactor
  PLAYBOOKS                — plan codes used in PlaybooksPage.tsx
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional


# ── Notebook: risk_label() ────────────────────────────────────────────────────
def risk_label(score: float) -> str:
    """Mirrors notebook cell 2 thresholds exactly."""
    if score >= 65:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"


# ── Notebook: Attrition_Score engineering (cell 2) ───────────────────────────
_SAT_MAP  = {"Very High": 0, "High": 5, "Medium": 12, "Low": 20}
_WLB_MAP  = {"Excellent": 0, "Good":  5, "Fair":  11, "Poor": 18}
_OT_MAP   = {"No": 0, "Yes": 15}
_PERF_MAP = {"High": 0, "Average": 5, "Below Average": 9, "Low": 12}
_REC_MAP  = {"Very High": 0, "High": 2, "Medium": 6, "Low": 10}
_REP_MAP  = {"Excellent": 0, "Good":  2, "Fair":  5, "Poor":  8}


def compute_attrition_score(row: dict) -> float:
    """
    Replicates the score-engineering cell from the notebook verbatim.
    Accepts a dict with keys matching the CSV column names.
    """
    score = 0.0
    score += _SAT_MAP.get(row.get("job_satisfaction",  ""), 10)
    score += _WLB_MAP.get(row.get("work_life_balance", ""),  9)
    score += _OT_MAP.get(row.get("overtime",           ""),  0)
    score += _PERF_MAP.get(row.get("performance_rating",""),  6)
    score += _REC_MAP.get(row.get("employee_recognition",""), 5)
    score += _REP_MAP.get(row.get("company_reputation", ""),  4)

    promotions = int(row.get("num_promotions", 0) or 0)
    score += min(max(7 - promotions * 2, 0), 7)

    score += 0 if row.get("leadership_opportunities") == "Yes" else 5
    score += 0 if row.get("innovation_opportunities") == "Yes" else 5

    return round(min(max(score, 0), 100), 2)


# ── Notebook: recommend() (cell 6, ported verbatim) ──────────────────────────
def notebook_recommend(row: dict) -> list[str]:
    """
    Rule-based retention recommendations.
    Exactly matches the notebook's recommend(row) function.
    """
    tips = []
    if row.get("job_satisfaction")    in ("Low", "Medium"):
        tips.append("Conduct 1-on-1 satisfaction review")
    if row.get("overtime")            == "Yes":
        tips.append("Reduce overtime / offer comp-off")
    if row.get("work_life_balance")   in ("Poor", "Fair"):
        tips.append("Introduce flexible work schedule")
    if int(row.get("num_promotions", 0) or 0) == 0:
        tips.append("Discuss career growth & promotion path")
    if row.get("employee_recognition") in ("Low", "Medium"):
        tips.append("Increase recognition & rewards")
    if row.get("performance_rating")  in ("Low", "Below Average"):
        tips.append("Enroll in performance improvement plan")
    if row.get("leadership_opportunities") == "No":
        tips.append("Offer leadership / mentoring role")
    if row.get("innovation_opportunities") == "No":
        tips.append("Assign to innovation / R&D projects")
    if not tips:
        tips.append("Maintain current engagement — low risk")
    return tips


# ── Primary factor detection ──────────────────────────────────────────────────
def detect_primary_factor(emp: dict) -> str:
    """
    Maps employee signals to the primaryFactor used in the frontend
    (matches PlaybooksPage.tsx plan triggers).
    """
    overtime_hrs  = float(emp.get("overtime_hrs",  0) or 0)
    salary_gap    = float(emp.get("salary_gap",    0) or 0)
    manager_fb    = float(emp.get("manager_feedback", 10) or 10)
    tenure        = emp.get("tenure", "") or ""
    years_at_co   = float(emp.get("years_at_company", 99) or 99)
    num_promo     = int(emp.get("num_promotions",  1) or 1)
    overtime_flag = emp.get("overtime", "No")

    # Parse tenure string "X yrs" → float
    try:
        tenure_yrs = float(tenure.split()[0])
    except (ValueError, IndexError):
        tenure_yrs = years_at_co

    if tenure_yrs < 1:
        return "Onboarding Friction"
    if overtime_hrs > 10 or overtime_flag == "Yes":
        return "Workload & Overtime"
    if salary_gap < -5:
        return "Compensation Gap"
    if manager_fb < 5:
        return "Feedback Loop Issues"
    if num_promo == 0 and years_at_co >= 2:
        return "Role Stagnation"
    return "Role Stagnation"


# ── Playbook catalogue (mirrors PlaybooksPage.tsx) ───────────────────────────
PLAYBOOKS: dict[str, dict] = {
    "Workload & Overtime": {
        "planCode":     "WORK-L3",
        "name":         "Workload Calibrator",
        "triggerEvent": "Burnout Warning",
        "priority":     3,
        "color":        "blue",
        "description":  "Automatically adjusts task limits, manages weekly overtime thresholds, and coordinates balance alerts for managers.",
        "actions": [
            "Cap weekly overtime to ≤ 5 hrs for flagged employee",
            "Notify line manager to redistribute task load",
            "Schedule bi-weekly workload check-in",
            "Offer compensatory day-off for last 4 weeks of excess hours",
        ],
    },
    "Compensation Gap": {
        "planCode":     "COMP-CALIBR",
        "name":         "Comp Calibrator",
        "triggerEvent": "Salary Benchmark Gap",
        "priority":     2,
        "color":        "amber",
        "description":  "Coordinates salary adjustments and dynamic market benchmarking reviews to eliminate compensation differences.",
        "actions": [
            "Run market salary benchmark for employee's role and level",
            "Initiate off-cycle salary review with HR",
            "Present revised offer within 2 weeks",
            "Add retention bonus clause if adjustment > 10%",
        ],
    },
    "Role Stagnation": {
        "planCode":     "GROW-PATH",
        "name":         "Career Path Directive",
        "triggerEvent": "Role Stagnation Warning",
        "priority":     2,
        "color":        "cyan",
        "description":  "Schedules structured career growth reviews, mentorship pairings, and establishes custom professional training maps.",
        "actions": [
            "Schedule career growth discussion with manager",
            "Identify promotion eligibility within 90 days",
            "Enroll in leadership development program",
            "Assign cross-functional project as stretch assignment",
        ],
    },
    "Feedback Loop Issues": {
        "planCode":     "FEED-LOOP",
        "name":         "Feedback Enhancer",
        "triggerEvent": "Manager Feedback Gap",
        "priority":     2,
        "color":        "purple",
        "description":  "Improves communication cadence between employees and managers, ensuring regular structured feedback and recognition.",
        "actions": [
            "Set up weekly 1-on-1 with direct manager",
            "Enroll manager in active listening training",
            "Implement structured monthly feedback template",
            "Assign senior mentor for additional guidance",
        ],
    },
    "Onboarding Friction": {
        "planCode":     "ONBOARD-PLUS",
        "name":         "Onboarding Accelerator",
        "triggerEvent": "Early Tenure Risk",
        "priority":     1,
        "color":        "green",
        "description":  "Reduces early attrition by enhancing the onboarding experience with buddy programs, structured 30-60-90 plans.",
        "actions": [
            "Assign peer buddy for first 60 days",
            "Create personalised 30-60-90 day onboarding plan",
            "Schedule weekly check-in with HR for first month",
            "Early recognition for quick wins in first 30 days",
        ],
    },
}


def get_playbook(primary_factor: str) -> dict:
    return PLAYBOOKS.get(primary_factor, PLAYBOOKS["Role Stagnation"])


# ── New employee risk computation (mirrors SystemContext.tsx registerEmployee) ─
def compute_new_employee_risk(overtime_hrs: float, salary_gap: float) -> tuple[float, str]:
    """
    Replicates the exact formula from SystemContext.tsx registerEmployee():
      let baseRisk = 15;
      if (overtimeHrs > 10) baseRisk += (overtimeHrs - 10) * 4;
      if (salaryGap < 0)    baseRisk += Math.abs(salaryGap) * 2;
      baseRisk = Math.min(Math.max(baseRisk, 5), 98);
    """
    base_risk = 15.0
    if overtime_hrs > 10:
        base_risk += (overtime_hrs - 10) * 4
    if salary_gap < 0:
        base_risk += abs(salary_gap) * 2
    base_risk = min(max(base_risk, 5), 98)
    return round(base_risk, 2), risk_label(base_risk)
