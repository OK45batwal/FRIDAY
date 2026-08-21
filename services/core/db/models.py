import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from services.core.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self, count: int = 0):
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": count
        }

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    input_type = Column(String(50), default="text")  # text, voice, system
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_json = Column(JSON, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "input_type": self.input_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "metadata": self.metadata_json or {}
        }
