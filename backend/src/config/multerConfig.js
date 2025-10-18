// backend/src/config/multerConfig.js

import multer from "multer";

// Configure Multer for file storage
export const upload = multer({ 
  dest: 'tmp/csv/', 
  fileFilter: (req, file, cb) => {
    // Allowed MIME types for CSV and Excel files
    const allowedMimes = [
      'text/csv', 
      'application/vnd.ms-excel', // Legacy Excel (.xls)
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // Modern Excel (.xlsx)
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Only CSV and XLSX files are allowed!'), false);
    }
    cb(null, true);
  }
});
