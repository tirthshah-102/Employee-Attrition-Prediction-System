import io
from flask import Blueprint, send_file, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
import pandas as pd
from datetime import datetime, timezone

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.db import db
from app.models.employee import Employee
from app.models.settings import SystemSetting
from app.models.audit_log import AuditLog
from app.models.user import User
from app.utils.response import success, error

reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/export/pdf")
@jwt_required()
def export_pdf():
    # Fetch all employees
    employees = Employee.query.all()
    total_headcount = len(employees)
    high_risk_count = len([e for e in employees if getattr(e, 'probability', 0) >= 65.0])
    avg_risk = sum(getattr(e, 'probability', 0) for e in employees) / max(total_headcount, 1)

    # Count primary factors
    factors = {}
    for e in employees:
        f = getattr(e, 'primary_factor', 'None')
        factors[f] = factors.get(f, 0) + 1
    top_factor = max(factors, key=factors.get) if factors else "None"

    # Set up ReportLab Document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=30
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=15,
        spaceAfter=10
    )

    story = []

    # Title
    story.append(Paragraph("AttriSense AI - Attrition & Retention Executive Brief", title_style))
    story.append(Paragraph(f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    story.append(Spacer(1, 10))

    # Executive Summary Stats
    summary_data = [
        ["Metrices", "Value"],
        ["Total Monitored Employees", str(total_headcount)],
        ["Critical Attrition Risk Cases (>=65%)", str(high_risk_count)],
        ["Average Attrition Probability", f"{avg_risk:.1f}%"],
        ["Primary Attrition Driver Group", top_factor]
    ]
    summary_table = Table(summary_data, colWidths=[250, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0,0), (1,0), colors.white),
        ('FONTNAME', (0,0), (1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(Paragraph("Executive Summary Statistics", section_heading))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Detailed Risks Breakdown Table
    story.append(Paragraph("Monitored Attrition Risk Profiles", section_heading))
    detailed_data = [["Employee ID", "Name", "Department", "Role", "Probability", "Status"]]
    for emp in employees[:15]: # Show top 15 for brevity in brief
        detailed_data.append([
            emp.employee_id,
            emp.name,
            emp.dept,
            emp.role,
            f"{emp.probability:.1f}%",
            emp.status
        ])
    
    detailed_table = Table(detailed_data, colWidths=[80, 100, 80, 100, 70, 70])
    detailed_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#475569')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(detailed_table)
    story.append(Spacer(1, 15))
    story.append(Paragraph("*Note: Only showing first 15 records in this executive summary report.", styles['Italic']))

    doc.build(story)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name="executive_attrition_brief.pdf",
        mimetype="application/pdf"
    )


@reports_bp.get("/export/excel")
@jwt_required()
def export_excel():
    # Fetch all employees
    employees = Employee.query.all()
    
    # Build list of dicts for export
    export_data = []
    for emp in employees:
        export_data.append({
            "Employee ID": emp.employee_id,
            "Name": emp.name,
            "Email": emp.email,
            "Department": emp.dept,
            "Role": emp.role,
            "Tenure": emp.tenure,
            "Risk Probability": f"{emp.probability:.2f}%",
            "Attrition Status": emp.status,
            "Primary Driver": emp.primary_factor,
            "Overtime Hours": emp.overtime_hrs,
            "Salary Gap Percent": emp.salary_gap,
            "Performance Rating": emp.rating
        })

    df = pd.DataFrame(export_data)
    
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attrition Analytics Dashboard")
    
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name="executive_attrition_report.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@reports_bp.get("/scheduler")
@jwt_required()
def get_scheduler_settings():
    enabled = SystemSetting.query.filter_by(key="schedulerEnabled").first()
    interval = SystemSetting.query.filter_by(key="schedulerIntervalMinutes").first()
    email_recipients = SystemSetting.query.filter_by(key="schedulerRecipients").first()

    # Defaults
    res = {
        "enabled": (enabled.value == "true") if enabled else True,
        "intervalMinutes": int(interval.value) if interval else 15,
        "recipients": email_recipients.value if email_recipients else "admin@attrisense.ai"
    }
    return success(res, "Scheduler settings fetched")


@reports_bp.post("/scheduler")
@jwt_required()
def update_scheduler_settings():
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    from app.db import get_user_id
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)

    data = request.get_json(silent=True) or {}
    
    enabled = data.get("enabled", True)
    interval = data.get("intervalMinutes", 15)
    recipients = data.get("recipients", "admin@attrisense.ai")

    # Save settings
    set_enabled = SystemSetting.query.filter_by(key="schedulerEnabled").first()
    if set_enabled:
        set_enabled.value = "true" if enabled else "false"
        set_enabled.save()
    else:
        db.session.add(SystemSetting(key="schedulerEnabled", value="true" if enabled else "false"))

    set_interval = SystemSetting.query.filter_by(key="schedulerIntervalMinutes").first()
    if set_interval:
        set_interval.value = str(interval)
        set_interval.save()
    else:
        db.session.add(SystemSetting(key="schedulerIntervalMinutes", value=str(interval)))

    set_recps = SystemSetting.query.filter_by(key="schedulerRecipients").first()
    if set_recps:
        set_recps.value = str(recipients)
        set_recps.save()
    else:
        db.session.add(SystemSetting(key="schedulerRecipients", value=str(recipients)))

    db.session.commit()

    # Log to audit trail
    audit = AuditLog(
        user_id=str(user.id),
        user_name=user.name,
        role=user.role,
        organization_id=org_id,
        action_summary=f"Updated report scheduler to {interval}m interval, target: {recipients}"
    )
    db.session.add(audit)
    db.session.commit()

    return success({
        "enabled": enabled,
        "intervalMinutes": interval,
        "recipients": recipients
    }, "Scheduler settings updated successfully")
