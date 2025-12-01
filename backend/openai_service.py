import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = "gpt-4o-audio-preview"

def analyze_audio_with_openai(file_path: str, song_title: str):
    print(f"📡 OpenAI 분석 요청: {song_title}")
    try:
        with open(file_path, "rb") as audio_file:
            base64_audio = base64.b64encode(audio_file.read()).decode("utf-8")

        # ✅ [핵심] AI에게 "양식(Template)"을 강제하는 프롬프트
        system_prompt = """
        당신은 수석 사운드 엔지니어입니다. 
        음악을 분석할 때 반드시 아래 **[분석 양식]**을 엄격하게 지켜서 출력하세요.
        서론이나 인사말은 생략하고, 바로 본론으로 들어가세요.

        [분석 양식]
        ## 1. 📋 곡 개요 (Overview)
        - **장르(Genre)**: (예: Future Bass, Tech House...)
        - **분위기(Vibe)**: (예: Energetic, Emotional...)
        - **예상 BPM**: (약 ~ BPM)

        ## 2. 🎚️ 사운드 밸런스 (Frequency & Mix)
        - **Low (Bass/Kick)**: (저역대 분석)
        - **Mid (Vocal/Synth)**: (중역대 악기 및 보컬 분석)
        - **High (Hat/FX)**: (고역대 및 공간감 분석)
        - **Stereo Image**: (스테레오 이미지가 넓은지, 모노에 가까운지)

        ## 3. 🎹 타임라인 상세 분석 (Timeline)
        - **Intro**: (시작 부분의 악기 구성)
        - **Build-up**: (긴장감을 고조시키는 요소)
        - **Drop / Chorus**: (가장 에너지가 높은 구간의 특징)
        - **Breakdown**: (쉬어가는 구간)

        ## 4. 💡 총평 (Engineer's Note)
        - (사운드 엔지니어 관점에서의 믹싱/마스터링 평가 및 요약)
        """

        response = client.chat.completions.create(
            model=MODEL_NAME,
            modalities=["text"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": f"곡 제목: '{song_title}'. 이 곡을 위 양식대로 분석해줘."},
                    {"type": "input_audio", "input_audio": {"data": base64_audio, "format": "mp3"}}
                ]}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"오류 발생: {str(e)}"