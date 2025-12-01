'use client';

import { useEffect, useState, use } from 'react'; // ✅ 'use' 추가됨
import { api } from '@/lib/api';
import { MessageSquare, RefreshCw, CheckCircle } from 'lucide-react';

// ✅ params의 타입이 Promise로 변경됨
export default function SongDetail({ params }: { params: Promise<{ id: string }> }) {
  // ✅ React.use()를 사용하여 params(Promise)를 언래핑(해제)해야 함
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);

  const [song, setSong] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);

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
        console.error("데이터 로딩 에러:", e);
      }
    };

    fetchData(); 
    interval = setInterval(fetchData, 3000); 

    return () => clearInterval(interval);
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    await api.addComment(id, "User", newComment);
    setNewComment("");
    const updated = await api.getComments(id);
    setComments(updated);
  };

  if (!song) return <div className="min-h-screen bg-black text-white p-12 flex justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 헤더 */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {song.title}
          </h1>
          <div className="text-sm font-medium">
            {isAnalyzing ? (
              <span className="text-yellow-400 flex items-center bg-yellow-400/10 px-3 py-1 rounded-full w-fit">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> AI 분석 진행 중 (OpenAI GPT-4o)
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
                ? "잠시만 기다려주세요. AI가 오디오 파형을 듣고 있습니다..." 
                : song.initial_analysis}
            </div>
          </div>

          {/* 오른쪽: 댓글창 */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 h-[500px] flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center text-white">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-400" /> 피드백 & 토론
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">첫 의견을 남겨주세요!</p>
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
                  placeholder="분석에 대한 의견을 남겨주세요..."
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