from datetime import datetime, timezone
from flask import jsonify


def success(data: dict | None = None, message: str = "Success", status: int = 200):
    return jsonify({
        "success":   True,
        "message":   message,
        "data":      data or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), status


def error(message: str = "An error occurred", status: int = 500, errors=None):
    body = {
        "success":   False,
        "message":   message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if errors is not None:
        body["errors"] = errors
    return jsonify(body), status


def paginated(data: list, total: int, page: int, limit: int, message: str = "Success"):
    import math
    return jsonify({
        "success": True,
        "message": message,
        "data":    data,
        "pagination": {
            "total":      total,
            "page":       page,
            "limit":      limit,
            "totalPages": math.ceil(total / limit) if limit else 1,
            "hasNext":    page * limit < total,
            "hasPrev":    page > 1,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200
