const express = require('express')
const Task = require('../model/task.js')
const User = require('../model/User.js')
const adminAuth = require('../middleware/adminAuth.js')
const mongoose = require('mongoose')

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Get all tasks (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Apply filters if provided
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    if (req.query.completed === 'true') {
      filter.completed = true;
    } else if (req.query.completed === 'false') {
      filter.completed = false;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    // Search by name or description
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get tasks with user information
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('category', 'name color');
    
    // Get total count for pagination
    const total = await Task.countDocuments(filter);
    
    res.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('user', 'name email')
      .populate('category', 'name color');
    
    if (!task) {
      return res.status(404).json({ message: 'admin 1 Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task for a user
router.post('/', async (req, res) => {
  try {
    const { name, description, dueDate, dueTime, category, priority, userId } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const task = new Task({
      name,
      description,
      dueDate,
      dueTime,
      category: category || null,
      priority: priority || 'medium',
      user: userId,
      completed: false
    });
    
    const newTask = await task.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'admin3 Task not found' });

    // Convert category to ObjectId if valid, otherwise keep it null
    const newCategoryId = req.body.category && mongoose.Types.ObjectId.isValid(req.body.category) 
      ? new mongoose.Types.ObjectId(req.body.category) 
      : null;

    // Check if the category is changing, handle null safely
    if ((task.category && task.category.toString()) !== (newCategoryId && newCategoryId.toString())) {
      if (task.category) { // Only push to history if there was a previous category
        task.categoryHistory.push({ categoryId: task.category, changedAt: new Date() });
      }
    }

    // Update the task fields
    task.name = req.body.name;
    task.description = req.body.description;
    task.dueDate = req.body.dueDate;
    task.dueTime = req.body.dueTime;
    task.category = newCategoryId;  // Allow setting category to null
    task.priority = req.body.priority;
    task.completed = req.body.completed;
    task.user = req.body.userId;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: ' admin 2 Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk delete tasks
router.post('/bulk-delete', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'No task IDs provided' });
    }
    
    // Validate all IDs are valid ObjectIds
    const validIds = taskIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    const result = await Task.deleteMany({ _id: { $in: validIds } });
    
    res.json({ 
      message: `${result.deletedCount} tasks deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Total tasks
    const totalTasks = await Task.countDocuments();
    
    // Completed vs pending tasks
    const completedTasks = await Task.countDocuments({ completed: true });
    const pendingTasks = totalTasks - completedTasks;
    
    // Tasks by priority
    const highPriorityTasks = await Task.countDocuments({ priority: 'high' });
    const mediumPriorityTasks = await Task.countDocuments({ priority: 'medium' });
    const lowPriorityTasks = await Task.countDocuments({ priority: 'low' });
    
    // Tasks created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentTasks = await Task.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Tasks by user (top 5 users)
    const tasksByUser = await Task.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', count: 1 } }
    ]);
    
    // Daily task creation for the last 7 days
    const dailyTaskCreation = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Task.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      dailyTaskCreation.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      tasksByPriority: {
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks
      },
      recentTasks,
      tasksByUser,
      dailyTaskCreation
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export tasks (all or by user)
router.get('/export/csv', async (req, res) => {
  try {
    const filter = {};
    
    // Filter by user if userId is provided
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    // Get tasks with populated user and category
    const tasks = await Task.find(filter)
      .populate('user', 'name email')
      .populate('category', 'name color');
    
    // Create CSV header
    let csv = 'ID,Name,Description,Due Date,Due Time,Category,Category Color,Priority,Completed,User Name,User Email,Created At\n';
    
    // Add task data
    tasks.forEach(task => {
      const row = [
        task._id,
        `"${task.name.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.dueDate || '',
        task.dueTime || '',
        task.category ? `"${task.category.name}"` : '',
        task.category ? task.category.color : '',
        task.priority,
        task.completed,
        task.user && task.user.name ? `"${task.user.name}"` : '', // Check if task.user.name exists
        task.user && task.user.email ? task.user.email : '', // Check if task.user.email exists
        task.createdAt
      ];
      
      csv += row.join(',') + '\n';
    });
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Import tasks
router.post('/import/csv', async (req, res) => {
  try {
    const { csvData, userId } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ message: 'No CSV data provided' });
    }
    
    // Validate user exists if userId is provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User  not found' });
      }
    }
    
    // Parse CSV data (skip header row)
    const rows = csvData.split('\n').slice(1);
    const importedTasks = [];
    const errors = [];
    
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows
      
      try {
        // Parse CSV row (handle quoted fields with commas)
        const row = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        if (row && row.length >= 6) { // Expecting 6 fields
          const name = row[0].replace(/^"|"$/g, '').replace(/""/g, '"');
          const description = row[1].replace(/^"|"$/g, '').replace(/""/g, '"');
          const dueDate = row[2].trim();
          const dueTime = row[3].trim();
          const categoryId = row[4].replace(/^"|"$/g, '').replace(/""/g, '').trim(); // Trim whitespace
          const priority = row[5].trim().toLowerCase();
          const completed = row[6] ? row[6].trim().toLowerCase() === 'true' : false; // Adjusted to check for completed

          // Log the category ID being checked
          console.log(`Checking category ID: "${categoryId}"`);

          // Create task
          const task = new Task({
            name,
            description,
            dueDate: dueDate || null,
            dueTime: dueTime || null,
            category: categoryId ? categoryId : null, // Use the ObjectId of the found category or null
            priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
            completed,
            user: userId
          });
          
          await task.save();
          importedTasks.push(task);
        } else {
          errors.push(`Row ${i + 1}: Invalid format`);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    res.json({
      message: `${importedTasks.length} tasks imported successfully`,
      importedCount: importedTasks.length,
      errors: errors.length > 0 ? errors : []
    });
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;