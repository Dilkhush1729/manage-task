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

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update fields
    if (email) admin.email = email;
    if (name) admin.name = name;
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      admin.password = newPassword;
    }

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
    if (adminCount >= 3) {
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

// Get all secondary admins
router.get('/secondary-admin', adminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');

    // Assuming the first created admin is the main one
    if (admins.length <= 1) {
      return res.json([]); // No secondary admins
    }

    // Exclude the first/main admin if you want only secondary
    const secondaryAdmins = admins.slice(1);
    
    res.json(secondaryAdmins);
  } catch (error) {
    console.error('Error fetching secondary admins:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update secondary admin
router.put('/secondary-admin/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent updating main admin
    const allAdmins = await Admin.find();
    const mainAdminId = allAdmins[0]._id.toString();
    if (id === mainAdminId) {
      return res.status(403).json({ message: 'Cannot edit the main admin account' });
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password && password.length >= 6) {
      admin.password = password;
    }

    await admin.save();

    res.json({
      message: 'Secondary admin updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error updating secondary admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete secondary admin
router.delete('/secondary-admin/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find all admins
    const admins = await Admin.find();
    if (admins.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only admin account' });
    }

    // Check if the admin to delete is the main admin
    const mainAdminId = admins[0]._id.toString();
    if (id === mainAdminId) {
      return res.status(403).json({ message: 'You cannot delete the main admin account' });
    }

    // Delete the secondary admin
    const deletedAdmin = await Admin.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({
      message: 'Secondary admin deleted successfully',
      deletedAdmin: {
        id: deletedAdmin._id,
        name: deletedAdmin.name,
        email: deletedAdmin.email
      }
    });
  } catch (error) {
    console.error('Error deleting secondary admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports =  router;