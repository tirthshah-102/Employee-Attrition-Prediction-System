import json
import queue
from datetime import datetime, timezone
from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required

from app.db import db
from app.models.log import AgentLog
from app.utils.response import success, error

logs_bp = Blueprint("logs", __name__)

subscribers = []

def dispatch_log(source: str, text: str, log_type: str = "info", employee_id: str = None):
    """
    Saves a log to the database and streams it to all active SSE subscribers.
    """
    log_dict = None
    try:
        log = AgentLog(
            source=source,
            text=text,
            type=log_type,
            employee_id=employee_id
        )
        log.save()
        log_dict = log.to_dict()
    except Exception as e:
        print("Error saving log to db:", e)
        log_dict = {
            "source": source,
            "text": text,
            "type": log_type,
            "employeeId": employee_id,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }

    for q in list(subscribers):
        try:
            q.put(log_dict)
        except Exception:
            try:
                subscribers.remove(q)
            except ValueError:
                pass

@logs_bp.get("/stream")
def stream_logs():
    def event_generator():
        q = queue.Queue()
        subscribers.append(q)
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                try:
                    # Check every 15s to keep connection alive and detect disconnects
                    log_data = q.get(timeout=15)
                    yield f"data: {json.dumps(log_data)}\n\n"
                except queue.Empty:
                    yield f"data: {json.dumps({'ping': True})}\n\n"
        except GeneratorExit:
            try:
                subscribers.remove(q)
            except ValueError:
                pass

    return Response(event_generator(), mimetype="text/event-stream")

# ── GET /api/v1/agent-logs ────────────────────────────────────────────────────
@logs_bp.get("/")
@jwt_required()
def list_logs():
    limit       = min(int(request.args.get("limit", 20)), 100)
    employee_id = request.args.get("employeeId")

    q = AgentLog.query
    if employee_id:
        q = q.filter_by(employee_id=employee_id)

    logs = q.order_by(AgentLog.created_at.desc()).limit(limit).all()
    # Return chronological order for display (oldest first)
    logs.reverse()

    return success({"logs": [l.to_dict() for l in logs]}, "Agent logs fetched")


# ── POST /api/v1/agent-logs ───────────────────────────────────────────────────
@logs_bp.post("/")
@jwt_required()
def create_log():
    data = request.get_json(silent=True) or {}
    if not data.get("source") or not data.get("text"):
        return error("source and text are required", 400)

    dispatch_log(
        source=data["source"],
        text=data["text"],
        log_type=data.get("type", "info"),
        employee_id=data.get("employeeId")
    )
    return success({}, "Log created and dispatched", 201)

