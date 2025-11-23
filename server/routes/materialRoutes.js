const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const materialController = require('../controllers/materialController');

//STT 31
router.delete('/:id', protect, isTeacher, materialController.deleteMaterial);

module.exports = router;