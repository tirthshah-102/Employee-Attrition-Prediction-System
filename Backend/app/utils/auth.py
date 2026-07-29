from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.utils.response import error


def jwt_required_custom(fn):
    """Identical to @jwt_required() but returns our standard error shape."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as exc:
            return error(str(exc), 401)
        return fn(*args, **kwargs)
    return wrapper


def roles_required(*roles):
    """
    Usage:  @roles_required("hr", "admin")
    Checks the 'role' field stored in the JWT additional claims.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as exc:
                return error(str(exc), 401)
            claims = get_jwt()
            if claims.get("role") not in roles:
                return error(f"Role '{claims.get('role')}' not authorised", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
