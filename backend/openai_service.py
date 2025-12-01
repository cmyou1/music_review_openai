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

        response = client.chat.completions.create(
            model=MODEL_NAME,
            modalities=["text"],
            messages=[
                {"role": "system", "content": "너는 전문 사운드 엔지니어다. 음악을 듣고 기술적(주파수, 악기, 믹싱 등)으로 분석해라."},
                {"role": "user", "content": [
                    {"type": "text", "text": f"곡 제목: '{song_title}'. 이 곡의 사운드 디자인과 구성을 분석해줘."},
                    {"type": "input_audio", "input_audio": {"data": base64_audio, "format": "mp3"}}
                ]}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"오류 발생: {str(e)}"