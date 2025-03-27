const express = require('express')
const User = require('../model/User.js')
const Task = require('../model/task.js')
const Category = require('../model/category.js')
const adminAuth = require('../middleware/adminAuth.js')

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user's tasks
    await Task.deleteMany({ user: req.params.id });
    
    // Delete user's categories
    await Category.deleteMany({ user: req.params.id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get task counts
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, completed: true });
    const pendingTasks = totalTasks - completedTasks;
    
    // Get category count
    const categoryCount = await Category.countDocuments({ user: userId });
    
    // Get tasks by priority
    const highPriorityTasks = await Task.countDocuments({ user: userId, priority: 'high' });
    const mediumPriorityTasks = await Task.countDocuments({ user: userId, priority: 'medium' });
    const lowPriorityTasks = await Task.countDocuments({ user: userId, priority: 'low' });
    
    // Get tasks created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentTasks = await Task.countDocuments({
      user: userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Get tasks completed in the last 7 days
    const recentCompletedTasks = await Task.countDocuments({
      user: userId,
      completed: true,
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Get daily task creation for the last 7 days
    const dailyTaskCreation = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Task.countDocuments({
        user: userId,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      dailyTaskCreation.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    // Get daily task completion for the last 7 days
    const dailyTaskCompletion = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Task.countDocuments({
        user: userId,
        completed: true,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      dailyTaskCompletion.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({
      userId,
      username: user.name,
      email: user.email,
      createdAt: user.createdAt,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        categoryCount,
        tasksByPriority: {
          high: highPriorityTasks,
          medium: mediumPriorityTasks,
          low: lowPriorityTasks
        },
        recentActivity: {
          tasksCreated: recentTasks,
          tasksCompleted: recentCompletedTasks
        },
        dailyTaskCreation,
        dailyTaskCompletion
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;