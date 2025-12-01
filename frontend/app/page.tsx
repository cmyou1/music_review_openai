'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Music, Loader2, PlayCircle, Clock, Flame, Heart, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [recentSongs, setRecentSongs] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot'); // 기본값: 인기순

  // 목록 가져오기 (정렬 기준 반영)
  const fetchSongs = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/songs?sort=${sortBy}`);
      setRecentSongs(response.data);
    } catch (e) {
      console.error("Failed to load songs", e);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [sortBy]);

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

  // 좋아요 버튼 클릭
  const handleLike = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.post(`http://127.0.0.1:8000/api/songs/${id}/like`);
      fetchSongs(); // 즉시 새로고침
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* 헤더 */}
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
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white outline-none" placeholder="곡 제목" />
                <button type="submit" disabled={isUploading || !file} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition disabled:opacity-50">
                  {isUploading ? <Loader2 className="animate-spin" /> : "분석 시작"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 리스트 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              {sortBy === 'hot' ? <Flame className="mr-2 text-red-500" /> : <PlayCircle className="mr-2 text-purple-500" />}
              {sortBy === 'hot' ? 'HOT 분석 (주목도 순)' : '최신 분석'}
            </h2>
            
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              <button onClick={() => setSortBy('hot')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center ${sortBy === 'hot' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                <Flame className="w-4 h-4 mr-1 text-red-500" /> 인기
              </button>
              <button onClick={() => setSortBy('new')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center ${sortBy === 'new' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                <Clock className="w-4 h-4 mr-1 text-blue-500" /> 최신
              </button>
            </div>
          </div>
          
          {recentSongs.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
              아직 데이터가 없습니다.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSongs.map((song) => (
                <Link href={`/song/${song.id}`} key={song.id} className="group">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-gray-800/80 transition duration-300 h-full flex flex-col relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-purple-500/10 p-3 rounded-full"><Music className="w-6 h-6 text-purple-400" /></div>
                      <div className="flex flex-col gap-2 items-end">
                        <button onClick={(e) => handleLike(e, song.id)} className="flex items-center text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-full border border-gray-700 transition">
                          <Heart className="w-3 h-3 mr-1 text-red-500 fill-red-500/20" />{song.likes || 0}
                        </button>
                        <div className="flex items-center text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full border border-gray-800">
                          <MessageSquare className="w-3 h-3 mr-1 text-blue-400" />{song.comments ? song.comments.length : 0}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-purple-400">{song.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">{song.initial_analysis}</p>
                    <div className="text-purple-400 text-sm font-bold flex items-center mt-auto">분석 보러가기 →</div>
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