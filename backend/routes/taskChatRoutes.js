const express = require('express');
const router = express.Router();
const ChatMessage = require('../model/taskChat');

// GET messages for a specific task
router.get('/:taskId', async (req, res) => {
    try {
        const messages = await ChatMessage.find({ taskId: req.params.taskId })
            .populate('userId', 'name') // get the user's name
            .sort({ createdAt: 1 });    // oldest to newest
        res.json(messages);
    } catch (err) {
        console.error('Error fetching chat messages:', err);
        res.status(500).json({ error: 'Failed to get chat messages' });
    }
});

// POST a new message for a task
router.post('/:taskId', async (req, res) => {
    try {
        const { userId, message } = req.body;
        const newMessage = new ChatMessage({
            taskId: req.params.taskId,
            userId,
            message
        });
        const savedMessage = await newMessage.save();
        const populatedMessage = await savedMessage.populate('userId', 'name');
        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error('Error posting chat message:', err);
        res.status(500).json({ error: 'Failed to post chat message' });
    }
});

// DELETE a specific chat message by its ID
router.delete('/:messageId', async (req, res) => {
    try {
        const message = await ChatMessage.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if req.body.userId matches message.userId (if you want only the sender to delete)
        // if (message.userId.toString() !== req.body.userId) {
        //     return res.status(403).json({ error: 'Unauthorized' });
        // }

        await ChatMessage.findByIdAndDelete(req.params.messageId);
        
        // Return _id and taskId for socket event
        res.status(200).json({ _id: message._id, taskId: message.taskId });
    } catch (err) {
        console.error('Error deleting chat message:', err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});


module.exports = router;
