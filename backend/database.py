from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./music_review.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    file_hash = Column(String, unique=True, index=True)
    initial_analysis = Column(Text)
    likes = Column(Integer, default=0) # ✅ 좋아요 추가됨
    created_at = Column(DateTime, default=datetime.utcnow)

    comments = relationship("Comment", back_populates="song") # ✅ 댓글 연결

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    song_id = Column(Integer, ForeignKey("songs.id"))
    username = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    song = relationship("Song", back_populates="comments") # ✅ 노래 연결

def init_db():
    Base.metadata.create_all(bind=engine)