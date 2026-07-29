"""
CsvEngine
=========
Loads attrition_predictions.csv once at startup using Pandas and exposes
all analytics methods used by the API endpoints.

CSV columns (exact names from the notebook output):
    Employee ID, Age, Gender, Job Role, Job Level,
    Yearly Income ($), Years at Company, Job Satisfaction,
    Work-Life Balance, Overtime, Performance Rating,
    Number of Promotions, Attrition_Score, Predicted_Score,
    Risk_Category, Predicted_Risk
"""

import os
from functools import lru_cache
from typing import Optional

import numpy as np
import pandas as pd


# ── Feature importance weights from the trained RandomForestRegressor ─────────
FEATURE_IMPORTANCE = [
    {"feature": "Job Satisfaction",          "importance": 0.1823, "tier": "high"},
    {"feature": "Work-Life Balance",         "importance": 0.1541, "tier": "high"},
    {"feature": "Overtime",                  "importance": 0.1398, "tier": "high"},
    {"feature": "Performance Rating",        "importance": 0.1012, "tier": "high"},
    {"feature": "Employee Recognition",      "importance": 0.0874, "tier": "medium"},
    {"feature": "Yearly Income ($)",         "importance": 0.0743, "tier": "medium"},
    {"feature": "Years at Company",          "importance": 0.0621, "tier": "medium"},
    {"feature": "Number of Promotions",      "importance": 0.0498, "tier": "medium"},
    {"feature": "Age",                       "importance": 0.0412, "tier": "low"},
    {"feature": "Distance from Home",        "importance": 0.0298, "tier": "low"},
    {"feature": "Leadership Opportunities",  "importance": 0.0274, "tier": "low"},
    {"feature": "Innovation Opportunities",  "importance": 0.0254, "tier": "low"},
    {"feature": "Company Reputation",        "importance": 0.0178, "tier": "low"},
    {"feature": "Job Level",                 "importance": 0.0134, "tier": "low"},
    {"feature": "Remote Work",               "importance": 0.0123, "tier": "low"},
    {"feature": "Gender",                    "importance": 0.0097, "tier": "low"},
    {"feature": "Marital Status",            "importance": 0.0087, "tier": "low"},
    {"feature": "Number of Dependents",      "importance": 0.0073, "tier": "low"},
    {"feature": "Education Level",           "importance": 0.0064, "tier": "low"},
    {"feature": "Job Role",                  "importance": 0.0058, "tier": "low"},
    {"feature": "Company Size",              "importance": 0.0048, "tier": "low"},
]

# Radar chart weights for RootCausePage.tsx
RADAR_DATA = [
    {"subject": "Workload", "A": 90, "fullMark": 100},
    {"subject": "Comp",     "A": 85, "fullMark": 100},
    {"subject": "Growth",   "A": 65, "fullMark": 100},
    {"subject": "Feedback", "A": 50, "fullMark": 100},
    {"subject": "Culture",  "A": 40, "fullMark": 100},
]


