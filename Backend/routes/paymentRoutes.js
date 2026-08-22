import express from 'express';
import { initiatePayment, handlePaymentWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, initiatePayment);

// Webhook should be public so external provider can hit it
router.route('/webhooks/payment')
  .post(handlePaymentWebhook);

export default router;
