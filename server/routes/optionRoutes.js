const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const optionController = require('../controllers/optionController');

//STT 39
router.patch('/:id', protect, isTeacher, optionController.updateOption);

//STT 40
router.delete('/:id', protect, isTeacher, optionController.deleteOption);

module.exports = router;