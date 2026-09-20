const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true, maxlength: 200 },
        quantity: { type: Number, required: true, min: 1, max: 10000, validate: Number.isInteger },
        unitPrice: { type: Number, min: 0 }
    },
    { _id: false }
);

const manualOrderSchema = new mongoose.Schema(
    {
        customerName: { type: String, trim: true, maxlength: 100 },
        companyName: { type: String, trim: true, maxlength: 150 },
        phone: { type: String, trim: true, maxlength: 30 },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 254,
            validate: {
                validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'Enter a valid email address'
            }
        },
        items: {
            type: [itemSchema],
            validate: {
                validator: (items) => items.length > 0 && items.length <= 30,
                message: 'Add between 1 and 30 items'
            }
        },
        agreedTotal: { type: Number, min: 0 },
        notes: { type: String, trim: true, maxlength: 2000 },
        status: {
            type: String,
            enum: ['placed', 'confirmed', 'shipped', 'completed', 'cancelled'],
            default: 'placed'
        },
        orderDate: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
    },
    { timestamps: true }
);

manualOrderSchema.pre('validate', function () {
    if (!this.customerName && !this.companyName)
        this.invalidate('customerName', 'Enter a customer or company name');
});

module.exports = mongoose.model('ManualOrder', manualOrderSchema);
