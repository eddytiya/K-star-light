const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./model/adminModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const email = process.env.ADMIN_EMAIL.toLowerCase();
            if (!await Admin.exists({ email })) {
                await Admin.create({
                    name: process.env.ADMIN_NAME || 'K Star Light Admin',
                    email,
                    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
                });
                console.log(`Admin account created: ${email}`);
            }
        }
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
