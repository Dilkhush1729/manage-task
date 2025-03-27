const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../model/Admin.js');
const adminAuth = require('../middleware/adminAuth.js')

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    // Generate token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET_ADMIN,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get admin profile
router.get('/me', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin credentials
router.put('/update-credentials', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, email, name } = req.body;
    
    const admin = await Admin.findById(req.adminId);
    
    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update fields
    if (email) admin.email = email;
    if (name) admin.name = name;
    if (newPassword) admin.password = newPassword;
    
    await admin.save();
    
    res.json({ 
      message: 'Admin credentials updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create secondary admin (limited to 2 total)
router.post('/create-secondary', adminAuth, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if we already have 2 admins
    const adminCount = await Admin.countDocuments();
    if (adminCount >= 2) {
      return res.status(400).json({ message: 'Maximum number of admin accounts reached (2)' });
    }
    
    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create new admin
    const newAdmin = new Admin({
      email,
      password,
      name
    });
    
    await newAdmin.save();
    
    res.status(201).json({ 
      message: 'Secondary admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Error creating secondary admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports =  router;