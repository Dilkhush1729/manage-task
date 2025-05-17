const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const dotenv = require('dotenv')
const taskRoutes = require('./routes/taskRoutes.js')
const categoryRoutes = require('./routes/categoryRoutes.js')
const authRoutes = require('./routes/authRoutes.js')
const adminRoutes = require('./routes/adminRoutes.js')
const adminUserRoutes = require('./routes/adminUserRoutes.js')
const adminTaskRoutes = require('./routes/adminTaskRoutes.js')
const adminCategoryRoutes = require('./routes/adminCategoryRoutes.js')
const Admin = require('./model/Admin.js')
const shareRoutes = require('./routes/shareRoutes.js')
const notificationRoutes  = require('./routes/notificationRoutes.js')
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin if none exists
    await Admin.createDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);

// Notification routes 
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/tasks/share', shareRoutes)

// Serve static files (your frontend)
app.use(express.static('public'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});