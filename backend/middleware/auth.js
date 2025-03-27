const jwt = require('jsonwebtoken');
const User = require('../model/User.js');
const Admin = require('../model/Admin.js');

const auth = async (req, res, next) => {
  
  console.log('<============================= User auth executed =================================>')

  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token contains userId
    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      req.user = user;
      req.userId = user._id;
      next();
    } else {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth