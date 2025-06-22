const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  category: { type: String, enum: ['taste', 'quality', 'service', 'cleanliness', 'general'], default: 'general' },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  adminResponse: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema); 