const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  adminResponse: { type: String },
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema); 