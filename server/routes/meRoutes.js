const express = require('express');
const router = express.Router(); 

const { protect, isStudent, isTeacher } = require('../middleware/authMiddleware');
const meController = require('../controllers/meController');
const progressController = require('../controllers/progressController');
const notificationController = require('../controllers/notificationController');
const upload = require('../utils/multerConfig'); 

// STT 4: Lấy thông tin cá nhân
// URL: GET /api/me
router.get(
  '/',
  protect,
  meController.getMe
);

// --- [ĐÃ SỬA] TÁCH RA 2 ROUTE RIÊNG BIỆT ---

// STT 5a: Chỉ cập nhật thông tin văn bản (Tên, SĐT...)
// URL: PATCH /api/me/info
router.patch(
  '/info',
  protect,
  meController.updateInfo
);

// STT 5b: Chỉ cập nhật Avatar (Upload ảnh)
// URL: PATCH /api/me/avatar
router.patch(
  '/avatar',
  protect,
  upload.single('avatar'), // Middleware Multer chỉ dùng ở đây
  meController.updateAvatar
);

// ------------------------------------------

// STT 24: Lấy khóa học đã đăng ký
router.get('/enrollments', protect, isStudent, meController.getMyEnrollments);

// STT 46: Lấy danh sách bài thi đã làm
router.get('/quizzes', protect, isStudent, meController.getMyQuizzes);

// STT 54: Xem tiến độ học tập
router.get('/courses/:courseId/progress', protect, isStudent, progressController.getCourseProgress);

// STT 56: Lấy thông báo
router.get('/notifications', protect, notificationController.getMyNotifications);

// STT 57: Đánh dấu đã đọc thông báo
router.post('/notifications/:id/read', protect, notificationController.markAsRead);

// Đổi mật khẩu
router.patch(
  '/password',
  protect, 
  meController.changePassword
);

// Lấy danh sách khóa học tôi dạy (Giáo viên)
router.get(
  '/teaching',
  protect,
  isTeacher,
  meController.getMyTeachingCourses
);

module.exports = router;