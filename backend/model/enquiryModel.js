const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'] },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    quantity: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' } },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    quotedTotal: { type: Number, min: 0 },
    quoteNote: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['New', 'Contacted', 'Quoted', 'Closed'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
