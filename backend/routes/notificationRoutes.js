// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../model/notification');
const auth = require('../middleware/auth.js')

// Apply auth middleware to all routes
router.use(auth);

// Create a new notification
router.post('/', async (req, res) => {
  const { message, type } = req.body;

  try {
    const notification = new Notification({
      userId: req.user._id, // 👈 assign to the logged-in user
      message,
      type
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ triggeredAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications
router.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

module.exports = router;