const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleSub: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    verificationCodeHash: { type: String, select: false },
    verificationExpiresAt: { type: Date, select: false },
    verificationAttempts: { type: Number, default: 0, select: false },
    phone: { type: String, trim: true, match: /^[6-9]\d{9}$/ }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
