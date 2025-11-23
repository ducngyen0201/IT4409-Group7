const express = require('express');
const router = express.Router();
const { protect, isTeacher } = require('../middleware/authMiddleware');
const discussionController = require('../controllers/discussionController');

//STT 50
router.post('/:id/posts', protect, discussionController.createPost);

//STT 49
router.get('/:id/posts', protect, discussionController.getPostsByThread);

//STT 52
router.post('/:id/close', protect, isTeacher, discussionController.closeThread);

module.exports = router;