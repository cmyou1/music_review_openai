from fastapi import FastAPI, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import hashlib
import shutil
import os
import uuid
import time

from database import SessionLocal, init_db, Song, Comment
import openai_service

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 안전 삭제 함수
def safe_delete(file_path: str):
    if not os.path.exists(file_path):
        return
    for i in range(3):
        try:
            os.remove(file_path)
            print(f"🗑️ 파일 삭제 완료: {file_path}")
            return
        except Exception as e:
            print(f"⚠️ 삭제 재시도 ({i+1}/3): {e}")
            time.sleep(0.5)

def calculate_file_hash(file_path: str):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

async def process_ai_analysis(song_id: int, file_path: str, title: str):
    db = SessionLocal()
    try:
        analysis_result = openai_service.analyze_audio_with_openai(file_path, title)
        
        song = db.query(Song).filter(Song.id == song_id).first()
        if song:
            song.initial_analysis = analysis_result
            db.commit()
            print(f"✅ 분석 완료 (Song ID: {song_id})")
        
    except Exception as e:
        print(f"❌ 분석 실패: {e}")
    finally:
        db.close()
        safe_delete(file_path)

# --- API 엔드포인트 ---

@app.post("/api/analyze")
async def analyze_song(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db)
):
    os.makedirs("uploads", exist_ok=True)
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = f"uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_hash = calculate_file_hash(file_path)
    existing_song = db.query(Song).filter(Song.file_hash == file_hash).first()
    
    if existing_song:
        safe_delete(file_path)
        return {"id": existing_song.id, "status": "cached"}

    new_song = Song(title=title, file_hash=file_hash, initial_analysis="Analyzing...")
    db.add(new_song)
    db.commit()
    db.refresh(new_song)
    
    background_tasks.add_task(process_ai_analysis, new_song.id, file_path, title)
    
    return {"id": new_song.id, "status": "processing"}

@app.get("/api/songs")
def get_all_songs(skip: int = 0, limit: int = 20, sort: str = "new", db: Session = Depends(get_db)):
    songs = db.query(Song).all()
    if sort == "hot":
        # 인기순 (좋아요 + 댓글*3)
        songs.sort(key=lambda x: x.likes + (len(x.comments) * 3), reverse=True)
    else:
        # 최신순
        songs.sort(key=lambda x: x.created_at, reverse=True)
    return songs[skip : skip + limit]

@app.get("/api/songs/{song_id}")
def get_song(song_id: int, db: Session = Depends(get_db)):
    return db.query(Song).filter(Song.id == song_id).first()

@app.post("/api/songs/{song_id}/comments")
def add_comment(song_id: int, username: str, content: str, db: Session = Depends(get_db)):
    comment = Comment(song_id=song_id, username=username, content=content)
    db.add(comment)
    db.commit()
    return {"status": "success"}

@app.get("/api/songs/{song_id}/comments")
def get_comments(song_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.song_id == song_id).all()

@app.post("/api/songs/{song_id}/like")
def like_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if song:
        song.likes += 1
        db.commit()
        return {"status": "success", "likes": song.likes}
    return {"status": "error"}

# ✅ [최종] AI 재분석 (양식 강제 + 피드백 로그)
@app.post("/api/songs/{song_id}/refine")
async def refine_analysis(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    comments = db.query(Comment).filter(Comment.song_id == song_id).all()
    
    if not song or not comments:
        return {"status": "no_data"}

    comments_text = "\n".join([f"- {c.username}: {c.content}" for c in comments])
    
    from openai_service import client, MODEL_NAME
    
    # 모델명 강제 설정 (텍스트 처리는 gpt-4o가 더 안정적일 수 있음, 여기선 기존 모델 사용)
    # 템플릿과 피드백 로그를 강제하는 강력한 프롬프트
    prompt = f"""
    당신은 수석 사운드 엔지니어입니다.
    사용자들의 [피드백]을 반영하여, 반드시 아래 **[출력 양식]**에 맞춰 분석 리포트를 **전면 재작성**하세요.
    이전 분석 내용은 무시하고, 양식에 맞춰 새로 쓰세요.

    [기존 분석 데이터]:
    {song.initial_analysis}

    [사용자 피드백]:
    {comments_text}

    [출력 양식 (엄수)]:
    ## 📢 피드백 반영 리포트 (Feedback Log)
    - **반영된 의견**: (어떤 의견을 반영했는지 구체적으로)
    - **거절된 의견**: (전문가적 관점에서 기각한 의견과 이유)

    ---

    ## 1. 📋 곡 개요 (Overview)
    - **장르**:
    - **분위기**:
    - **BPM**:

    ## 2. 🎚️ 사운드 밸런스 (Frequency & Mix)
    - **Low**:
    - **Mid**:
    - **High**:
    - **Stereo Image**:

    ## 3. 🎹 타임라인 상세 분석 (Timeline)
    - **Intro**:
    - **Build-up**:
    - **Drop**:
    - **Breakdown**:

    ## 4. 💡 총평 (Engineer's Note)
    - (요약)
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME, # gpt-4o-audio-preview
            modalities=["text"],
            messages=[
                {"role": "system", "content": "너는 양식을 철저히 지키는 전문가다."},
                {"role": "user", "content": prompt}
            ]
        )
        refined = response.choices[0].message.content
        
        song.initial_analysis = refined
        db.commit()
        return {"status": "success"}
    except Exception as e:
        print(f"Refine Error: {e}") # 백엔드 콘솔에 에러 출력
        return {"status": "error", "message": str(e)}