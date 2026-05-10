const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.post('/create-order', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);

module.exports = router;