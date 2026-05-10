const express = require('express');
const { getScreen, updateScreen } = require('../controllers/screenController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', getScreen);
router.put('/', authMiddleware, adminMiddleware, updateScreen);

module.exports = router;