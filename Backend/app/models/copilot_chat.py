from datetime import datetime, timezone
from typing import Any
from app.db import db, MongoQuery, MongoFieldExpr, MongoQueryProperty

class ChatMessage:
    """
    Persists multi-turn conversations for Copilot workspace (MongoDB collection: chat_messages).
    """
    __tablename__ = "chat_messages"

    session_id: Any = MongoFieldExpr("session_id")
    created_at: Any = MongoFieldExpr("created_at")
    query: Any = None

    def __init__(self, session_id, sender, text, created_at=None, id=None, _id=None):
        self.id = id or _id
        self.session_id = session_id
        self.sender = sender
        self.text = text
        self.created_at = created_at or datetime.now(timezone.utc)

    def save(self):
        from bson import ObjectId
        doc = {
            "session_id": self.session_id,
            "sender": self.sender,
            "text": self.text,
            "created_at": self.created_at
        }
        if self.id:
            try:
                db.chat_messages.update_one({"_id": ObjectId(self.id)}, {"$set": doc})
            except Exception:
                db.chat_messages.update_one({"_id": self.id}, {"$set": doc})
        else:
            res = db.chat_messages.insert_one(doc)
            self.id = str(res.inserted_id)

    @staticmethod
    def from_dict(doc: dict):
        if not doc:
            return None
        return ChatMessage(
            id=str(doc.get("_id")),
            session_id=doc.get("session_id"),
            sender=doc.get("sender"),
            text=doc.get("text"),
            created_at=doc.get("created_at")
        )

    def to_dict(self) -> dict:
        return {
            "id":         str(self.id) if self.id else None,
            "sessionId":  self.session_id,
            "sender":     self.sender,
            "text":       self.text,
            "createdAt":  self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

# Expose Query helper
ChatMessage.query = MongoQueryProperty(db.chat_messages, ChatMessage)
