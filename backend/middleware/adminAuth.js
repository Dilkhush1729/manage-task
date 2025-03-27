const jwt = require('jsonwebtoken');
const User = require('../model/User.js');
const Admin = require('../model/Admin.js');


const adminAuth = async (req, res, next) => {
  console.log('<============================= Admin auth executed =================================>')
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    
    // Check if token contains adminId
    if (decoded.adminId) {
      const admin = await Admin.findById(decoded.adminId);
      
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      req.admin = admin;
      req.adminId = admin._id;
      next();
    } else {
      return res.status(401).json({ message: 'Invalid admin token' });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

module.exports = adminAuth