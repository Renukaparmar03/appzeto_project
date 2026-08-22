import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';

let Queue, Worker, connection;
let emailQueue, inventoryQueue, cartQueue;
let redisAvailable = false;

// Try to initialize Redis & BullMQ gracefully
export const initializeWorkers = async () => {
  try {
    const bullmq = await import('bullmq');
    const IORedis = (await import('ioredis')).default;

    Queue = bullmq.Queue;
    Worker = bullmq.Worker;

    connection = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      }
    });

    // Test connection
    await new Promise((resolve, reject) => {
      connection.on('ready', () => resolve());
      connection.on('error', (err) => reject(err));
      setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
    });

    redisAvailable = true;
    console.log('✅ Redis connected — BullMQ Workers Initialized');

    // Create Queues
    emailQueue = new Queue('emailQueue', { connection });
    inventoryQueue = new Queue('inventoryQueue', { connection });
    cartQueue = new Queue('cartQueue', { connection });

    // Worker: Send Order Confirmation Email
    new Worker('emailQueue', async job => {
      const { orderId, email } = job.data;
      console.log(`[Job: Email] Sending order confirmation to ${email} for order ${orderId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`[Job: Email] Sent successfully`);
    }, { connection });

    // Worker: Release Expired Inventory Reservations
    new Worker('inventoryQueue', async job => {
      const { orderId } = job.data;
      console.log(`[Job: Inventory] Checking if order ${orderId} needs inventory release...`);

      const order = await Order.findOne({ orderId });
      if (order && (order.status === 'PENDING' || order.status === 'PAYMENT_FAILED')) {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);
        if (order.createdAt < thirtyMinsAgo) {
          console.log(`[Job: Inventory] Releasing inventory for expired order ${orderId}`);
          order.status = 'CANCELLED';
          await order.save();

          for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.qty } }
            );
          }
        }
      }
    }, { connection });

    // Worker: Detect Abandoned Carts
    new Worker('cartQueue', async job => {
      console.log(`[Job: Cart] Checking for abandoned carts...`);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const abandonedCarts = await Cart.find({
        updatedAt: { $lt: yesterday },
        'items.0': { $exists: true }
      }).populate('user');

      abandonedCarts.forEach(cart => {
        console.log(`[Job: Cart] Cart ${cart._id} for user ${cart.user?.email || cart.user} appears abandoned.`);
      });
    }, { connection });

  } catch (err) {
    redisAvailable = false;
    console.log('⚠️  Redis not available — BullMQ background jobs disabled (server will run without them)');
    // Suppress further connection errors
    if (connection) {
      connection.disconnect();
    }
  }
};

export { emailQueue, inventoryQueue, cartQueue, redisAvailable };
