import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 1. REQUEST INTERCEPTOR (Gửi đi) ---
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ sessionStorage (khớp với AuthContext của bạn)
    const token = sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 2. RESPONSE INTERCEPTOR (Nhận về) ---
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về response thành công
    return response;
  },
  (error) => {
    // Xử lý các lỗi chung
    const { response } = error;

    // Nếu lỗi là 401 (Unauthorized) -> Token hết hạn hoặc sai
    if (response && response.status === 401) {
      // Xóa token bẩn
      sessionStorage.removeItem('token');
      
      // Tùy chọn: Đá về trang login nếu không phải đang ở đó
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }

    // Ném lỗi ra để component (try-catch) xử lý tiếp (hiện thông báo...)
    return Promise.reject(error);
  }
);

export default axiosClient;