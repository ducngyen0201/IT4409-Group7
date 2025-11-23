const express = require('express');
const router = express.Router();

const { protect, isTeacher } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig'); 
const materialController = require('../controllers/materialController'); 
const lectureController = require('../controllers/lectureController');
const quizController = require('../controllers/quizController');
const discussionController = require('../controllers/discussionController');
const progressController = require('../controllers/progressController');

//STT 30
router.post(
  '/:id/materials', 
  protect,
  isTeacher,
  upload.single('material'),
  materialController.uploadMaterial
);

//STT 27
router.get(
  '/:id',
  protect,
  lectureController.getLectureDetails
);

//STT 33
router.post(
  '/:id/quiz',
  protect,
  isTeacher,
  quizController.createQuiz
);

//STT 48
router.post(
  '/:id/threads', 
  protect,
  discussionController.createThread
);

//STT 47
router.get(
  '/:id/threads',
  protect,
  discussionController.getThreadsByLecture
);

//STT 53
router.post(
  '/:id/progress',
  protect, 
  progressController.updateLectureProgress
);

//STT 28
router.patch('/:id', protect, isTeacher, lectureController.updateLecture);

//STT 29
router.post('/:id/publish', protect, isTeacher, lectureController.publishLecture);

//STT 32
router.get('/:id/quiz', protect, quizController.getQuizByLecture);

module.exports = router;