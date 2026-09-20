const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: 120
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        images: [{ type: String, trim: true }],
        fittingType: { type: String, trim: true, maxlength: 80 },
        dimensions: { type: String, trim: true, maxlength: 120 },
        brightness: { type: String, trim: true, maxlength: 80 },
        colourTemperature: { type: String, trim: true, maxlength: 80 },
        warranty: { type: String, trim: true, maxlength: 120 },
        installationNotes: { type: String, trim: true, maxlength: 300 },
        brand: {
            type: String,
            required: [true, 'Brand is required'],
            trim: true
        },
        wattage: {
            type: String,
            required: [true, 'Wattage is required'],
            trim: true
        },
        lightColour: {
            type: String,
            required: [true, 'Light colour is required'],
            trim: true
        },
        usage: {
            type: String,
            enum: ['Indoor', 'Outdoor', 'Commercial'],
            required: [true, 'Usage is required']
        },
        stockQuantity: {
            type: Number,
            required: [true, 'Stock quantity is required'],
            min: [0, 'Stock quantity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Stock quantity must be a whole number'
            }
        },
        lowStockThreshold: {
            type: Number,
            min: 0,
            default: 5
        },
        inventoryHistory: [
            {
                previousQuantity: { type: Number, required: true },
                newQuantity: { type: Number, required: true },
                change: { type: Number, required: true },
                note: { type: String, trim: true, default: 'Stock updated' },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        featured: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

productSchema.virtual('stockStatus').get(function getStockStatus() {
    return this.stockQuantity > 0 ? 'In Stock' : 'Out of Stock';
});

module.exports = mongoose.model('Product', productSchema);
