import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
export const addItemToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    // Check if item exists in cart
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      (item.variantId ? item.variantId.toString() === variantId : true)
    );
    
    if (itemIndex > -1) {
      // Update quantity
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      // Add new item
      cart.items.push({ product: productId, variantId, quantity: quantity || 1 });
    }
    
    await cart.save();
    
    // Populate product before sending response
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    res.status(201).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/items/:id
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.id;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    item.quantity = quantity;
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private
export const removeItemFromCart = async (req, res) => {
  try {
    const itemId = req.params.id;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items.pull({ _id: itemId });
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
