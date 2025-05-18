const express = require('express');
const Category = require('../model/category.js');
const Task = require('../model/task.js');
const auth = require('../middleware/auth.js')

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all categories for the current user
router.get('/', async (req, res) => {
  try {
    const ownerId = req.query.ownerId || req.userId; // fallback to self

    const categories = await Category.find({ user: ownerId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  const category = new Category({
    ...req.body,
    user: req.userId
  });
  
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    
    if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    // First update all tasks that use this category
    await Task.updateMany(
      { category: req.params.id, user: req.userId },
      { $set: { category: null } }
    );
    
    // Then delete the category
    const category = await Category.findOneAndDelete({ 
      _id: req.params.id,
      user: req.userId 
    });
    
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports =  router;