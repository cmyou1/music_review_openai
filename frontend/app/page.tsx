'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Music, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 파일 선택 시 처리하는 함수 (여기가 수정됨!)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // 제목이 비어있으면 파일명에서 확장자(.mp3)를 떼고 자동으로 채워줌
      if (!title) {
        const autoTitle = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(autoTitle);
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return; // 파일만 있으면 진행 (제목은 아래서 처리)

    // 만약 사용자가 제목을 지웠다면 파일명으로 다시 채움
    const finalTitle = title.trim() || file.name.replace(/\.[^/.]+$/, "");

    setIsUploading(true);
    try {
      const data = await api.uploadSong(file, finalTitle);
      router.push(`/song/${data.id}`);
    } catch (error) {
      console.error("Upload failed", error);
      alert("업로드 중 오류가 발생했습니다.");
      setIsUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            AI Music Review
          </h1>
          <p className="mt-2 text-gray-400">OpenAI GPT-4o 기반 사운드 정밀 분석</p>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-6 bg-gray-900 p-8 rounded-2xl border border-gray-800">
          <div className="flex flex-col items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <Music className="w-8 h-8 text-green-400 mb-2" />
                    <p className="text-sm text-gray-300">{file.name}</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">MP3 파일을 여기에 드래그</p>
                  </>
                )}
              </div>
              {/* onChange 함수 교체됨 */}
              <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-purple-500 outline-none text-white placeholder-gray-500"
              placeholder="곡 제목 (파일 선택 시 자동 입력됨)"
            />
          </div>

          <button
            type="submit"
            // 제목 조건(!title)을 제거했습니다. 파일만 있으면 활성화됩니다.
            disabled={isUploading || !file}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2" /> AI 분석 중...
              </>
            ) : (
              "분석 시작하기"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}