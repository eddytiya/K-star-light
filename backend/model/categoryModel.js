const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: 80,
            unique: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: 300,
            default: ''
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
