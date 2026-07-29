import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

load_dotenv()

from app.db import db
jwt     = JWTManager()
bcrypt  = Bcrypt()


def create_app(config_name: str = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.url_map.strict_slashes = False

    # ── Configuration ──────────────────────────────────────────────────────────
    app.config["SECRET_KEY"]                     = os.getenv("SECRET_KEY", "dev-secret-key-at-least-32-characters-long")
    app.config["JWT_SECRET_KEY"]                 = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key-at-least-32-characters-long")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"]       = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 604800))

    # ── Extensions ─────────────────────────────────────────────────────────────
    jwt.init_app(app)
    bcrypt.init_app(app)

    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175").split(",")
    CORS(
        app,
        resources={r"/*": {"origins": origins}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ── Register blueprints ────────────────────────────────────────────────────
    from app.routes.auth      import auth_bp
    from app.routes.employees import employees_bp
    from app.routes.analytics import analytics_bp
    from app.routes.logs      import logs_bp
    from app.routes.copilot   import copilot_bp
    from app.routes.settings_route  import settings_bp
    from app.routes.reports   import reports_bp
    from app.routes.swagger   import swagger_bp

    app.register_blueprint(auth_bp,       url_prefix="/api/v1/auth")
    app.register_blueprint(employees_bp,  url_prefix="/api/v1/employees")
    app.register_blueprint(analytics_bp,  url_prefix="/api/v1/analytics")
    app.register_blueprint(logs_bp,       url_prefix="/api/v1/agent-logs")
    app.register_blueprint(copilot_bp,    url_prefix="/api/v1/copilot")
    app.register_blueprint(settings_bp,   url_prefix="/api/v1/settings")
    app.register_blueprint(reports_bp,    url_prefix="/api/v1/reports")
    app.register_blueprint(swagger_bp,    url_prefix="/api/v1/docs")

    # ── Health check ───────────────────────────────────────────────────────────
    @app.route("/health")
    def health():
        from app.services.csv_engine import CsvEngine
        from datetime import datetime, timezone
        engine = CsvEngine.instance()
        return {
            "success": True,
            "status":  "OK",
            "dataset_rows": len(engine.df),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # ── JWT error handlers ─────────────────────────────────────────────────────
    @jwt.unauthorized_loader
    def missing_token(reason):
        return {"success": False, "message": f"Token missing: {reason}"}, 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return {"success": False, "message": f"Invalid token: {reason}"}, 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_data):
        return {"success": False, "message": "Token expired"}, 401

    # ── Global error handlers ──────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return {"success": False, "message": "Route not found"}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"success": False, "message": "Method not allowed"}, 405

    @app.errorhandler(500)
    def internal_error(e):
        return {"success": False, "message": "Internal server error"}, 500

    # ── Initialize Background Scheduler ────────────────────────────────────────
    if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        try:
            from app.services.scheduler import setup_scheduler
            setup_scheduler()
        except Exception as e:
            print("[Scheduler] Failed to initialize background scheduler:", e)

    return app
