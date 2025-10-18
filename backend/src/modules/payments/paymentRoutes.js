// backend/src/modules/payments/paymentRoutes.js

import express from 'express';
// 🛑 THIS IS THE CORRECT PATH BASED ON YOUR FOLDER STRUCTURE 🛑
import { protect } from '../../middleware/authMiddleware.js'; 

import { 
    getPayments, 
    uploadCSV, 
    deleteAllPayments, 
    addTrackingEntry, 
    getTrackingEntries, 
    updatePaymentStatus 
} from './paymentController.js';

import { upload } from '../../config/multerConfig.js'; 

const router = express.Router();

// 1. GET Payments (READ) - REQUIRES AUTHENTICATION
router.get('/', protect, getPayments);

// 2. POST Upload (CREATE) - REQUIRES AUTHENTICATION
router.post('/upload', protect, upload.single('csvFile'), uploadCSV);

// 3. DELETE All (DELETE) - REQUIRES AUTHENTICATION
router.delete('/', protect, deleteAllPayments);

// 4. Tracking Routes - REQUIRES AUTHENTICATION
router.post('/tracking/:paymentId', protect, addTrackingEntry);
router.get('/tracking/:paymentId', protect, getTrackingEntries);

// 5. Status Update - REQUIRES AUTHENTICATION
router.patch('/:id/status', protect, updatePaymentStatus);

export default router;