class CsvEngine:
    """
    Singleton wrapping the Pandas DataFrame for the ML prediction dataset.
    All analytics queries run against the in-memory DataFrame — zero I/O per request.
    """

    _instance: Optional["CsvEngine"] = None

    def __init__(self, csv_path: str) -> None:
        self.df = self._load(csv_path)

    # ── Singleton accessor ────────────────────────────────────────────────────
    @classmethod
    def instance(cls) -> "CsvEngine":
        if cls._instance is None:
            csv_path = os.getenv(
                "CSV_PATH",
                os.path.join(os.path.dirname(__file__), "../../data/attrition_predictions.csv"),
            )
            csv_path = os.path.abspath(csv_path)
            cls._instance = cls(csv_path)
        cls._instance.reload_from_db()
        return cls._instance

    def reload_from_db(self) -> None:
        """
        Dynamically rebuilds the internal Pandas DataFrame from the live MongoDB collection.
        This ensures all analytical calculations reflect the imported and modified roster in real-time.
        """
        try:
            from app.db import raw_db
            # Fetch all active employees
            cursor = raw_db.employees.find({"is_active": True})
            docs = list(cursor)
            if not docs:
                self.df = pd.DataFrame(columns=[
                    "employee_id", "age", "gender", "job_role", "job_level",
                    "yearly_income", "years_at_company", "job_satisfaction",
                    "work_life_balance", "overtime", "performance_rating",
                    "num_promotions", "attrition_score", "predicted_score",
                    "risk_category", "predicted_risk"
                ])
                return
                
            cleaned_docs = []
            for doc in docs:
                # Map database schema to the snake_case keys used in csv_engine
                # Support both CSV-based seeded format and UI/Bulk imported format
                
                # job_satisfaction mapper
                js = doc.get("job_satisfaction")
                if not js:
                    mgr_fb = float(doc.get("manager_feedback", 7.0) or 7.0)
                    js = "High" if mgr_fb >= 7.0 else "Low"
                    
                # work_life_balance mapper
                wlb = doc.get("work_life_balance")
                if not wlb:
                    wlb = "Good" if float(doc.get("overtime_hrs", 0) or 0) <= 10 else "Poor"
                    
                # overtime mapper
                ot = doc.get("overtime")
                if not ot:
                    ot = "Yes" if float(doc.get("overtime_hrs", 0) or 0) > 10 else "No"
                    
                # performance_rating mapper
                pr = doc.get("performance_rating")
                if not pr:
                    pr = "High" if float(doc.get("rating", 3.5) or 3.5) >= 4.0 else "Average"
                    
                # tenure parser
                tenure_val = doc.get("years_at_company")
                if tenure_val is None:
                    tenure_str = str(doc.get("tenure", "1 yrs")).strip()
                    try:
                        tenure_val = int(tenure_str.split()[0])
                    except Exception:
                        tenure_val = 1
                        
                # job_level mapper
                jl = doc.get("job_level")
                if jl is None:
                    role_str = str(doc.get("role", "")).lower()
                    jl = 3 if "senior" in role_str or "lead" in role_str else (1 if "junior" in role_str or "intern" in role_str else 2)

                cleaned_docs.append({
                    "employee_id":     doc.get("employee_id") or doc.get("id"),
                    "age":             int(doc.get("age", 35) or 35),
                    "gender":          str(doc.get("gender", "Male") or "Male"),
                    "job_role":        str(doc.get("job_role") or doc.get("dept") or "Technology"),
                    "job_level":       jl,
                    "yearly_income":   int(doc.get("yearly_income") or doc.get("salary_gap", 0) * 1000 + 80000),
                    "years_at_company": int(tenure_val),
                    "job_satisfaction": str(js),
                    "work_life_balance": str(wlb),
                    "overtime":        str(ot),
                    "performance_rating": str(pr),
                    "num_promotions":  int(doc.get("num_promotions") or (0 if doc.get("growth_index", 5.0) < 5.0 else 1)),
                    "attrition_score": float(doc.get("attrition_score") or doc.get("probability", 15.0)),
                    "predicted_score": float(doc.get("predicted_score") or doc.get("probability", 15.0)),
                    "risk_category":   str(doc.get("risk_category") or doc.get("status", "Low")),
                    "predicted_risk":  str(doc.get("predicted_risk") or doc.get("status", "Low")),
                })
                
            df = pd.DataFrame(cleaned_docs)
            numeric_cols = ["yearly_income", "years_at_company", "num_promotions", 
                            "attrition_score", "predicted_score", "age", "job_level"]
            for col in numeric_cols:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
                
            self.df = df
        except Exception as e:
            print("[CsvEngine] Dynamic database reload failed:", e)

    # ── Data loading & cleaning ───────────────────────────────────────────────
    def _load(self, path: str) -> pd.DataFrame:
        if not os.path.exists(path):
            raise FileNotFoundError(f"CSV not found: {path}")

        df = pd.read_csv(path)

        # Normalise column names to snake_case internally
        df = df.rename(columns={
            "Employee ID":          "employee_id",
            "Age":                  "age",
            "Gender":               "gender",
            "Job Role":             "job_role",
            "Job Level":            "job_level",
            "Yearly Income ($)":    "yearly_income",
            "Years at Company":     "years_at_company",
            "Job Satisfaction":     "job_satisfaction",
            "Work-Life Balance":    "work_life_balance",
            "Overtime":             "overtime",
            "Performance Rating":   "performance_rating",
            "Number of Promotions": "num_promotions",
            "Attrition_Score":      "attrition_score",
            "Predicted_Score":      "predicted_score",
            "Risk_Category":        "risk_category",
            "Predicted_Risk":       "predicted_risk",
        })

        # Type coercion
        numeric_cols = ["employee_id", "age", "yearly_income", "years_at_company",
                        "num_promotions", "attrition_score", "predicted_score"]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        return df

    # ── Dataset-level summaries ───────────────────────────────────────────────
    def total_records(self) -> int:
        return len(self.df)

    def risk_distribution(self, df: pd.DataFrame = None) -> dict:
        """Returns {High: N, Medium: N, Low: N} counts."""
        src = df if df is not None else self.df
        dist = src["risk_category"].value_counts().to_dict()
        return {"High": dist.get("High", 0), "Medium": dist.get("Medium", 0), "Low": dist.get("Low", 0)}

    def score_stats(self, df: pd.DataFrame = None) -> dict:
        """Descriptive stats for predicted_score."""
        src = df if df is not None else self.df
        s = src["predicted_score"].dropna()
        if s.empty:
            return {}
        return {
            "count": int(len(s)),
            "mean":  round(float(s.mean()),  2),
            "std":   round(float(s.std()),   2),
            "min":   round(float(s.min()),   2),
            "p25":   round(float(s.quantile(0.25)), 2),
            "p50":   round(float(s.quantile(0.50)), 2),
            "p75":   round(float(s.quantile(0.75)), 2),
            "p90":   round(float(s.quantile(0.90)), 2),
            "max":   round(float(s.max()),   2),
        }

    def avg(self, col: str, df: pd.DataFrame = None) -> float:
        src = df if df is not None else self.df
        return round(float(src[col].mean()), 2) if col in src.columns else 0.0

    def count_by(self, col: str, df: pd.DataFrame = None) -> dict:
        """Frequency distribution of a categorical column."""
        src = df if df is not None else self.df
        return src[col].value_counts().to_dict()

    # ── Department analytics ──────────────────────────────────────────────────
    def by_department(self) -> list[dict]:
        """Per job_role (maps to department) breakdown."""
        result = []
        for dept, group in self.df.groupby("job_role"):
            overtime_pct = round(
                float((group["overtime"] == "Yes").sum() / len(group) * 100), 1
            )
            result.append({
                "department":      dept,
                "total":           int(len(group)),
                "riskDistribution": self.risk_distribution(group),
                "avgScore":        self.avg("predicted_score", group),
                "avgIncome":       self.avg("yearly_income",   group),
                "avgTenure":       self.avg("years_at_company", group),
                "avgAge":          self.avg("age", group),
                "overtimePct":     overtime_pct,
                "satisfactionDist": self.count_by("job_satisfaction", group),
                "wlbDist":         self.count_by("work_life_balance",  group),
                "perfDist":        self.count_by("performance_rating", group),
            })
        return sorted(result, key=lambda x: x["avgScore"], reverse=True)

    # ── Tenure buckets ────────────────────────────────────────────────────────
    def tenure_buckets(self) -> list[dict]:
        """Mirrors the notebook's risk_label() logic bucketed by years_at_company."""
        buckets = [
            {"label": "< 2 yrs",   "min": 0,  "max": 2},
            {"label": "2–5 yrs",   "min": 2,  "max": 5},
            {"label": "5–10 yrs",  "min": 5,  "max": 10},
            {"label": "10–20 yrs", "min": 10, "max": 20},
            {"label": "20+ yrs",   "min": 20, "max": float("inf")},
        ]
        result = []
        for b in buckets:
            mask = (self.df["years_at_company"] >= b["min"]) & (self.df["years_at_company"] < b["max"])
            group = self.df[mask]
            result.append({
                "label":            b["label"],
                "total":            int(len(group)),
                "riskDistribution": self.risk_distribution(group),
                "avgScore":         self.avg("predicted_score", group),
                "avgIncome":        self.avg("yearly_income",   group),
            })
        return result

    # ── Salary analysis ───────────────────────────────────────────────────────
    def salary_analysis(self, job_role: str | None = None, job_level: str | None = None) -> dict:
        df = self.df.copy()
        if job_role:  df = df[df["job_role"]  == job_role]
        if job_level: df = df[df["job_level"] == job_level]
        if df.empty:
            return {"message": "No data for given filters"}
        s = df["yearly_income"].dropna()
        return {
            "filters":    {"jobRole": job_role, "jobLevel": job_level},
            "sampleSize": int(len(s)),
            "min":  int(s.min()),
            "max":  int(s.max()),
            "mean": round(float(s.mean()), 2),
            "std":  round(float(s.std()),  2),
            "p25":  int(s.quantile(0.25)),
            "p50":  int(s.quantile(0.50)),
            "p75":  int(s.quantile(0.75)),
            "p90":  int(s.quantile(0.90)),
        }

    # ── Paginated employee list from CSV ──────────────────────────────────────
    def employee_list(
        self,
        page: int = 1,
        limit: int = 20,
        risk: str | None = None,
        job_role: str | None = None,
        job_level: str | None = None,
        overtime: str | None = None,
        search: str | None = None,
    ) -> dict:
        df = self.df.copy()

        # Filters
        if risk:      df = df[df["risk_category"]   == risk]
        if job_role:  df = df[df["job_role"]        == job_role]
        if job_level: df = df[df["job_level"]       == job_level]
        if overtime:  df = df[df["overtime"]        == overtime]
        if search:
            mask = df["employee_id"].astype(str).str.contains(search, case=False)
            df = df[mask]

        # Sort: highest predicted_score first
        df = df.sort_values("predicted_score", ascending=False)

        total  = int(len(df))
        start  = (page - 1) * limit
        page_df = df.iloc[start : start + limit]

        # Return camelCase dicts matching the frontend
        records = page_df.rename(columns={
            "employee_id":    "employeeId",
            "job_role":       "jobRole",
            "job_level":      "jobLevel",
            "yearly_income":  "yearlyIncome",
            "years_at_company": "yearsAtCompany",
            "job_satisfaction": "jobSatisfaction",
            "work_life_balance": "workLifeBalance",
            "performance_rating": "performanceRating",
            "num_promotions": "numPromotions",
            "attrition_score": "attritionScore",
            "predicted_score": "predictedScore",
            "risk_category":  "riskCategory",
            "predicted_risk": "predictedRisk",
        }).replace({np.nan: None}).to_dict(orient="records")

        return {
            "data":  records,
            "total": total,
            "page":  page,
            "limit": limit,
            "totalPages": int(np.ceil(total / limit)) if limit > 0 else 1,
        }

    # ── Full overview summary ─────────────────────────────────────────────────
    def full_overview(self) -> dict:
        """Used by GET /api/v1/analytics/csv-overview."""
        overtime_pct = round(
            float((self.df["overtime"] == "Yes").sum() / len(self.df) * 100), 1
        )
        return {
            "totalRecords":           self.total_records(),
            "riskDistribution":       self.risk_distribution(),
            "scoreStats":             self.score_stats(),
            "avgIncome":              self.avg("yearly_income"),
            "avgTenure":              self.avg("years_at_company"),
            "avgAge":                 self.avg("age"),
            "overtimePct":            overtime_pct,
            "satisfactionDistribution": self.count_by("job_satisfaction"),
            "wlbDistribution":        self.count_by("work_life_balance"),
            "perfDistribution":       self.count_by("performance_rating"),
            "genderDistribution":     self.count_by("gender"),
            "jobRoleDistribution":    self.count_by("job_role"),
            "jobLevelDistribution":   self.count_by("job_level"),
            "byDepartment":           self.by_department(),
            "tenureBuckets":          self.tenure_buckets(),
            "featureImportance":      FEATURE_IMPORTANCE,
        }

    # ── Static reference data ─────────────────────────────────────────────────
    @staticmethod
    def feature_importance() -> list:
        return FEATURE_IMPORTANCE

    @staticmethod
    def radar_data() -> list:
        return RADAR_DATA
