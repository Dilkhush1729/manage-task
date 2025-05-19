const express = require('express');
const router = express.Router();
const Task = require('../model/task');
const User = require('../model/User');
const auth = require('../middleware/auth');

router.post('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email, access } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!email || !['view', 'edit'].includes(access)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'test shared Task not found' });
    }

    // Verify ownership
    if (task.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to share this task' });
    }

    // Check if already shared with this email
    const alreadyShared = task.sharedWith.some(share => share.email === email);
    if (alreadyShared) {
      return res.status(400).json({ error: 'Task already shared with this email' });
    }

    // Find recipient
    const recipient = await User.findOne({ email });
    
    // Add to sharedWith array
    task.sharedWith.push({
      user: recipient?._id,
      email,
      access,
      status: recipient ? 'accepted' : 'pending',
      token: require('crypto').randomBytes(20).toString('hex'),
      sharedAt: new Date(),
      category,
      categoryHistory
    });

    await task.save();

    res.json({
      success: true,
      message: 'Task shared successfully'
    });

  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tasks shared with current user
router.get('/shared-with-me', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      'sharedWith.user': req.user._id
    })
    .populate('user', 'name email')
    .populate('sharedWith.user', 'name email');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching shared tasks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch shared tasks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get tasks shared by current user
router.get('/shared-by-me', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      sharedWith: { $exists: true, $not: { $size: 0 } }
    })
    .populate('sharedWith.user', 'name email');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks shared by me:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tasks you shared',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;