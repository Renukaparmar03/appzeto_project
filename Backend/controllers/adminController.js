import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Basic aggregations
    const totalOrders = await Order.countDocuments(dateFilter);
    
    const revenueAgg = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const pendingOrders = await Order.countDocuments({ ...dateFilter, status: 'PENDING' });
    const failedPayments = await Order.countDocuments({ ...dateFilter, status: 'PAYMENT_FAILED' });
    
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } }).select('title stock');

    // Top products
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$orderItems' },
      { $group: { 
          _id: '$orderItems.product', 
          title: { $first: '$orderItems.title' },
          totalSold: { $sum: '$orderItems.qty' }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalOrders,
      revenue,
      pendingOrders,
      failedPayments,
      lowStockProducts,
      topProducts
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
