import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage'; 
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateCoursePage from './pages/teacher/CreateCoursePage';
import TeacherCourseDetail from './pages/teacher/TeacherCourseDetail';
import LearningPage from './pages/LearningPage';
import MyCoursesPage from './pages/student/MyCoursesPage';
import TeacherQuizEditor from './pages/teacher/TeacherQuizEditor';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import VideoCallPage from './pages/VideoCallPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16"> 
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
          
          <Route path="/profile" element={
            <ProtectedRoute roles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/video-call/:roomId?" element={
            <ProtectedRoute roles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <VideoCallPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage/courses/create" 
            element={
              <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                <CreateCoursePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage/courses/:id" 
            element={
              <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                <TeacherCourseDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage/lectures/:lectureId/quiz/new" 
            element={
              <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                <TeacherQuizEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage/quizzes/:quizId" 
            element={
              <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                <TeacherQuizEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:id/learn" 
            element={
              <ProtectedRoute roles={['STUDENT', 'TEACHER', 'ADMIN']}>
                <LearningPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-courses" 
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <MyCoursesPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;