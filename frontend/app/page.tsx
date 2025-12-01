'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Music, Loader2, PlayCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // 최근 분석된 곡 리스트
  const [recentSongs, setRecentSongs] = useState<any[]>([]);

  // 페이지 로드 시 최신 곡 목록 가져오기
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songs = await api.getAllSongs();
        setRecentSongs(songs);
      } catch (e) {
        console.error("Failed to load songs", e);
      }
    };
    fetchSongs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const finalTitle = title.trim() || file.name.replace(/\.[^/.]+$/, "");
    setIsUploading(true);
    try {
      const data = await api.uploadSong(file, finalTitle);
      router.push(`/song/${data.id}`);
    } catch (error) {
      alert("업로드 실패");
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* 섹션 1: 헤더 및 업로드 */}
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
              AI Music Community
            </h1>
            <p className="text-gray-400 text-lg">
              OpenAI GPT-4o가 분석하고, 우리가 완성하는 사운드
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="max-w-xl mx-auto bg-gray-900/50 backdrop-blur-md p-8 rounded-3xl border border-gray-800 shadow-2xl">
            <div className="space-y-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer hover:bg-gray-800/50 transition group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <Music className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition" />
                      <p className="text-sm text-white font-medium">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition" />
                      <p className="text-sm text-gray-400">MP3 파일을 드래그하거나 클릭하세요</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:border-purple-500 outline-none text-white placeholder-gray-600 text-sm"
                  placeholder="곡 제목 (자동 입력)"
                />
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : "분석 시작"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 섹션 2: 커뮤니티 피드 (최신 분석글) */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <PlayCircle className="mr-2 text-purple-500" /> 최신 분석 리포트
          </h2>
          
          {recentSongs.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
              아직 분석된 곡이 없습니다. 첫 번째 주인공이 되어보세요! 🎵
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSongs.map((song) => (
                <Link href={`/song/${song.id}`} key={song.id} className="group">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-gray-800/80 transition duration-300 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-purple-500/10 p-3 rounded-full">
                        <Music className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-xs text-gray-500 flex items-center bg-black/30 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" /> 
                        {new Date(song.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition truncate">
                      {song.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                      {song.initial_analysis === "Analyzing..." 
                        ? "AI가 열심히 분석하고 있습니다..." 
                        : song.initial_analysis}
                    </p>
                    
                    <div className="text-purple-400 text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition">
                      리포트 보러가기 →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}