// frontend/lib/instruments.ts

export interface InstrumentInfo {
  description: string;
  audioSrc?: string; // 오디오 파일 경로 (나중에 채워넣으세요)
}

// 💡 팁: 여기에 단어를 계속 추가하면 알아서 하이라이팅 됩니다.
export const instrumentDictionary: Record<string, InstrumentInfo> = {
  "브라스": {
    description: "금관악기(트럼펫, 트롬본 등) 소리를 흉내 낸 웅장하고 팡파레 같은 사운드입니다.",
    audioSrc: "/instruments/brass.mp3"
  },
  "신스": {
    description: "전기로 소리를 합성해 만드는 악기입니다. 찌릿하거나 몽환적인 소리 등 다양합니다.",
    audioSrc: "/instruments/synth.mp3"
  },
  "베이스": {
    description: "곡의 무게중심을 잡아주는 아주 낮은 음역대의 묵직한 소리입니다.",
    audioSrc: "/instruments/bass.mp3"
  },
  "킥": {
    description: "드럼의 가장 큰 북 소리입니다. '쿵!' 하고 심장을 때리는 역할을 합니다.",
    audioSrc: "/instruments/kick.mp3"
  },
  "스네어": {
    description: "드럼의 작은 북 소리입니다. '착!' 하고 리듬의 엑센트를 줍니다.",
    audioSrc: "/instruments/snare.mp3"
  },
  "하이햇": {
    description: "드럼의 심벌즈 소리입니다. '치치치' 거리며 빠른 리듬감을 만듭니다.",
    audioSrc: "/instruments/hihat.mp3"
  },
  "패드": {
    description: "배경에 깔리는 은은하고 넓은 공간감을 주는 소리입니다.",
    audioSrc: "/instruments/pad.mp3"
  },
  "리버브": {
    description: "소리가 동굴이나 홀에서 울리는 듯한 잔향 효과(에코)입니다.",
    audioSrc: "/instruments/reverb.mp3"
  },
  "사이드체인": {
    description: "킥 드럼이 나올 때 다른 소리의 볼륨을 줄여, 꿀렁거리는 리듬감을 만드는 기법입니다.",
    audioSrc: "/instruments/sidechain.mp3"
  }
};