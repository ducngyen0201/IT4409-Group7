const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const discussionController = require('../controllers/discussionController');

//STT 51
router.patch('/:id', protect, discussionController.updatePost);

module.exports = router;