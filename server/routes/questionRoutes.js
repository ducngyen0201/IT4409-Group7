const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const optionController = require('../controllers/optionController');
const questionController = require('../controllers/questionController');

//STT 37
router.patch('/:id', protect, isTeacher, questionController.updateQuestion);

//STT 38
router.post('/:id/options', protect, isTeacher, optionController.createOption);

module.exports = router;