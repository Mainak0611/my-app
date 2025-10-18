// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const protect = (req, res, next) => {
    let token;

    // Check for token in the Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (split "Bearer [token]")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, SECRET_KEY);

            // Attach user ID (and any other payload info) to the request
            // This is CRITICAL for data filtering in the controllers
            req.user = { id: decoded.id, email: decoded.email };

            next();
        } catch (error) {
            console.error('Token validation failed:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};