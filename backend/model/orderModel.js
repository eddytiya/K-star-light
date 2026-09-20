const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        guestEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
        guestAccessHash: { type: String, select: false },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                productName: String,
                slug: String,
                unitPrice: Number,
                quantity: Number
            }
        ],
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true },
        stockReserved: { type: Boolean, default: true },
        quoteStatus: {
            type: String,
            enum: ['requested', 'sent', 'accepting', 'accepted', 'expired'],
            default: 'requested'
        },
        quote: {
            items: [
                {
                    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                    productName: String,
                    quantity: Number,
                    unitPrice: Number
                }
            ],
            deliveryCharge: { type: Number, min: 0 },
            total: { type: Number, min: 0 },
            notes: { type: String, trim: true, maxlength: 1000 },
            validUntil: Date,
            sentAt: Date,
            acceptedAt: Date
        },
        quoteAccessHash: { type: String, select: false },
        followUpAt: Date,
        contactedAt: Date,
        delivery: {
            name: { type: String, required: true, trim: true },
            companyName: { type: String, trim: true, maxlength: 150 },
            phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
            address: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            postalCode: { type: String, required: true, match: /^\d{6}$/ }
        },
        paymentMethod: { type: String, enum: ['upi', 'cash'], required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'verified', 'not_applicable'],
            default: 'pending'
        },
        status: {
            type: String,
            enum: ['placed', 'confirmed', 'shipped', 'completed', 'cancelled'],
            default: 'placed'
        },
        trackingNumber: { type: String, trim: true, maxlength: 100 },
        trackingUrl: { type: String, trim: true, maxlength: 500 },
        statusHistory: [
            { status: { type: String, required: true }, at: { type: Date, required: true } }
        ],
        emailStatus: {
            type: String,
            enum: ['pending', 'sent', 'not_configured', 'failed'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
