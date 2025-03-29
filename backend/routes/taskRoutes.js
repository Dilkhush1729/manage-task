const express = require('express');
const Task = require('../model/task.js');
const auth  = require('../middleware/auth.js'); // Destructure auth from the module
const mongoose = require('mongoose');

const router = express.Router();

router.use(auth);

// Get all tasks for the current user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  const task = new Task({
    ...req.body,
    user: req.userId
  });
  
  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Convert category to ObjectId if it's a valid string, otherwise keep it null
    const newCategoryId = req.body.category && mongoose.Types.ObjectId.isValid(req.body.category) 
      ? new mongoose.Types.ObjectId(req.body.category) 
      : null;

    // Check if category is changing (handle null case safely)
    if ((task.category && task.category.toString()) !== (newCategoryId && newCategoryId.toString())) {
      if (task.category) {  // Only push history if there was a previous category
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

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.completed = !task.completed;
    const updatedTask = await task.save();
    
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;