require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support large base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded profile images statically
const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Main Route Check
app.get('/', (req, res) => {
  res.send('GharSeva Backend API is running...');
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/help', require('./routes/help'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/workers', require('./routes/workers'));

// Catch-all Error// 404 Handler
app.use((req, res, next) => {
  console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.io for real-time dispatch
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible from anywhere in the app
global.io = io;

io.on('connection', (socket) => {
  console.log(`[Socket.io] Worker connected: ${socket.id}`);

  // Worker registers its WorkerId on connecting
  socket.on('register_worker', (workerId) => {
    socket.join(`worker_${workerId}`);
    console.log(`[Socket.io] Worker ${workerId} joined their dispatch room`);
  });

  // Worker sends live location update
  socket.on('update_location', async (data) => {
    const Worker = require('./models/Worker');
    try {
      await Worker.findOneAndUpdate(
        { _id: data.workerId },
        { location: { type: 'Point', coordinates: [data.lng, data.lat] }, isOnline: true }
      );
    } catch(err) { /* silent */ }
  });

  socket.on('worker_offline', async (workerId) => {
    const Worker = require('./models/Worker');
    try {
      await Worker.findByIdAndUpdate(workerId, { isOnline: false });
    } catch(err) { /* silent */ }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Worker disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io active`);
});
