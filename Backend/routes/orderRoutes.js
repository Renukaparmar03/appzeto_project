import express from 'express';
import {
  addOrderItems,
  getOrderById,
  getUserOrders,
  cancelOrder,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, admin, optionalAuth } from '../middleware/authMiddleware.js'; // Assuming auth middleware exists

const router = express.Router();

// Required routes from user prompt:
// POST /api/orders
// GET /api/orders
// GET /api/orders/:id
// POST /api/orders/:id/cancel

router.route('/')
  .post(optionalAuth, addOrderItems)
  .get(optionalAuth, getUserOrders);

router.route('/user/:userId')
  .get(optionalAuth, getUserOrders);

router.route('/:id')
  .get(optionalAuth, getOrderById);

router.route('/:id/cancel')
  .post(optionalAuth, cancelOrder);

router.route('/:id/status')
  .put(optionalAuth, updateOrderStatus);

export default router;
