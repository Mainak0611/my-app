// backend/src/routes/paymentRoutes.js (FINAL with Dedicated Status Update Route)

import express from "express";
import multer from "multer";
import { 
    getPayments, 
    uploadCSV, 
    deleteAllPayments, 
    addTrackingEntry,     
    getTrackingEntries,
    // 🛑 NEW IMPORT 🛑
    updatePaymentStatus 
} from "./paymentController.js"; 

const router = express.Router();

// Configure Multer for file storage (Config is fine)
const upload = multer({ 
  dest: 'tmp/csv/', 
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'text/csv', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Only CSV and XLSX files are allowed!'), false);
    }
    cb(null, true);
  }
});

// GET /api/payments 
router.get("/", getPayments);

// DELETE /api/payments
router.delete("/", deleteAllPayments);

// POST /api/payments/upload
router.post("/upload", upload.single('csvFile'), uploadCSV);

// 🛑 NEW TRACKING ROUTES 🛑
// POST /api/payments/tracking/:paymentId -> Add a new tracking entry
router.post('/tracking/:paymentId', addTrackingEntry);

// GET /api/payments/tracking/:paymentId -> Get history of tracking entries
router.get('/tracking/:paymentId', getTrackingEntries);

// 🛑 NEW ROUTE FOR DEDICATED STATUS UPDATE 🛑
// PATCH /api/payments/:id/status
router.patch('/:id/status', updatePaymentStatus); 

export default router;