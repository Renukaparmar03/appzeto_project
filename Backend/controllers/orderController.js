import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      idempotencyKey
    } = req.body;

    // Idempotency check
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return res.status(200).json(existingOrder);
      }
    }

    const reqOrderItems = req.body.orderItems;

    if (!reqOrderItems || reqOrderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const orderItems = [];
    let calcItemsPrice = 0;

    // Inventory Consistency and Price Calculation
    for (const item of reqOrderItems) {
      const product = await Product.findById(item.product);
      
      if (!product || product.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product ? product.title : 'item'}` });
      }

      // Optimistic Concurrency Control (Reserve Inventory)
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );

      if (!updatedProduct) {
         return res.status(400).json({ message: `Concurrency error: Failed to reserve stock for ${product.title}` });
      }

      const itemPrice = product.discountPrice || product.price;
      calcItemsPrice += itemPrice * item.qty;

      orderItems.push({
        title: product.title,
        qty: item.qty,
        image: product.image,
        price: itemPrice,
        product: product._id
      });
    }

    const calcTaxPrice = Number((calcItemsPrice * 0.05).toFixed(2));
    const calcShippingPrice = calcItemsPrice > 199 ? 0 : 25;
    const calcTotalPrice = calcItemsPrice + calcTaxPrice + calcShippingPrice;

    const orderId = `ORD-${Date.now()}`;
    const userId = req.user?._id || req.body.user || '000000000000000000000000';

    const order = new Order({
      orderId,
      idempotencyKey,
      orderItems,
      user: userId,
      shippingAddress,
      paymentMethod,
      itemsPrice: calcItemsPrice,
      taxPrice: calcTaxPrice,
      shippingPrice: calcShippingPrice,
      totalPrice: calcTotalPrice,
      status: paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING',
      isPaid: false
    });

    const createdOrder = await order.save();

    // Notify Admin directly via Socket.io
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting newOrder to admin_dashboard for order ${createdOrder.orderId}`);
      io.to('admin_dashboard').emit('newOrder', createdOrder);
    }

    // Optionally clear DB cart if it exists
    if (userId && userId !== '000000000000000000000000') {
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    }

    res.status(201).json([createdOrder]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    let query = {};
    const targetUserId = req.params.userId || req.query.userId || (req.user && req.user.role !== 'admin' ? req.user._id : null);
    
    if (targetUserId && targetUserId !== 'undefined' && targetUserId !== 'null' && targetUserId !== '000000000000000000000000' && targetUserId !== 'all') {
      query.user = targetUserId;
    }
    
    const orders = await Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
       return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Not authorized' });
    }

    if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
       return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'CANCELLED';
    await order.save();

    // Release Inventory
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.qty } }
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid) order.paidAt = Date.now();
    }

    if (status === 'DELIVERED') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true;
      if (!order.paidAt) order.paidAt = Date.now();
    } else if (status === 'CANCELLED' || status === 'REJECTED') {
      // Release inventory back to stock
      for (const item of order.orderItems) {
        if (item.product) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.qty } }
          );
        }
      }
    }

    const updatedOrder = await order.save();

    // Broadcast status update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin_dashboard').emit('orderUpdated', updatedOrder);
      if (order.user) {
        io.emit(`order_${order._id}`, updatedOrder);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
