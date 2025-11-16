const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const courseController = require('../controllers/courseController');
const enrollmentRoutes = require('./enrollmentRoutes');
const { protect, isTeacher, isStudent } = require('../middleware/authMiddleware');


router.post('/', protect, isTeacher, courseController.createCourse);
router.get('/', courseController.getAllPublishedCourses);
router.get('/:id', courseController.getCourseDetails);
router.patch('/:id', protect, isTeacher, courseController.updateCourse);
router.post('/:id/lectures',protect,isTeacher,lectureController.createLecture);
router.post('/:id/request-review', protect, isTeacher, courseController.requestCourseReview);
router.post('/:id/enroll',protect,isStudent,courseController.requestEnrollment);
router.use('/:id/enrollments', enrollmentRoutes);

module.exports = router;