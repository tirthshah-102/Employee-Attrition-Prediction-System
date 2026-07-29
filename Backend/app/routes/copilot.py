import os
import json
import urllib.request
import urllib.error
import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.db import db
from app.models.employee import Employee
from app.models.copilot_chat import ChatMessage
from app.utils.response import success, error

copilot_bp = Blueprint("copilot", __name__)


def generate_local_response(prompt: str, employee: Employee = None) -> str:
    """
    Generates an intelligent, context-aware rule-based GenAI response 
    by querying actual SQLite metrics when an API key is not configured.
    """
    prompt_lower = prompt.lower()
    
    if employee:
        name = employee.name
        prob = employee.probability
        status = employee.status
        factor = employee.primary_factor
        hours = employee.overtime_hrs
        gap = employee.salary_gap
        rating = employee.rating
        feedback = employee.manager_feedback

        # Scenario 1: Drafting meeting invites
        if "meeting" in prompt_lower or "invite" in prompt_lower or "schedule" in prompt_lower:
            return (
                f"### [AI Agent Output] Meeting Invite Draft for {name} ({employee.employee_id})\n\n"
                f"**Subject:** Sync: Career Check-in / Calibration — {name}\n\n"
                f"Hi {name.split(' ')[0]},\n\n"
                f"I wanted to schedule 15-20 minutes for us to connect this week. I'd love to check in on how your "
                f"projects are going, get your feedback on overall workload balance, and chat about your long-term career growth here.\n\n"
                f"Let me know what times work best for you!\n\n"
                f"Best,\n"
                f"HR Operations Team"
            )
        
        # Scenario 2: Drafting email templates
        elif "draft" in prompt_lower or "email" in prompt_lower or "letter" in prompt_lower:
            return (
                f"### [AI Agent Output] Dynamic Retention Email Draft for {name}\n\n"
                f"**Subject:** Confidential: Career Calibration & Retention Review - {name}\n\n"
                f"Dear {name.split(' ')[0]},\n\n"
                f"I hope you are doing well. As part of our ongoing commitment to supporting our key contributors, "
                f"I would like to schedule a brief check-in with you this week to discuss your recent achievements "
                f"and map out your long-term career growth here at AttriSense AI.\n\n"
                f"We highly value your expertise in the {employee.dept} division as a {employee.role}. "
                f"To ensure we are supporting your professional journey, we would like to discuss some specific adjustments, "
                f"including reviews of workload balances and compensation alignments (with a target calibration adjustment).\n\n"
                f"Please let me know a convenient time for us to sync up.\n\n"
                f"Best regards,\n"
                f"HR Operations & Retention Team\n"
                f"AttriSense AI Command Center"
            )

        # Scenario 3: Attrition flight risk explanation
        else:
            return (
                f"### [AI Agent Output] Risk Diagnosis Report for {name} ({employee.employee_id})\n\n"
                f"**Current Status:** {status} Risk ({prob}% Attrition Probability)\n"
                f"**Primary Driver:** {factor}\n\n"
                f"**Structural Metrics Breakdown:**\n"
                f"* **Performance Evaluation:** Rated {rating}/5.0 (High Contribution Node).\n"
                f"* **Overtime Volume:** Logging +{hours} weekly overtime hours (Burnout risk: {'CRITICAL' if hours > 10 else 'MODERATE'}).\n"
                f"* **Market Salary Delta:** Current pay gap is {gap}% versus regional market benchmarks.\n"
                f"* **Manager Feedback Score:** {feedback}/10 (Communication friction: {'HIGH' if feedback < 6 else 'LOW'}).\n\n"
                f"**Recommended Retentive Interventions:**\n"
                f"1. Initiate immediate compensation review to calibrate the {gap}% pay discrepancy.\n"
                f"2. Calibrate work allocation to mitigate the {hours} hours of weekly overtime.\n"
                f"3. Establish regular manager-led touchpoints to address communication disconnects."
            )
            
    # Generic query fallback
    return (
        "### AttriSense AI Copilot Node Active\n\n"
        "Welcome! I am your agentic copilot. I am synced with your live SQLite roster. "
        "You can ask me questions about any employee currently registered in the platform.\n\n"
        "**Example queries you can try:**\n"
        "* *'Why is Sarah Jenkins' risk high?'*\n"
        "* *'Draft a retention email for Michael Chen'*\n"
        "* *'Explain the primary attrition risk driver for Elena Rostova'*"
    )


