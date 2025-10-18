// backend/src/modules/payments/paymentController.js (FINAL with Multi-User Separation)

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
  // Get the ID from the authenticated request
  const userId = req.user.id; 

  const sql = `
    SELECT 
        p.*,
        p.payment_status,
        -- Subquery to get the actual_payment_date from the latest tracking entry
        (
            SELECT actual_payment_date 
            FROM payment_tracking 
            WHERE payment_id = p.id 
            ORDER BY actual_payment_date DESC, created_at DESC 
            LIMIT 1
        ) AS 'Latest Payment Date',
        -- Subquery to get the remark from the latest tracking entry
        (
            SELECT remark 
            FROM payment_tracking 
            WHERE payment_id = p.id 
            ORDER BY actual_payment_date DESC, created_at DESC 
            LIMIT 1
        ) AS 'Latest Remark'
    FROM payments p
    WHERE p.user_id = ? /* <-- ESSENTIAL: FILTER DATA BY AUTHENTICATED USER */
    ORDER BY p.id ASC;
  `;
  
  db.query(sql, [userId], (err, results) => { // Pass userId to the query
    if (err) {
      console.error("Database query error:", err.message); 
      console.error("Failing SQL Query:", sql); 
      return res.status(500).json({ error: "Failed to query database." });
    }
    // If results is an empty array, the user has no payments, which is correct.
    res.json(results);
  });
};

// 2. DELETE CONTROLLER 
export const deleteAllPayments = (req, res) => {
  // Get User ID to delete only owned records
  const userId = req.user.id;

  // We should ideally delete from payment_tracking first (if CASCADE DELETE is not set)
  // But for now, we focus on payments table and rely on the multi-user filter.
  const sql = "DELETE FROM payments WHERE user_id = ?";
  
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Database delete error:", err.message);
      return res.status(500).json({ error: "Failed to delete records." });
    }
    res.json({ 
      message: `All ${result.affectedRows} payment records deleted successfully for user ${userId}.`, 
      rowsDeleted: result.affectedRows 
    });
  });
};

