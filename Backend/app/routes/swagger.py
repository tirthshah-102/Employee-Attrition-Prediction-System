from flask import Blueprint, jsonify, render_template_string

swagger_bp = Blueprint("swagger", __name__)

SWAGGER_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AttriSense AI - API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -y-scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #070a13; }
        .swagger-ui { filter: invert(0.9) hue-rotate(180deg); }
        .swagger-ui .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: "/api/v1/docs/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout"
            });
        };
    </script>
</body>
</html>
"""

SWAGGER_SPEC = {
    "openapi": "3.0.0",
    "info": {
        "title": "AttriSense AI - REST API Engine",
        "description": "Production API specs for the workforce intelligence retention platform.",
        "version": "1.0.0"
    },
    "servers": [
        {"url": "/api/v1"}
    ],
    "paths": {
        "/auth/login": {
            "post": {
                "summary": "Operator Login",
                "description": "Authenticates HR/Admin user session. Returns JWT authorization token.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "email": {"type": "string", "example": "admin@attrisense.ai"},
                                    "password": {"type": "string", "example": "admin"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Authentication successful. Token returned."}
                }
            }
        },
        "/employees/": {
            "get": {
                "summary": "List Employees",
                "description": "Queries monitored employee rosters with risk parameters and departments.",
                "responses": {
                    "200": {"description": "Roster listings returned successfully."}
                }
            }
        },

        "/settings/audit-trail": {
            "get": {
                "summary": "Compliance Audit Trail Explorer",
                "description": "Fetches SOC 2 compliance trail logs with search queries and page offsets.",
                "responses": {
                    "200": {"description": "Paginated audit logs list."}
                }
            }
        }
    }
}

@swagger_bp.get("/")
def get_swagger_ui():
    return render_template_string(SWAGGER_HTML)

@swagger_bp.get("/swagger.json")
def get_swagger_json():
    return jsonify(SWAGGER_SPEC)
