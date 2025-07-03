const mongoose = require('mongoose'); // ✅ Must be present

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student', 'mess_staff', 'staff_head'], default: 'student' },
  position: { type: String }, // Staff position (e.g., cook, cleaner)
  salary: { type: Number, default: 0 }, // Monthly salary
  salaryPaid: { type: Number, default: 0 }, // Total salary paid
  outstandingSalary: { type: Number, default: 0 }, // Outstanding salary
  attendance: [{ type: Date }], // Array of dates when staff was present
  roomNumber: { type: String },
  phoneNumber: { type: String },
  messPlan: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  dietaryRestrictions: [String],
  isActive: { type: Boolean, default: true },
  joinDate: { type: Date, default: Date.now },
  lastMealDate: { type: Date },
  totalMealsTaken: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  monthlyFee: { type: Number, default: 0 },
  idProofType: { type: String },
  idProofNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
