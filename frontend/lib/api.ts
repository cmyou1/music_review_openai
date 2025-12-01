import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // 1. 파일 업로드 (분석 요청)
  uploadSong: async (file: File, title: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 2. [NEW] 전체 곡 목록 조회 (커뮤니티 피드용) 👈 이게 없어서 에러가 났던 겁니다!
  getAllSongs: async () => {
    const response = await axios.get(`${API_URL}/songs`);
    return response.data;
  },

  // 3. 특정 곡 상세 조회
  getSong: async (id: number) => {
    const response = await axios.get(`${API_URL}/songs/${id}`);
    return response.data;
  },

  // 4. 댓글 목록 조회
  getComments: async (id: number) => {
    const response = await axios.get(`${API_URL}/songs/${id}/comments`);
    return response.data;
  },

  // 5. 댓글 작성
  addComment: async (id: number, username: string, content: string) => {
    const response = await axios.post(`${API_URL}/songs/${id}/comments`, null, {
      params: { username, content }
    });
    return response.data;
  },

  // 6. [NEW] AI 재분석 요청 (피드백 반영)
  refineAnalysis: async (id: number) => {
    const response = await axios.post(`${API_URL}/songs/${id}/refine`);
    return response.data;
  }
};