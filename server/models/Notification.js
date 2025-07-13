const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'headstaff_approval'
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user who triggered the notification
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Admins who should see this
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Admins who have read/acted
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who approved/rejected
  actionedAt: { type: Date }
});

module.exports = mongoose.model('Notification', notificationSchema); 