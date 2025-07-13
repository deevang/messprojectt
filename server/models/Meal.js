const mongoose = require('mongoose'); // ✅ Must be present

const mealSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: String, default: '1 serving' },
    calories: { type: Number, default: 0 },
    category: { type: String, enum: ['main', 'side', 'dessert', 'beverage'] }
  }],
  totalCalories: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  isVegetarian: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  maxCapacity: { type: Number, default: 100 },
  currentBookings: { type: Number, default: 0 },
  description: { type: String },
  imageUrl: { type: String },
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

mealSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Meal', mealSchema);
