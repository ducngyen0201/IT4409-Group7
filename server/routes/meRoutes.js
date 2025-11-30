const express = require('express');
const router = express.Router(); 

const { protect, isStudent, isTeacher } = require('../middleware/authMiddleware');
const meController = require('../controllers/meController');
const progressController = require('../controllers/progressController');
const notificationController = require('../controllers/notificationController');

//STT 4
router.get(
  '/',
  protect,
  meController.getMe
);

//STT 5
router.patch(
  '/',
  protect,
  meController.updateMe
);

//STT 24
router.get(  '/enrollments', protect, isStudent, meController.getMyEnrollments);

//STT 46
router.get('/quizzes', protect, isStudent, meController.getMyQuizzes);

//STT 54
router.get(
  '/courses/:courseId/progress', protect, isStudent, progressController.getCourseProgress);

//STT 56
router.get( '/notifications', protect, notificationController.getMyNotifications);

//STT 57
router.post('/notifications/:id/read', protect, notificationController.markAsRead);

// Đổi mật khẩu
router.patch(
  '/password',
  protect, 
  meController.changePassword
);

router.get(
  '/teaching',
  protect,
  isTeacher,
  meController.getMyTeachingCourses
);

module.exports = router;