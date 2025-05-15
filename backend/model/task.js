const mongoose = require('mongoose');

const categoryHistorySchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  changedAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: String,
    default: null
  },
  dueTime: {
    type: String,
    default: null
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  categoryHistory: [categoryHistorySchema], // New field to track category changes
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    access: { type: String, enum: ['view', 'edit'], default: 'view' },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    token: { type: String, required: true },
    sharedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Task', taskSchema);