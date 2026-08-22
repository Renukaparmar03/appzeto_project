import mongoose from 'mongoose';

const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
}, { _id: true });

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true // One cart per user
    },
    items: [cartItemSchema]
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
