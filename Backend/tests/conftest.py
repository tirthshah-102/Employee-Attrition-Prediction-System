import os
import pytest

# Force environment variable to use a test database before importing app
os.environ["MONGO_DB_NAME"] = "attrisense_test_db"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-at-least-32-characters"
os.environ["CSV_PATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/attrition_predictions.csv"))

from app import create_app
from app.db import db

@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    
    # Push app context
    with app.app_context():
        yield app
        
    # Clean up test database
    from app.db import client
    client.drop_database("attrisense_test_db")

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(app):
    from flask_jwt_extended import create_access_token
    with app.app_context():
        token = create_access_token(
            identity="test-admin-id",
            additional_claims={"role": "admin", "name": "Test Admin", "org_id": "org-comp-a"}
        )
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def manager_headers(app):
    from flask_jwt_extended import create_access_token
    with app.app_context():
        token = create_access_token(
            identity="test-manager-id",
            additional_claims={"role": "hr", "name": "Test Manager", "org_id": "org-comp-a"}
        )
        return {"Authorization": f"Bearer {token}"}
