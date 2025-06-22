const mongoose = require('mongoose'); // ✅ Add this line at the top

const calorieLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
  calories: Number
});

module.exports = mongoose.model('CalorieLog', calorieLogSchema);
