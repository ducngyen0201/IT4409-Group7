const express = require('express');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const courseController = require('../controllers/courseController');
const enrollmentRoutes = require('./enrollmentRoutes');
const { protect, isTeacher, isStudent, isAdmin } = require('../middleware/authMiddleware');
const instructorController = require('../controllers/instructorController');
const progressController = require('../controllers/progressController');

//STT 10
router.post('/', protect, isTeacher, courseController.createCourse);

//STT 9
router.get('/', courseController.getAllPublishedCourses);

//STT 11
router.get('/:id', courseController.getCourseDetails);

//STT 12
router.patch('/:id', protect, isTeacher, courseController.updateCourse);

//STT 26
router.post('/:id/lectures',protect,isTeacher,lectureController.createLecture);

//STT 13
router.post('/:id/request-review', protect, isTeacher, courseController.requestCourseReview);

//STT 19
router.post('/:id/enroll',protect,isStudent,courseController.requestEnrollment);

//STT 14
router.post('/:id/approve', protect, isAdmin, courseController.approveCourse);

//STT 15
router.post('/:id/reject', protect, isAdmin, courseController.rejectCourse);

//STT 16
router.get('/:id/instructors', protect, instructorController.getInstructors);

//STT 17
router.post('/:id/instructors', protect, isTeacher, instructorController.addInstructor);

//STT 18
router.delete('/:id/instructors/:userId', protect, isTeacher, instructorController.removeInstructor);

//STT 25
router.get('/:id/lectures', lectureController.getLecturesByCourse);

//STT 55
router.get('/:id/progress', protect, isTeacher, progressController.getCourseProgressForTeacher);

router.use('/:id/enrollments', enrollmentRoutes);

module.exports = router;