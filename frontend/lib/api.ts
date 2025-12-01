import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // 파일 업로드 (분석 요청)
  uploadSong: async (file: File, title: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    // 백엔드로 전송
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 분석 결과 조회
  getSong: async (id: number) => {
    const response = await axios.get(`${API_URL}/songs/${id}`);
    return response.data;
  },

  // 댓글 목록 조회
  getComments: async (id: number) => {
    const response = await axios.get(`${API_URL}/songs/${id}/comments`);
    return response.data;
  },

  // 댓글 작성
  addComment: async (id: number, username: string, content: string) => {
    const response = await axios.post(`${API_URL}/songs/${id}/comments`, null, {
      params: { username, content }
    });
    return response.data;
  }
};