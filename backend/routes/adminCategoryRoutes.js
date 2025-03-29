const express = require('express');
const Category = require('../model/category.js')
const User = require('../model/User.js')
const Task = require('../model/task.js')
const adminAuth = require('../middleware/adminAuth.js')
const mongoose = require('mongoose')

const router = express.Router();

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const filter = {};
    
    // Filter by user if userId is provided
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    const categories = await Category.find(filter)
      .populate('user', 'name email')
      .sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category for a user
router.post('/', async (req, res) => {
  try {
    const { name, color, userId } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const category = new Category({
      name,
      color,
      user: userId
    });
    
    const newCategory = await category.save();
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, color, userId } = req.body;
    
    // If userId is provided, validate user exists
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        color,
        user: userId
      },
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    // Find the category
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update tasks that use this category
    await Task.updateMany(
      { category: req.params.id },
      { $set: { category: null } }
    );
    
    // Delete the category
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk delete categories
router.post('/bulk-delete', async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'No category IDs provided' });
    }
    
    // Validate all IDs are valid ObjectIds
    const validIds = categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    // Update tasks that use these categories
    await Task.updateMany(
      { category: { $in: validIds } },
      { $set: { category: null } }
    );
    
    // Delete the categories
    const result = await Category.deleteMany({ _id: { $in: validIds } });
    
    res.json({ 
      message: `${result.deletedCount} categories deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export categories
router.get('/export/csv', async (req, res) => {
  try {
    const filter = {};
    
    // Filter by user if userId is provided
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    // Get categories with populated user
    const categories = await Category.find(filter)
      .populate('user', 'name email');
    
    // Create CSV header
    let csv = 'ID,Name,Color,User Name,User Email,Created At\n';
    
    // Add category data
    categories.forEach(category => {
      const row = [
        category._id,
        `"${category.name.replace(/"/g, '""')}"`,
        category.color,
        `"${category.user.name}"`,
        category.user.email,
        category.createdAt
      ];
      
      csv += row.join(',') + '\n';
    });
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=categories.csv');
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Import categories
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
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    // Parse CSV data (skip header row)
    const rows = csvData.split('\n').slice(1);
    const importedCategories = [];
    const errors = [];
    
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].trim()) continue; // Skip empty rows
      
      try {
        // Parse CSV row (handle quoted fields with commas)
        const row = rows[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        
        if (row && row.length >= 3) {
          const name = row[1].replace(/^"|"$/g, '').replace(/""/g, '"');
          const color = row[2].trim();
          
          // Create category
          const category = new Category({
            name,
            color,
            user: userId
          });
          
          await category.save();
          importedCategories.push(category);
        } else {
          errors.push(`Row ${i + 1}: Invalid format`);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    res.json({
      message: `${importedCategories.length} categories imported successfully`,
      importedCount: importedCategories.length,
      errors: errors.length > 0 ? errors : []
    });
  } catch (error) {
    console.error('Error importing categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get categories by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const categories = await Category.find({ user: req.params.userId })
      .sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories for user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;