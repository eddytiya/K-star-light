const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null;
    if (!token) return res.status(401).json({ message: 'Admin login required' });

    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        if (req.admin.role !== 'admin')
            return res.status(403).json({ message: 'Admin access only' });
        return next();
    } catch (_error) {
        return res.status(401).json({ message: 'Your admin session has expired' });
    }
};