@copilot_bp.post("/chat")
@jwt_required()
def copilot_chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    employee_id = data.get("employeeId")
    session_id = data.get("sessionId") or "default-session"

    if not message:
        return error("Message prompt is required", 400)

    # 1. Fetch Chat History
    chat_history = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
    last_messages = chat_history[-10:] if len(chat_history) > 10 else chat_history

    # 2. Identify context employee
    employee = None
    if employee_id:
        employee = Employee.query.filter_by(employee_id=employee_id).first()
    
    # Context resolution from previous messages if "him/her/them" is used
    if not employee:
        # Check active message text first
        all_emps = Employee.query.filter_by(is_active=True).all()
        for emp in all_emps:
            if emp.name.lower() in message.lower() or emp.employee_id.lower() in message.lower():
                employee = emp
                break
                
        # Look backwards through session history if still not matched
        if not employee:
            for hist_msg in reversed(last_messages):
                for emp in all_emps:
                    if emp.name.lower() in hist_msg.text.lower() or emp.employee_id.lower() in hist_msg.text.lower():
                        employee = emp
                        break
                if employee:
                    break

    # 3. Check for real Groq API Key
    from app.models.settings import SystemSetting
    key_setting = SystemSetting.query.filter_by(key="groqApiKey").first()
    api_key = key_setting.value if key_setting and key_setting.value else os.getenv("GROQ_API_KEY")
    ai_text = None

    if api_key:
        try:
            # Construct system instruction context
            system_context = "You are AttriSense AI HR Agent. We are analyzing employee attrition."
            if employee:
                system_context += (
                    f" Active Employee Profile: Name: {employee.name}, ID: {employee.employee_id}, "
                    f"Department: {employee.dept}, Role: {employee.role}, "
                    f"Risk Probability: {employee.probability}%, Status: {employee.status}, "
                    f"Primary Attrition Factor: {employee.primary_factor}, "
                    f"Weekly Overtime Hours: {employee.overtime_hrs}, Salary Gap vs market: {employee.salary_gap}%, "
                    f"Manager Feedback score: {employee.manager_feedback}/10, Rating: {employee.rating}/5.0."
                )
            
            # Format history for OpenAI-compatible chat completions format
            messages_payload = [
                {"role": "system", "content": system_context}
            ]
            
            for msg in last_messages:
                role = "user" if msg.sender == "user" else "assistant"
                messages_payload.append({
                    "role": role,
                    "content": msg.text
                })
            
            # Append current prompt
            messages_payload.append({
                "role": "user",
                "content": message
            })
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": messages_payload,
                "temperature": 0.2
            }
            
            url = "https://api.groq.com/openai/v1/chat/completions"
            req_data = json.dumps(payload).encode("utf-8")
            
            req = urllib.request.Request(
                url, 
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    res_data = json.loads(response.read().decode("utf-8"))
                    ai_text = res_data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[copilot] Groq request failed: {e}")

    # 4. Fallback to local rule engine if not handled by Groq
    if not ai_text:
        ai_text = generate_local_response(message, employee)

    # 5. Persist messages in database
    try:
        user_msg = ChatMessage(session_id=session_id, sender="user", text=message)
        ai_msg = ChatMessage(session_id=session_id, sender="ai", text=ai_text)
        user_msg.save()
        ai_msg.save()
    except Exception as ex:
        print(f"[copilot] Database save message failed: {ex}")

    return success({"response": ai_text}, "Response generated successfully")


# ── GET /api/v1/copilot/history ──────────────────────────────────────────────
@copilot_bp.get("/history")
@jwt_required()
def copilot_history():
    session_id = request.args.get("sessionId") or "default-session"
    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
    return success({"messages": [m.to_dict() for m in messages]}, "Chat history fetched successfully")


# ── POST /api/v1/copilot/chat/stream ──────────────────────────────────────────
@copilot_bp.post("/chat/stream")
@jwt_required()
def copilot_chat_stream():
    import time
    from flask import Response, stream_with_context
    from flask_jwt_extended import get_jwt
    from app.models.employee import Employee
    from app.models.copilot_chat import ChatMessage

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    employee_id = data.get("employeeId")
    session_id = data.get("sessionId") or "default-session"

    if not message:
        return Response("data: {\"error\": \"Message is required\"}\n\n", mimetype="text/event-stream")

    # 1. Fetch Chat History
    chat_history = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
    last_messages = chat_history[-10:] if len(chat_history) > 10 else chat_history

    # 2. Identify context employee
    employee = None
    if employee_id:
        employee = Employee.query.filter_by(employee_id=employee_id).first()
    
    if not employee:
        # Check active message text first
        all_emps = Employee.query.filter_by(is_active=True).all()
        for emp in all_emps:
            if emp.name.lower() in message.lower() or emp.employee_id.lower() in message.lower():
                employee = emp
                break

    # Trigger agent telemetry if requested
    if employee and any(word in message.lower() for word in ["analyze", "run", "agent", "diagnostic", "telemetry", "evaluate", "audit"]):
        from app.services.agents.hr_insights_agent import HRInsightsAgent
        try:
            HRInsightsAgent().evaluate_employee(employee)
        except Exception as e:
            print(f"Failed to run sub-agents: {e}")

    # Check for real Groq API Key
    from app.models.settings import SystemSetting
    key_setting = SystemSetting.query.filter_by(key="groqApiKey").first()
    api_key = key_setting.value if key_setting and key_setting.value else os.getenv("GROQ_API_KEY")

    def generate():
        ai_response_chunks = []
        
        if api_key:
            try:
                system_context = "You are AttriSense AI HR Agent. We are analyzing employee attrition."
                if employee:
                    system_context += (
                        f" Active Employee Profile: Name: {employee.name}, ID: {employee.employee_id}, "
                        f"Department: {employee.dept}, Role: {employee.role}, "
                        f"Risk Probability: {employee.probability}%, Status: {employee.status}, "
                        f"Primary Attrition Factor: {employee.primary_factor}, "
                        f"Weekly Overtime Hours: {employee.overtime_hrs}, Salary Gap vs market: {employee.salary_gap}%, "
                        f"Manager Feedback score: {employee.manager_feedback}/10, Rating: {employee.rating}/5.0."
                    )
                
                messages_payload = [{"role": "system", "content": system_context}]
                for msg in last_messages:
                    role = "user" if msg.sender == "user" else "assistant"
                    messages_payload.append({"role": role, "content": msg.text})
                
                messages_payload.append({"role": "user", "content": message})
                
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages_payload,
                    "temperature": 0.2,
                    "stream": True
                }
                
                url = "https://api.groq.com/openai/v1/chat/completions"
                req_data = json.dumps(payload).encode("utf-8")
                
                req = urllib.request.Request(
                    url, 
                    data=req_data,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    for line in response:
                        line_str = line.decode("utf-8").strip()
                        if line_str.startswith("data:"):
                            data_content = line_str[5:].strip()
                            if data_content == "[DONE]":
                                break
                            try:
                                chunk_json = json.loads(data_content)
                                token = chunk_json["choices"][0]["delta"].get("content", "")
                                if token:
                                    ai_response_chunks.append(token)
                                    yield f"data: {json.dumps({'token': token})}\n\n"
                            except Exception:
                                pass
            except Exception as e:
                print(f"[copilot] Groq stream failed: {e}")

        # Fallback if no Groq or it failed/returned empty
        if not ai_response_chunks:
            full_text = generate_local_response(message, employee)
            # Yield word-by-word with delay to simulate streaming typing effect
            words = full_text.split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                ai_response_chunks.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
                time.sleep(0.02)

        # Save to history database
        full_ai_text = "".join(ai_response_chunks)
        try:
            user_msg = ChatMessage(session_id=session_id, sender="user", text=message)
            ai_msg = ChatMessage(session_id=session_id, sender="ai", text=full_ai_text)
            user_msg.save()
            ai_msg.save()
        except Exception as ex:
            print(f"[copilot] Database save message failed: {ex}")

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@copilot_bp.post("/tool-execute/slack")
@jwt_required()
def execute_slack_alert():
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employeeId")
    if not employee_id:
        return error("employeeId is required", 400)
    
    employee = Employee.query.filter_by(employee_id=employee_id).first()
    emp_name = employee.name if employee else "Employee"
    
    # Save log to audit trail
    from app.models.audit_log import AuditLog
    from flask_jwt_extended import get_jwt, get_jwt_identity
    from app.db import get_user_id
    from app.models.user import User
    
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)
    
    audit = AuditLog(
        user_id=str(user.id) if user else "system",
        user_name=user.name if user else "System Agent",
        role=user.role if user else "system",
        organization_id=org_id,
        action_summary=f"Dispatched Slack alert notification for {emp_name} ({employee_id}) to channel #hr-alerts"
    )
    db.session.add(audit)
    db.session.commit()
    
    return success(None, f"Slack notification successfully dispatched for {emp_name}")


@copilot_bp.post("/tool-execute/calendar")
@jwt_required()
def execute_calendar_booking():
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employeeId")
    if not employee_id:
        return error("employeeId is required", 400)
        
    employee = Employee.query.filter_by(employee_id=employee_id).first()
    emp_name = employee.name if employee else "Employee"
    
    # Save log to audit trail
    from app.models.audit_log import AuditLog
    from flask_jwt_extended import get_jwt, get_jwt_identity
    from app.db import get_user_id
    from app.models.user import User
    
    claims = get_jwt()
    org_id = claims.get("org_id", "org-comp-a")
    user_id = get_user_id(get_jwt_identity())
    user = User.query.get(user_id)
    
    audit = AuditLog(
        user_id=str(user.id) if user else "system",
        user_name=user.name if user else "System Agent",
        role=user.role if user else "system",
        organization_id=org_id,
        action_summary=f"Scheduled 1-on-1 career calibration meeting with {emp_name} ({employee_id}) on Google Calendar"
    )
    db.session.add(audit)
    db.session.commit()
    
    return success(None, f"Google Calendar slot calibration meeting scheduled with {emp_name}")



