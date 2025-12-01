'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link'; // ✅ 링크 기능 추가
import { api } from '@/lib/api';
import { MessageSquare, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'; // ✅ 화살표 아이콘 추가

export default function SongDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const [song, setSong] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // 데이터 로딩 로직 (기존과 동일)
  useEffect(() => {
    if (isNaN(id)) return;
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const songData = await api.getSong(id);
        const commentsData = await api.getComments(id);
        setSong(songData);
        setComments(commentsData);

        if (songData.initial_analysis && songData.initial_analysis !== "Analyzing...") {
          setIsAnalyzing(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Error:", e);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // 댓글 등록 로직 (기존과 동일)
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    await api.addComment(id, "User", newComment);
    setNewComment("");
    const updated = await api.getComments(id);
    setComments(updated);
  };

  // 재분석 요청 로직 (기존과 동일 + 예외처리)
  const handleRefine = async () => {
    if (comments.length === 0) {
      alert("AI에게 전달할 피드백(댓글)이 없습니다!");
      return;
    }
    setIsAnalyzing(true);
    await api.refineAnalysis(id); // API 호출 (api.ts에 추가 필요)
    
    // 즉시 재로딩 시작
    const updatedSong = await api.getSong(id);
    setSong(updatedSong);
    setIsAnalyzing(false);
  };

  if (!song) return <div className="min-h-screen bg-black text-white p-12 flex justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ✅ [추가됨] 상단 네비게이션 (홈으로 가기) */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          다른 곡 분석하러 가기
        </Link>

        {/* 헤더 */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {song.title}
          </h1>
          <div className="text-sm font-medium">
            {isAnalyzing ? (
              <span className="text-yellow-400 flex items-center bg-yellow-400/10 px-3 py-1 rounded-full w-fit">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> AI 분석 및 피드백 반영 중...
              </span>
            ) : (
              <span className="text-green-400 flex items-center bg-green-400/10 px-3 py-1 rounded-full w-fit">
                <CheckCircle className="w-4 h-4 mr-2" /> 분석 완료
              </span>
            )}
          </div>
        </div>

        {/* 컨텐츠 그리드 */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* 왼쪽: AI 분석 리포트 */}
          <div className="md:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-purple-400 mb-6 border-b border-gray-800 pb-2">🎧 사운드 분석 리포트</h2>
            <div className="prose prose-invert max-w-none whitespace-pre-line text-gray-300 leading-relaxed text-sm md:text-base">
              {song.initial_analysis === "Analyzing..." 
                ? "잠시만 기다려주세요. AI가 오디오를 듣고 있습니다..." 
                : song.initial_analysis}
            </div>
          </div>

          {/* 오른쪽: 댓글창 & 재분석 */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 h-[500px] flex flex-col">
              
              {/* 헤더 + 재분석 버튼 */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center text-white">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-400" /> 피드백
                </h2>
                {/* ✅ 재분석 버튼 */}
                <button 
                  onClick={handleRefine}
                  disabled={isAnalyzing}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full border border-gray-500 transition flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  AI 재분석
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">
                    분석 내용이 틀렸나요?<br/>댓글을 남기고 'AI 재분석'을 눌러보세요!
                  </p>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="bg-gray-800/80 p-3 rounded-xl text-sm border border-gray-700">
                      <span className="font-bold text-blue-400 block mb-1">{c.username}</span>
                      <p className="text-gray-300">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-auto">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-sm text-white mb-3 outline-none focus:border-purple-500 transition"
                  placeholder="의견을 입력하세요..."
                  rows={3}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition"
                >
                  등록
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}