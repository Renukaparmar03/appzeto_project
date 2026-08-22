import express from 'express';
import { getCart, addItemToCart, updateCartItem, removeItemFromCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCart);

router.route('/items')
  .post(protect, addItemToCart);

router.route('/items/:id')
  .patch(protect, updateCartItem)
  .delete(protect, removeItemFromCart);

export default router;
