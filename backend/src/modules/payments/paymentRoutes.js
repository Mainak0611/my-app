// routes/payments.js
import express from 'express';
import {
  getPayments,
  deleteAllPayments,
  uploadCSV,
  addTrackingEntry,
  getTrackingEntries,
  updatePaymentStatus,
  mergePayments,
  updatePaymentDetails,
  updateTrackingEntry,
  deleteTrackingEntry,
  getMergedPayments,
  unmergePayment
} from './paymentController.js';

import multer from 'multer';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'tmp/uploads/' });

router.get('/', protect, getPayments);
router.delete('/', protect, deleteAllPayments);
router.post('/upload', protect, upload.single('csvFile'), uploadCSV);

router.post('/tracking/:paymentId', protect, addTrackingEntry);
router.get('/tracking/:paymentId', protect, getTrackingEntries);

// tracking entry update/delete
router.patch('/tracking/entry/:id', protect, updateTrackingEntry);
router.delete('/tracking/entry/:id', protect, deleteTrackingEntry);
// status update
router.patch('/:id/status', protect, updatePaymentStatus);

// merge
router.post('/merge', protect, mergePayments);

// merged listing & unmerge
router.get('/:id/merged', protect, getMergedPayments);
router.patch('/:id/unmerge', protect, unmergePayment);
// update main details
router.patch('/:id/details', protect, updatePaymentDetails);

export default router;
