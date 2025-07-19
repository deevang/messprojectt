const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  day: { type: String, required: true },
  breakfast: { type: String },
  lunch: { type: String },
  dinner: { type: String }
}, { _id: false });

const weeklyMealPlanSchema = new mongoose.Schema({
  meals: [daySchema],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WeeklyMealPlan', weeklyMealPlanSchema); 