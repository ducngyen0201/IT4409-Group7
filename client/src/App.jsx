// file: client/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage'; // <-- Import
import LoginPage from './pages/LoginPage'; // <-- Import

function App() {
  return (
    <div>
      {/* Đây là nơi định nghĩa các "trang" của bạn */}
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Chúng ta sẽ thêm trang chủ (Homepage) sau */}
        {/* <Route path="/" element={<HomePage />} /> */}
      </Routes>
    </div>
  );
}

export default App;