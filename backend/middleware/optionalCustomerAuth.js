const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;
    if (!token) return next();
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== 'customer')
            return res.status(403).json({ message: 'Customer account required' });
        req.customer = payload;
        return next();
    } catch (_error) {
        return res.status(401).json({ message: 'Customer session expired' });
    }
};
