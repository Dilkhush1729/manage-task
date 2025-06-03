const mongoose = require('mongoose');
const Admin = require('../model/Admin');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create default admin if none exists
    await Admin.createDefaultAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Stop server on failure
  }
};

module.exports = connectDB;
