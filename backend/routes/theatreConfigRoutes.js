const express = require('express');
const { getTheatreConfig, updateTheatreConfig } = require('../controllers/theatreConfigController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', getTheatreConfig);
router.put('/', authMiddleware, adminMiddleware, updateTheatreConfig);

module.exports = router;