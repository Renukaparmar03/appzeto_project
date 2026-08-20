import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js'; // Razorpay payment gateway
import categoryRoutes from './routes/categoryRoutes.js';
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8"], ["1.1.1.1"]);

dotenv.config();

connectDB();

const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Local Vite dev
  'http://localhost:3000',  // Local fallback
  'http://localhost:5000',  // Local backend
];

if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

ALLOWED_ORIGINS.push('https://quick-kart-ojl0.onrender.com');
ALLOWED_ORIGINS.push('https://quick-kart-self.vercel.app');

const corsOptionsDelegate = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  if (origin.includes('.onrender.com') || origin.includes('render.com')) return callback(null, true);
  if (origin.includes('.vercel.app') || origin.includes('vercel.app')) return callback(null, true);
  callback(null, false);
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptionsDelegate,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ role, id }) => {
    if (role && id) {
      const room = `${role}_${id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    }
  });

  // Delivery boys can join a general 'delivery_boys' room for broad notifications
  socket.on('joinDeliveryRoom', () => {
    socket.join('delivery_boys');
    console.log(`Socket ${socket.id} joined room delivery_boys`);

    // Log current rooms
    console.log(`Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use(cors({
  origin: corsOptionsDelegate,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);          // Razorpay payment routes
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
