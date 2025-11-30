const express = require('express');
const router = express.Router();
const { protect, isTeacher, isStudent } = require('../middleware/authMiddleware');
const questionController = require('../controllers/questionController');
const attemptController = require('../controllers/attemptController');
const quizController = require('../controllers/quizController');

//STT 34
router.patch('/:id', protect, isTeacher, quizController.updateQuiz);

//STT 35
router.post('/:id/publish', protect, isTeacher, quizController.publishQuiz);

//STT 36
router.post('/:id/questions', protect, isTeacher, questionController.createQuestion);

//STT 41
router.post('/:id/attempts', protect, isStudent, attemptController.startAttempt);

//STT 45
router.get('/:id/grade', protect, quizController.getQuizGrade);

// API Mới: Lấy danh sách câu hỏi (Teacher)
router.get('/:id/questions', protect, isTeacher, questionController.getQuestionsForTeacher);

router.get('/:id', protect, quizController.getQuizById);

module.exports = router;