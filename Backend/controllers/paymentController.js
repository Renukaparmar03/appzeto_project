import Order from '../models/orderModel.js';
import crypto from 'crypto';

// Simulated payment database for idempotency
const processedPayments = new Set();
const processedWebhooks = new Set();

// @desc    Initiate mock payment
// @route   POST /api/payments
// @access  Private
export const initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, idempotencyKey } = req.body;

    if (!orderId || !amount || !idempotencyKey) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (processedPayments.has(idempotencyKey)) {
      return res.status(200).json({ message: 'Payment already initiated', idempotencyKey });
    }

    const order = await Order.findOne({ orderId, user: req.user._id });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
       return res.status(400).json({ message: `Cannot initiate payment for order in ${order.status} state` });
    }

    // Mark order as processing payment
    order.status = 'PAYMENT_PROCESSING';
    await order.save();

    // Add to processed
    processedPayments.add(idempotencyKey);

    // Mock response
    res.status(200).json({
      message: 'Payment initiated successfully. Awaiting webhook confirmation.',
      transactionId: crypto.randomBytes(16).toString('hex'),
      amount: order.totalPrice
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Handle mock payment webhook
// @route   POST /api/webhooks/payment
// @access  Public
export const handlePaymentWebhook = async (req, res) => {
  try {
    const { orderId, transactionId, status, eventId } = req.body;

    // Webhook idempotency
    if (processedWebhooks.has(eventId)) {
      return res.status(200).json({ message: 'Webhook already processed' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    processedWebhooks.add(eventId);

    if (status === 'SUCCESS') {
      if (order.status === 'PAYMENT_PROCESSING' || order.status === 'PENDING') {
        order.status = 'PAID';
        order.isPaid = true;
        order.paidAt = Date.now();
        await order.save();
      }
    } else if (status === 'FAILED') {
      if (order.status === 'PAYMENT_PROCESSING' || order.status === 'PENDING') {
        order.status = 'PAYMENT_FAILED';
        await order.save();
      }
    } else if (status === 'TIMEOUT') {
      // In a real scenario, this might trigger a background job to check status with provider
       if (order.status === 'PAYMENT_PROCESSING') {
          order.status = 'PAYMENT_FAILED';
          await order.save();
       }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Webhook Processing Error' });
  }
};
