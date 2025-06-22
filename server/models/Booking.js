const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  date: { type: Date, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  status: { type: String, enum: ['booked', 'cancelled', 'consumed'], default: 'booked' },
  bookingTime: { type: Date, default: Date.now },
  consumedAt: { type: Date },
  specialRequests: { type: String },
  price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema); 