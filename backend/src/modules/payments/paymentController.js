// backend/src/controllers/paymentController.js (FINAL with Dedicated Status Update)

import db from "../../config/db.js";
import fs from "fs";
import XLSX from "xlsx";

const EXCEL_TO_SQL_MAP = [
  'Party', 'Contact No', 'Last R.', 'Rent Amount', 'Rent R', 
  'Deposit', 'Rnt R + Deposit', 'Loading', 'Transport', 
  'Lost/Damage Item', 'Damage/Lost', 'Party Payment', 
  'Total Amt', 'Withut De'
];

const NUMERIC_COLUMNS = [
  'Rent Amount', 'Deposit', 'Rnt R + Deposit', 'Loading', 
  'Transport', 'Total Amt', 'Withut De'
];

const cleanNumericValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return null; 
    }
    let cleaned = String(value).replace(/[^0-9.-]/g, '');
    let numericValue = parseFloat(cleaned);
    return isNaN(numericValue) ? null : numericValue;
};


// 1. GET CONTROLLER: Fetches payments with the LATEST tracking data joined
export const getPayments = (req, res) => {
  
  // 🛑 UPDATED SQL QUERY to select 'payment_status' 🛑
  const sql = `
    SELECT 
        p.*,
        p.payment_status, /* <-- NEW COLUMN SELECTED */
        t.actual_payment_date AS 'Latest Payment Date',
        t.remark AS 'Latest Remark'
    FROM payments p
    LEFT JOIN payment_tracking t 
      ON t.id = (
          SELECT id 
          FROM payment_tracking 
          WHERE payment_id = p.id 
          ORDER BY created_at DESC, id DESC 
          LIMIT 1
      )
    ORDER BY p.id ASC;
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database query error:", err.message); 
      console.error("Failing SQL Query:", sql); 
      return res.status(500).json({ error: "Failed to query database." });
    }
    res.json(results);
  });
};

// 2. DELETE CONTROLLER (Remains the same)
export const deleteAllPayments = (req, res) => {
  const sql = "DELETE FROM payments";
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database delete error:", err.message);
      return res.status(500).json({ error: "Failed to delete records." });
    }
    res.json({ 
      message: "All payment records deleted successfully.", 
      rowsDeleted: result.affectedRows 
    });
  });
};

// 3. POST CONTROLLER (Upload - remains the same, relies on DB default status)
export const uploadCSV = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  let records = [];

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    const rawSheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { 
        header: 1, 
        range: 0, 
        defval: null 
    });
    
    if (rawSheetData.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "File is empty." });
    }

    let headerRowIndex = -1;
    const partyColIndex = 0; 

    for (let i = 0; i < rawSheetData.length; i++) {
        const row = rawSheetData[i];
        if (row && String(row[partyColIndex]).trim() === 'Party') {
            headerRowIndex = i;
            break; 
        }
    }

    if (headerRowIndex === -1) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Could not find the 'Party' header row in the file. Check file formatting." });
    }
    
    const dataRows = rawSheetData.slice(headerRowIndex + 1); 

    if (dataRows.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Header found, but no data rows followed." });
    }

    // Data Mapping and Cleaning
    records = dataRows.map(row => {
        const rawPartyValue = String(row[partyColIndex] || '').trim();
        
        if (!row || rawPartyValue === '' || rawPartyValue.toLowerCase() === 'total') {
             return null; 
        }

        const record = {};
        
        EXCEL_TO_SQL_MAP.forEach((sqlKey, index) => {
            let rawValue = row[index] !== undefined ? row[index] : null;
            
            if (NUMERIC_COLUMNS.includes(sqlKey)) {
                record[sqlKey] = cleanNumericValue(rawValue);
            } else {
                record[sqlKey] = rawValue === "" ? null : rawValue;
            }
        });
        return record;
    })
    .filter(record => record !== null); 

  } catch (err) {
    fs.unlinkSync(filePath); 
    console.error("File processing error (XLSX/CSV):", err.message);
    return res.status(500).json({ error: "Failed to read file. Check file integrity or column order." });
  }

  fs.unlinkSync(filePath);

  // Database Insertion Logic
  
  if (records.length === 0) {
    return res.status(400).json({ error: "No valid data rows found after final cleaning." });
  }

  // Use the original map for placeholders
  const placeholders = EXCEL_TO_SQL_MAP.map(() => '?').join(', ');
  
  const values = records.map(record => {
    return EXCEL_TO_SQL_MAP.map(header => record[header]);
  });

  const flatValues = values.flat();
  const multiRowPlaceholders = records.map(() => `(${placeholders})`).join(', ');
  
  // The 'payment_status' field is excluded here, relying on the database default of 'PENDING'.
  const finalSql = `INSERT INTO payments (${EXCEL_TO_SQL_MAP.map(h => `\`${h}\``).join(', ')}) VALUES ${multiRowPlaceholders}`;

  db.query(finalSql, flatValues, (err, result) => {
    if (err) {
      console.error("Database insert error:", err.message);
      return res.status(500).json({ 
        error: "Failed to insert data into database. Check column data types and header names. See server console for MySQL error details." 
      });
    }
    res.status(201).json({ 
      message: `${result.affectedRows} records uploaded successfully.`, 
      rowsInserted: result.affectedRows 
    });
  });
};


// 4. ADD TRACKING ENTRY (SIMPLIFIED - ONLY CREATES RECORD)
export const addTrackingEntry = (req, res) => {
  const { paymentId } = req.params;
  // NOTE: 'newStatus' is NOT expected here. Status is updated separately via patch.
  const { date, remark } = req.body; 

  if (!date && !remark) {
    return res.status(400).json({ error: "Date or Remark must be provided." });
  }

  const sql = `
    INSERT INTO payment_tracking (payment_id, actual_payment_date, remark)
    VALUES (?, ?, ?)
  `;
  
  db.query(sql, [paymentId, date || null, remark || null], (err, result) => {
    if (err) {
      console.error("Database insert error (tracking):", err.message);
      return res.status(500).json({ error: "Failed to save tracking entry." });
    }
    res.status(201).json({ 
      message: "Tracking entry added successfully. Please set status from history.", 
      id: result.insertId 
    });
  });
};

// 5. GET TRACKING ENTRIES (Remains the same)
export const getTrackingEntries = (req, res) => {
    const { paymentId } = req.params;

    const sql = `
        SELECT id, actual_payment_date, remark, created_at
        FROM payment_tracking
        WHERE payment_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [paymentId], (err, results) => {
        if (err) {
            console.error("Database query error (tracking):", err.message);
            return res.status(500).json({ error: "Failed to fetch tracking history." });
        }
        res.json(results);
    });
};


// 🛑 NEW CONTROLLER: Dedicated Status Update 🛑
export const updatePaymentStatus = (req, res) => {
    const { id } = req.params; // payment ID from the route /api/payments/:id/status
const { newStatus } = req.body; // <--- THIS LINE WAS MISSING OR WRONG
    const validStatuses = ['PENDING', 'PARTIAL', 'PAID'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Invalid payment status provided." });
    }

    const sql = `
        UPDATE payments 
        SET payment_status = ? 
        WHERE id = ?
    `;

    db.query(sql, [newStatus, id], (err, result) => {
        if (err) {
            console.error("Database update error (status):", err.message);
            return res.status(500).json({ error: "Failed to update payment status." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Payment record not found." });
        }
        res.status(200).json({ message: `Status updated to ${newStatus} successfully.` });
    });
};