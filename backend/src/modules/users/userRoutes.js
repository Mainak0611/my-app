// backend/src/modules/users/userRoutes.js
import express from 'express';
import { registerUser, loginUser } from './userController.js';

const router = express.Router();

// Public routes for user authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;