const mongoose = require('mongoose');

const sharedTaskSchema = new mongoose.Schema({
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    token: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    createdAt: { type: Date, default: Date.now, expires: '7d'   } // Auto-delete after 7 days
});

module.exports = mongoose.model('SharedTask', sharedTaskSchema);