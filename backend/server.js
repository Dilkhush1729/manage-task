const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http'); // 👈 Add this
const { Server } = require('socket.io'); // 👈 Add this

const connectDB = require('./config/db');
const corsOptions = require('./middleware/corsConfig');

// Route imports
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminTaskRoutes = require('./routes/adminTaskRoutes');
const adminCategoryRoutes = require('./routes/adminCategoryRoutes');
const shareRoutes = require('./routes/shareRoutes');
const taskChatRoutes = require('./routes/taskChatRoutes');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and bind to express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500','https://manage-task-backend-2vf9.onrender.com'],
    credentials: true
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/tasks/share', shareRoutes);
app.use('/api/chat', taskChatRoutes);

// Socket.IO logic 👇
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.connected);
  console.log('Socket connected:', socket.id);

  socket.on('joinTaskRoom', (taskId) => {
    socket.join(taskId);
    console.log(`User ${socket.id} joined room ${taskId}`);
  });

  socket.on('sendMessage', (data) => {
    console.log('Message received:', data);
    // This sends to everyone *except* sender
    socket.to(data.taskId).emit('receiveMessage', data);
  });

  socket.on('deleteMessage', (data) => {
    const { _id, taskId } = data;
    console.log(`Deleting message ${_id} in room ${taskId}`);

    // Notify others in the room to remove it
    socket.to(taskId).emit('messageDeleted', _id);
  });

  socket.on('bulkDeleteMessage', ({ deletedIds, taskId }) => {
    socket.to(taskId).emit('bulkMessageDeleted', deletedIds);
  });



  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


