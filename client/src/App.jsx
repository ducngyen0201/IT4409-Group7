import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage'; 
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';

function App() {
  return (
    <div>
      {/* Đây là nơi định nghĩa các "trang" của bạn */}
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;