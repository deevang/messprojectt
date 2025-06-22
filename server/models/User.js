const mongoose = require('mongoose'); // ✅ Must be present

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student', 'mess_staff'], default: 'student' },
  roomNumber: { type: String },
  phoneNumber: { type: String },
  messPlan: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  dietaryRestrictions: [String],
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },
  lastMealDate: { type: Date },
  totalMealsTaken: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  monthlyFee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
