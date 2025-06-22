const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentType: { type: String, enum: ['monthly', 'weekly', 'daily'], required: true },
  paymentMethod: { type: String, enum: ['cash', 'online', 'card'], default: 'cash' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  description: { type: String },
  transactionId: { type: String },
  mealsIncluded: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema); 