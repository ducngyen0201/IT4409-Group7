const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const systemController = require('../controllers/systemController');

//STT 58
router.get('/admin/audit-logs', protect, isAdmin, systemController.getAuditLogs);

//STT 59
router.get('/health', protect, isAdmin, systemController.getHealth);

//STT 60
router.get('/version', protect, isAdmin, systemController.getVersion);

module.exports = router;