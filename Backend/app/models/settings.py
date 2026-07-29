from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQueryProperty


class SystemSetting:
    """
    Persists system settings and threshold variables (MongoDB collection: system_settings)
    """
    __tablename__ = "system_settings"
    query: Any = None

    def __init__(self, key, value, created_at=None, updated_at=None, id=None, _id=None):
        self.id = id or _id
        self.key = key
        self.value = value
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at,
            "updated_at": datetime.now(timezone.utc)
        }
        if self.id:
            try:
                db.system_settings.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.system_settings.update_one({"_id": self.id}, {"$set": doc})
        else:
            # Check for unique key constraint manually
            db.system_settings.delete_many({"key": self.key})
            res = db.system_settings.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return SystemSetting(
            id=str(doc.get("_id")),
            key=doc.get("key"),
            value=doc.get("value"),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at")
        )

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "value": self.value,
            "updatedAt": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }

    def __repr__(self) -> str:
        return f"<SystemSetting {self.key} = {self.value}>"

# Expose query helper
SystemSetting.query = MongoQueryProperty(db.system_settings, SystemSetting)
