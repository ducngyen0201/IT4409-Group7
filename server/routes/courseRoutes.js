const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const courseController = require('../controllers/courseController');
const enrollmentRoutes = require('./enrollmentRoutes');
const { protect, isTeacher, isStudent, isAdmin, identifyUser } = require('../middleware/authMiddleware');
const instructorController = require('../controllers/instructorController');
const progressController = require('../controllers/progressController');

// --- 1. CÁC ROUTE KHÔNG CÓ THAM SỐ ID (STATIC ROUTES) ---
// Phải đặt lên trên cùng để không bị nhầm là ID
// STT 10: Tạo khóa học
router.post('/', protect, isTeacher, courseController.createCourse);

// STT 9: Lấy danh sách khóa học
router.get('/', courseController.getAllPublishedCourses);

router.get('/public', courseController.getAllPublishedCourses); 

// --- 2. CÁC ROUTE CÓ THAM SỐ ID (:id) ---
// STT 12: Cập nhật khóa học
router.patch('/:id', protect, isTeacher, courseController.updateCourse);

// STT 26: Tạo bài giảng
router.post('/:id/lectures', protect, isTeacher, lectureController.createLecture);

// STT 13: Yêu cầu review
router.post('/:id/request-review', protect, isTeacher, courseController.requestCourseReview);

// STT 19: Đăng ký học
router.post('/:id/enroll', protect, isStudent, courseController.requestEnrollment);

// STT 14: Duyệt khóa học (Admin)
router.post('/:id/approve', protect, isAdmin, courseController.approveCourse);

// STT 15: Từ chối khóa học (Admin)
router.post('/:id/reject', protect, isAdmin, courseController.rejectCourse);

// STT 16: Lấy danh sách giảng viên
router.get('/:id/instructors', protect, instructorController.getInstructors);

// STT 17: Thêm giảng viên
router.post('/:id/instructors', protect, isTeacher, instructorController.addInstructor);

router.get('/:id/check-instructor', protect, instructorController.checkInstructorPermission);

// STT 18: Xóa giảng viên
router.delete('/:id/instructors/:userId', protect, isTeacher, instructorController.removeInstructor);

// STT 25: Lấy bài giảng
router.get('/:id/lectures', identifyUser, lectureController.getLecturesByCourse);

// STT 55: Lấy tiến độ
router.get('/:id/progress', protect, isTeacher, progressController.getCourseProgressForTeacher);

// Thống kê (Teacher)
router.get('/:id/stats', protect, isTeacher, courseController.getCourseStats);

// Route con: Enrollments
router.use('/:id/enrollments', enrollmentRoutes);

// --- [SỬA LẠI VỊ TRÍ] STT 11: Lấy chi tiết khóa học ---
router.get('/:id', identifyUser, courseController.getCourseDetails);

module.exports = router;