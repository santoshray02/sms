from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Stream(Base):
    """
    Stream model for Class 11-12 (Science/Commerce/Arts)
    """
    __tablename__ = "streams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # Science, Commerce, Arts
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    classes = relationship("Class", back_populates="stream")

    def __repr__(self):
        return f"<Stream {self.name}>"
