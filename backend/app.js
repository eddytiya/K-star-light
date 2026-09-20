require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { connectDB } = require('./db');
const productRoute = require('./route/productRoute');
const categoryRoute = require('./route/categoryRoute');
const catalogueRoute = require('./route/catalogueRoute');
const authRoute = require('./route/authRoute');
const enquiryRoute = require('./route/enquiryRoute');
const dashboardRoute = require('./route/dashboardRoute');
const uploadRoute = require('./route/uploadRoute');
const customerAuthRoute = require('./route/customerAuthRoute');
const orderRoute = require('./route/orderRoute');
const manualOrderRoute = require('./route/manualOrderRoute');
const customerRecordsRoute = require('./route/customerRecordsRoute');

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
    '/api',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: 'draft-8',
        legacyHeaders: false
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('K Star Light API Running');
});

app.use('/api/products', productRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/catalogue', catalogueRoute);
app.use('/api/auth', authRoute);
app.use('/api/enquiries', enquiryRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/uploads', uploadRoute);
app.use('/api/customer-auth', customerAuthRoute);
app.use('/api/orders', orderRoute);
app.use('/api/manual-orders', manualOrderRoute);
app.use('/api/customer-records', customerRecordsRoute);
app.use('/api/reports', require('./route/reportRoute'));

app.use((error, _req, res, _next) => {
    if (error instanceof require('multer').MulterError)
        return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unexpected server error' });
});

const port = process.env.PORT || 2987;
connectDB().then(() => app.listen(port, () => console.log(`Server running on port ${port}`)));