// 3. POST CONTROLLER (Upload)
export const uploadCSV = (req, res) => {
  // Get User ID
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  let records = [];

  try {
    // --- File Reading and Parsing Logic (Unchanged) ---
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    const rawSheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { 
        header: 1, 
        range: 0, 
        defval: null 
    });
    
    // Header finding logic (Unchanged)
    if (rawSheetData.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "File is empty." });
    }
    let headerRowIndex = -1;
    const partyColIndex = 0; 
    for (let i = 0; i < rawSheetData.length; i++) {
        const row = rawSheetData[i];
        // Ensure the comparison is robust
        if (row && String(row[partyColIndex] || '').trim().toLowerCase() === 'party') {
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

    // Data Mapping and Cleaning (Unchanged)
    records = dataRows.map(row => {
        const rawPartyValue = String(row[partyColIndex] || '').trim();
        // Skip rows that are empty or contain 'Total' in the Party column
        if (!row || rawPartyValue === '' || rawPartyValue.toLowerCase() === 'total') {
             return null; 
        }
        const record = {};
        const headers = rawSheetData[headerRowIndex]; // Use the actual headers from the file
        
        // Loop through the actual headers found in the file
        headers.forEach((fileHeader, index) => {
            const sqlKey = EXCEL_TO_SQL_MAP[index];
            
            if (sqlKey) {
                 let rawValue = row[index] !== undefined ? row[index] : null;
                 if (NUMERIC_COLUMNS.includes(sqlKey)) {
                     record[sqlKey] = cleanNumericValue(rawValue);
                 } else {
                     record[sqlKey] = rawValue === "" ? null : rawValue;
                 }
            }
        });
        
        // Ensure all required mapped keys exist, even if null
        EXCEL_TO_SQL_MAP.forEach(key => {
            if (!(key in record)) {
                record[key] = null;
            }
        });

        return record;
    })
    .filter(record => record !== null && record.Party); // Filter out nulls and records without a Party

  } catch (err) {
    fs.unlinkSync(filePath); 
    console.error("File processing error (XLSX/CSV):", err.message);
    return res.status(500).json({ error: "Failed to read file. Check file integrity or column order." });
  }

  // Clean up the temporary file
  try {
      fs.unlinkSync(filePath);
  } catch (e) {
      console.warn("Could not delete temporary file:", filePath, e);
  }

  // Database Insertion Logic
  if (records.length === 0) {
    return res.status(400).json({ error: "No valid data rows found after final cleaning." });
  }

  // 🛑 MULTI-USER FIX: Inject 'user_id' into the map and placeholders 🛑
  const finalSqlMap = [...EXCEL_TO_SQL_MAP, 'user_id'];
  const placeholders = finalSqlMap.map(() => '?').join(', ');
  
  const values = records.map(record => {
    // Collect mapped values and APPEND the user ID for each row
    const recordValues = EXCEL_TO_SQL_MAP.map(header => record[header]);
    recordValues.push(userId); 
    return recordValues;
  });

  const flatValues = values.flat();
  const multiRowPlaceholders = records.map(() => `(${placeholders})`).join(', ');
  
  // Note: Using backticks (`) for column names is necessary for MySQL column names with spaces.
  const finalSql = `INSERT INTO payments (${finalSqlMap.map(h => `\`${h}\``).join(', ')}) VALUES ${multiRowPlaceholders}`;

  db.query(finalSql, flatValues, (err, result) => {
    if (err) {
      console.error("Database insert error:", err.message);
      return res.status(500).json({ 
        error: "Failed to insert data into database. Check column data types and header names. See server console for MySQL error details." 
      });
    }
    res.status(201).json({ 
      message: `${result.affectedRows} records uploaded successfully for user ${userId}.`, 
      rowsInserted: result.affectedRows 
    });
  });
};


// 4. ADD TRACKING ENTRY
export const addTrackingEntry = (req, res) => {
  const { paymentId } = req.params;
  const { date, remark } = req.body; 
  const userId = req.user.id;

  if (!date && !remark) {
    return res.status(400).json({ error: "Date or Remark must be provided." });
  }
  
  // 🛑 MULTI-USER FIX: Verify ownership before inserting tracking data 🛑
  // Prevents users from adding tracking data to payments they don't own.
  const ownershipSql = "SELECT id FROM payments WHERE id = ? AND user_id = ?";
  
  db.query(ownershipSql, [paymentId, userId], (err, results) => {
    if (err || results.length === 0) {
      // If error or no payment found matching ID and User ID
      return res.status(404).json({ error: "Payment record not found or unauthorized." });
    }

    const insertSql = `
        INSERT INTO payment_tracking (payment_id, actual_payment_date, remark)
        VALUES (?, ?, ?)
    `;
    
    db.query(insertSql, [paymentId, date || null, remark || null], (err, result) => {
        if (err) {
          console.error("Database insert error (tracking):", err.message);
          return res.status(500).json({ error: "Failed to save tracking entry." });
        }
        res.status(201).json({ 
          message: "Tracking entry added successfully. Please set status from history.", 
          id: result.insertId 
        });
    });
  });
};

// 5. GET TRACKING ENTRIES
export const getTrackingEntries = (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // 🛑 MULTI-USER FIX: First, check if the payment belongs to the user 🛑
    const ownershipSql = "SELECT id FROM payments WHERE id = ? AND user_id = ?";
    
    db.query(ownershipSql, [paymentId, userId], (err, ownershipCheck) => {
        if (err || ownershipCheck.length === 0) {
            return res.status(404).json({ error: "Payment record not found or unauthorized to view history." });
        }
        
        // If ownership is confirmed, fetch the tracking entries
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
    });
};


// 6. DEDICATED STATUS UPDATE
export const updatePaymentStatus = (req, res) => {
    const { id } = req.params; // payment ID
    const { newStatus } = req.body;
    const userId = req.user.id;

    const validStatuses = ['PENDING', 'PARTIAL', 'PAID'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Invalid payment status provided." });
    }

    // 🛑 MULTI-USER FIX: Add AND user_id = ? to restrict update to owned records 🛑
    const sql = `
        UPDATE payments 
        SET payment_status = ? 
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [newStatus, id, userId], (err, result) => {
        if (err) {
            console.error("Database update error (status):", err.message);
            return res.status(500).json({ error: "Failed to update payment status." });
        }
        if (result.affectedRows === 0) {
            // This means either the record wasn't found OR the user didn't own it
            return res.status(404).json({ error: "Payment record not found or unauthorized to update." });
        }
        res.status(200).json({ message: `Status updated to ${newStatus} successfully.` });
    });
};