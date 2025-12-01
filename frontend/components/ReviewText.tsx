'use client';

import { useState, useRef, useEffect } from 'react';
import { instrumentDictionary } from '@/lib/instruments';
import { Play, Pause, Info, Volume2 } from 'lucide-react';

export default function ReviewText({ content }: { content: string }) {
  if (!content) return null;

  const keywords = Object.keys(instrumentDictionary);
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = content.split(regex);

  return (
    <div className="whitespace-pre-line text-gray-300 leading-relaxed text-sm md:text-base">
      {parts.map((part, index) => {
        const matchedKeyword = Object.keys(instrumentDictionary).find(
          key => key.toLowerCase() === part.toLowerCase()
        );

        if (matchedKeyword) {
          return <InstrumentTooltip key={index} keyword={matchedKeyword} originalText={part} />;
        }
        return part;
      })}
    </div>
  );
}

function InstrumentTooltip({ keyword, originalText }: { keyword: string, originalText: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = instrumentDictionary[keyword];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // ✅ 타이머 저장소

  // ✅ 마우스 들어왔을 때: 닫기 예약 취소하고 열기
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  // ✅ 마우스 나갔을 때: 바로 닫지 않고 0.2초 기다림 (틈새 건너갈 시간 벌기)
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); // 200ms 지연
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    // 컴포넌트 사라질 때 타이머 정리
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  return (
    <span 
      className="relative inline-block z-10 mx-0.5"
      onMouseEnter={handleMouseEnter} // ✅ 부모 요소에서 이벤트 감지
      onMouseLeave={handleMouseLeave}
    >
      {/* 텍스트 */}
      <span className="text-purple-400 font-bold cursor-pointer border-b border-dashed border-purple-500 hover:text-purple-200 hover:bg-purple-900/50 px-1 rounded transition select-none">
        {originalText}
      </span>

      {/* 툴팁 박스 */}
      {isOpen && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 border border-purple-500/50 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200"
          // ✅ 툴팁 위에서도 마우스 이벤트를 유지해야 함 (안 그러면 툴팁 안에서 움직일 때 닫힘)
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800">
            <h4 className="font-bold text-white flex items-center text-base">
              <Info className="w-4 h-4 mr-2 text-purple-400" />
              {keyword}
            </h4>
            
            {info.audioSrc && (
              <button
                onClick={toggleAudio}
                className="flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1 rounded-full transition space-x-1"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{isPlaying ? '정지' : '소리 듣기'}</span>
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-300 leading-snug">{info.description}</p>

          {info.audioSrc && (
            <audio ref={audioRef} src={info.audioSrc} onEnded={() => setIsPlaying(false)} />
          )}

          {/* 말풍선 꼬리 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-gray-900/90" />
        </div>
      )}
    </span>
  );
}