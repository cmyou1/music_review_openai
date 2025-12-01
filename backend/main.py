from fastapi import FastAPI, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import hashlib, shutil, os
from database import SessionLocal, init_db, Song, Comment
import openai_service

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
init_db()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def calculate_file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(4096), b""): h.update(b)
    return h.hexdigest()

async def process_ai(song_id: int, path: str, title: str):
    db = SessionLocal()
    try:
        result = openai_service.analyze_audio_with_openai(path, title)
        song = db.query(Song).filter(Song.id == song_id).first()
        if song:
            song.initial_analysis = result
            db.commit()
    finally:
        db.close()
        if os.path.exists(path): os.remove(path)

@app.post("/api/analyze")
async def analyze(bg_tasks: BackgroundTasks, file: UploadFile = File(...), title: str = Form(...), db: Session = Depends(get_db)):
    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"
    with open(path, "wb") as b: shutil.copyfileobj(file.file, b)

    h = calculate_file_hash(path)
    exist = db.query(Song).filter(Song.file_hash == h).first()
    if exist:
        os.remove(path)
        return {"id": exist.id, "status": "cached"}

    new_song = Song(title=title, file_hash=h, initial_analysis="Analyzing...")
    db.add(new_song)
    db.commit()
    db.refresh(new_song)
    bg_tasks.add_task(process_ai, new_song.id, path, title)
    return {"id": new_song.id, "status": "processing"}

@app.get("/api/songs/{id}")
def get_song(id: int, db: Session = Depends(get_db)):
    return db.query(Song).filter(Song.id == id).first()

@app.post("/api/songs/{id}/comments")
def add_comment(id: int, username: str, content: str, db: Session = Depends(get_db)):
    db.add(Comment(song_id=id, username=username, content=content))
    db.commit()
    return {"status": "ok"}

@app.get("/api/songs/{id}/comments")
def get_comments(id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.song_id == id).all()

# --- main.py 맨 아래에 추가 ---

@app.get("/api/songs")
def get_all_songs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    # 최신순(내림차순)으로 20개 가져오기
    songs = db.query(Song).order_by(Song.created_at.desc()).offset(skip).limit(limit).all()
    return songs