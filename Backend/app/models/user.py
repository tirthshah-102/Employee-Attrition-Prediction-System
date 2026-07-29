from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class User:
    """
    Represents an AtriSense platform user (MongoDB collection: users).
    """
    __tablename__ = "users"
    VALID_ROLES = {"hr", "admin", "manager", "employee"}

    # Mock Field Expressions for query sorting/ilike compatibility
    name: Any = MongoFieldExpr("name")
    email: Any = MongoFieldExpr("email")
    role: Any = MongoFieldExpr("role")
    query: Any = None

    def __init__(self, name, email, role="hr", organization_id="org-comp-a", is_active=True, mfa_enabled=False, mfa_secret=None, password=None, id=None, _id=None, last_login=None, created_at=None, department=None, needs_password_reset=False):
        self.id = id or _id
        self.name = name
        self.email = email
        self.role = role
        self.organization_id = organization_id
        self.is_active = is_active
        self.mfa_enabled = mfa_enabled
        self.mfa_secret = mfa_secret
        self.password = password
        self.last_login = last_login
        self.created_at = created_at or datetime.now(timezone.utc)
        self.department = department
        self.needs_password_reset = needs_password_reset

    def set_password(self, plain: str) -> None:
        from app import bcrypt
        self.password = bcrypt.generate_password_hash(plain).decode("utf-8")

    def check_password(self, plain: str) -> bool:
        from app import bcrypt
        if not self.password:
            return False
        return bcrypt.check_password_hash(self.password, plain)

    @classmethod
    def get(cls, user_id):
        return MongoQuery(db.users, User).get(user_id)

    @classmethod
    def get_or_404(cls, user_id):
        user = cls.get(user_id)
        if not user:
            from werkzeug.exceptions import NotFound
            raise NotFound("User not found")
        return user

    def save(self):
        # Insert or update
        from bson import ObjectId
        doc = {
            "name": self.name,
            "email": self.email.lower().strip() if self.email else "",
            "role": self.role,
            "organization_id": self.organization_id,
            "is_active": self.is_active,
            "mfa_enabled": self.mfa_enabled,
            "mfa_secret": self.mfa_secret,
            "password": self.password,
            "last_login": self.last_login,
            "created_at": self.created_at,
            "department": self.department,
            "needs_password_reset": self.needs_password_reset
        }
        if self.id:
            try:
                db.users.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.users.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.users.insert_one(doc)
            self.id = str(res.inserted_id)

    def delete_doc(self):
        from bson import ObjectId
        if self.id:
            try:
                db.users.delete_one({"_id": ObjectId(self.id)})
            except Exception:
                db.users.delete_one({"_id": self.id})

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return User(
            id=str(doc.get("_id")),
            name=doc.get("name"),
            email=doc.get("email"),
            role=doc.get("role", "hr"),
            organization_id=doc.get("organization_id", "org-comp-a"),
            is_active=doc.get("is_active", True),
            mfa_enabled=doc.get("mfa_enabled", False),
            mfa_secret=doc.get("mfa_secret"),
            password=doc.get("password"),
            last_login=doc.get("last_login"),
            created_at=doc.get("created_at"),
            department=doc.get("department"),
            needs_password_reset=doc.get("needs_password_reset", False)
        )

    def to_dict(self) -> dict:
        return {
            "id":              str(self.id) if self.id else None,
            "name":            self.name,
            "email":           self.email,
            "role":            self.role,
            "organization_id": self.organization_id,
            "is_active":       self.is_active,
            "mfa_enabled":     self.mfa_enabled,
            "last_login":      self.last_login.isoformat() if isinstance(self.last_login, datetime) else self.last_login,
            "created_at":      self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "department":      self.department,
            "needs_password_reset": self.needs_password_reset
        }

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"

# Expose a class-level query attribute as well
User.query = MongoQueryProperty(db.users, User)
