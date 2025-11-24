// import pool from "../../config/db.js";
// import fs from "fs";
// import XLSX from "xlsx";

// // Mapping Excel Columns to DB Columns
// const EXCEL_TO_SQL_MAP = [
//   'party',
//   'contact_no'
// ];

// // --- 1. GET CONTROLLER ---
// export const getPayments = async (req, res) => {
//   const userId = req.user.id;

//   // Uses subqueries to fetch latest activity efficiently
//   const sql = `
//     SELECT
//       p.id,
//       p.party,
//       p.contact_no,
//       p.payment_status,
//       p.month,
//       p.year,
//       p.user_id,
//       p.created_at,
//       p.date_count,
//       (SELECT to_char(payment_date::date, 'YYYY-MM-DD')
//          FROM payment_tracking
//         WHERE payment_id = p.id
//         ORDER BY created_at DESC
//         LIMIT 1) AS latest_payment,
//       (SELECT remark FROM payment_tracking WHERE payment_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_remark
//     FROM payments p
//     WHERE p.user_id = $1
//     ORDER BY p.id ASC;
//   `;

//   try {
//     const { rows } = await pool.query(sql, [userId]);
//     res.json(rows);
//   } catch (err) {
//     console.error("Database query error (getPayments):", err);
//     res.status(500).json({ error: "Failed to query database." });
//   }
// };

// // --- 2. DELETE CONTROLLER (DELETE ALL) ---
// export const deleteAllPayments = async (req, res) => {
//   const userId = req.user.id;
//   // NOTE: This assumes your DB schema has "ON DELETE CASCADE" 
//   // on the payment_tracking table. If not, this might fail.
//   const sql = "DELETE FROM payments WHERE user_id = $1";
//   try {
//     const result = await pool.query(sql, [userId]);
//     res.json({
//       message: `All ${result.rowCount} payment records deleted successfully. History wiped.`,
//       rowsDeleted: result.rowCount
//     });
//   } catch (err) {
//     console.error("Database delete error (deleteAllPayments):", err);
//     res.status(500).json({ error: "Failed to delete records." });
//   }
// };

// // --- 3. POST CONTROLLER (Upload CSV/XLSX) ---
// export const uploadCSV = async (req, res) => {
//   const userId = req.user.id;

//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }
//   const filePath = req.file.path;
//   let records = [];

//   try {
//     const fileBuffer = fs.readFileSync(filePath);
//     const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const rawSheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
//       header: 1,
//       range: 0,
//       defval: null
//     });

//     if (rawSheetData.length === 0) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ error: "File is empty." });
//     }

//     let headerRowIndex = -1;
//     for (let i = 0; i < rawSheetData.length; i++) {
//       const row = rawSheetData[i];
//       if (row && String(row[0] || '').trim().toLowerCase() === 'party') {
//         headerRowIndex = i;
//         break;
//       }
//     }
//     if (headerRowIndex === -1) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ error: "Could not find the 'Party' header row in the file." });
//     }

//     const dataRows = rawSheetData.slice(headerRowIndex + 1);
//     const headers = rawSheetData[headerRowIndex];

//     records = dataRows.map(row => {
//       const rawPartyValue = String(row[0] || '').trim();
//       if (!row || rawPartyValue === '' || rawPartyValue.toLowerCase() === 'total') return null;

//       const record = {};
//       headers.forEach((fileHeader, index) => {
//         const sqlKey = EXCEL_TO_SQL_MAP[index];
//         if (sqlKey) {
//           const rawValue = row[index] !== undefined ? row[index] : null;
//           record[sqlKey] = rawValue === "" ? null : rawValue;
//         }
//       });

//       if (!record.party) return null;
//       return record;
//     }).filter(r => r !== null);

//     try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

//   } catch (err) {
//     try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
//     console.error("File processing error:", err);
//     return res.status(500).json({ error: "Failed to read file." });
//   }

//   if (records.length === 0) {
//     return res.status(400).json({ error: "No valid data rows found." });
//   }

//   const now = new Date();
//   const currentMonth = now.toLocaleString('default', { month: 'long' });
//   const currentYear = now.getFullYear();

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     const existingRes = await client.query(
//       `SELECT party FROM payments WHERE user_id = $1 AND month = $2 AND year = $3`,
//       [userId, currentMonth, currentYear]
//     );

//     const existingPartiesPool = existingRes.rows.map(r => r.party);
//     const rowsToInsert = [];

//     for (const rec of records) {
//       const matchIndex = existingPartiesPool.indexOf(rec.party);
//       if (matchIndex !== -1) {
//         existingPartiesPool.splice(matchIndex, 1);
//       } else {
//         rowsToInsert.push(rec);
//       }
//     }

//     if (rowsToInsert.length > 0) {
//       const columns = [...EXCEL_TO_SQL_MAP, 'payment_status', 'user_id', 'month', 'year'];
//       const values = [];
//       const rowPlaceholders = [];
//       let paramIndex = 1;

//       for (const rec of rowsToInsert) {
//         const singleRowPlaceholders = [];
//         values.push(rec.party);
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         values.push(rec.contact_no);
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         values.push('PENDING');
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         values.push(userId);
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         values.push(currentMonth);
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         values.push(currentYear);
//         singleRowPlaceholders.push(`$${paramIndex++}`);
//         rowPlaceholders.push(`(${singleRowPlaceholders.join(', ')})`);
//       }

//       const insertSql = `INSERT INTO payments (${columns.join(', ')}) VALUES ${rowPlaceholders.join(', ')}`;
//       await client.query(insertSql, values);
//     }

//     await client.query('COMMIT');
//     res.status(201).json({
//       message: `Processed ${records.length} rows. Inserted ${rowsToInsert.length} new records.`,
//       rowsInserted: rowsToInsert.length
//     });

//   } catch (err) {
//     await client.query('ROLLBACK').catch(() => {});
//     console.error("Database insert error:", err);
//     res.status(500).json({ error: "Failed to insert data.", details: err.message });
//   } finally {
//     client.release();
//   }
// };

// // --- 4. ADD TRACKING ENTRY ---
// export const addTrackingEntry = async (req, res) => {
//   const { paymentId } = req.params;
//   const { entry_date, remark } = req.body;
//   const userId = req.user.id;

//   if (!entry_date && !remark) {
//     return res.status(400).json({ error: "entry_date or remark must be provided." });
//   }

//   try {
//     const ownership = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
//     if (ownership.rowCount === 0) {
//       return res.status(404).json({ error: "Payment record not found or unauthorized." });
//     }

//     const insertSql = `
//       INSERT INTO payment_tracking (payment_id, payment_date, remark)
//       VALUES ($1, $2, $3)
//       RETURNING id;
//     `;

//     // Ensure entry_date is mapped to payment_date
//     const { rows } = await pool.query(insertSql, [paymentId, entry_date || null, remark || null]);
//     res.status(201).json({ message: "Tracking entry added successfully.", id: rows[0].id });
//   } catch (err) {
//     console.error("Database insert error (addTrackingEntry):", err);
//     res.status(500).json({ error: "Failed to save tracking entry." });
//   }
// };

// // --- 5. GET TRACKING ENTRIES ---
// export const getTrackingEntries = async (req, res) => {
//   const { paymentId } = req.params;
//   const userId = req.user.id;

//   try {
//     const ownership = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
//     if (ownership.rowCount === 0) {
//       return res.status(404).json({ error: "Payment record not found or unauthorized." });
//     }

//     const sql = `
//       SELECT id, payment_date AS actual_payment, remark, created_at
//       FROM payment_tracking
//       WHERE payment_id = $1
//       ORDER BY created_at DESC
//     `;
//     const { rows } = await pool.query(sql, [paymentId]);
//     res.json(rows);
//   } catch (err) {
//     console.error("Database query error (getTrackingEntries):", err);
//     res.status(500).json({ error: "Failed to fetch tracking history." });
//   }
// };

// // --- 6. UPDATE PAYMENT STATUS ---
// export const updatePaymentStatus = async (req, res) => {
//   const { id } = req.params;
//   const { newStatus } = req.body;
//   const userId = req.user.id;
  
//   const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'NO_RESPONSE', 'CLOSE_PARTY'];
  
//   if (!validStatuses.includes(newStatus)) {
//     return res.status(400).json({ error: "Invalid payment status provided." });
//   }

//   try {
//     const sql = `UPDATE payments SET payment_status = $1 WHERE id = $2 AND user_id = $3`;
//     const result = await pool.query(sql, [newStatus, id, userId]);

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Payment record not found or unauthorized to update." });
//     }
//     res.status(200).json({ message: `Status updated to ${newStatus} successfully.` });
//   } catch (err) {
//     console.error("Database update error (updatePaymentStatus):", err);
//     res.status(500).json({ error: "Failed to update payment status." });
//   }
// };

// // --- 7. MERGE PAYMENTS (VERIFIED) ---
// export const mergePayments = async (req, res) => {
//   const { targetId, sourceIds } = req.body;
//   const userId = req.user.id;

//   if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
//     return res.status(400).json({ error: "Invalid merge request data." });
//   }

//   const targetIdInt = parseInt(targetId, 10);
//   const sourceIdsInt = sourceIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

//   if (isNaN(targetIdInt) || sourceIdsInt.length === 0) {
//     return res.status(400).json({ error: "Invalid IDs provided (must be numbers)." });
//   }

//   const client = await pool.connect();

//   try {
//     await client.query('BEGIN');

//     // Security: Check if user owns ALL involved records
//     const allIds = Array.from(new Set([targetIdInt, ...sourceIdsInt]));
//     const checkSql = `SELECT id FROM payments WHERE user_id = $1 AND id = ANY($2)`;
//     const checkRes = await client.query(checkSql, [userId, allIds]);

//     if (checkRes.rowCount !== allIds.length) {
//       throw new Error("One or more records do not exist or do not belong to you.");
//     }
    
    

//     // 1. Move History: Update tracking rows to point to targetId
//     const moveHistorySql = `UPDATE payment_tracking SET payment_id = $1 WHERE payment_id = ANY($2)`;
//     await client.query(moveHistorySql, [targetIdInt, sourceIdsInt]);

//     // 2. Delete Sources: Remove the old payment headers
//     const deleteSql = `DELETE FROM payments WHERE id = ANY($1)`;
//     await client.query(deleteSql, [sourceIdsInt]);

//     await client.query('COMMIT');
//     res.json({ message: "Records merged successfully." });

//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error("Merge error details:", err);
//     res.status(500).json({ error: err.message || "Failed to merge records." });
//   } finally {
//     client.release();
//   }
// };

// // --- 8. UPDATE PAYMENT DETAILS ---
// export const updatePaymentDetails = async (req, res) => {
//   const { id } = req.params;
//   const { party, contact_no } = req.body;
//   const userId = req.user.id;

//   if (!party) {
//     return res.status(400).json({ error: "Party name is required." });
//   }

//   try {
//     const sql = `UPDATE payments SET party = $1, contact_no = $2 WHERE id = $3 AND user_id = $4 RETURNING *`;
//     const { rows } = await pool.query(sql, [party, contact_no, id, userId]);

//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Record not found or unauthorized." });
//     }

//     res.json({ message: "Details updated successfully.", payment: rows[0] });
//   } catch (err) {
//     console.error("Update details error:", err);
//     res.status(500).json({ error: "Failed to update details." });
//   }
// };

// // --- 9. UPDATE TRACKING ENTRY (FIXED) ---
// export const updateTrackingEntry = async (req, res) => {
//   const { id } = req.params; 
//   // FIX: Destructure 'entry_date' which matches Frontend, not 'payment_date'
//   const { entry_date, remark } = req.body;
//   const userId = req.user.id;

//   try {
//     const checkSql = `
//       SELECT t.id 
//       FROM payment_tracking t
//       JOIN payments p ON t.payment_id = p.id
//       WHERE t.id = $1 AND p.user_id = $2
//     `;
//     const check = await pool.query(checkSql, [id, userId]);
//     if (check.rowCount === 0) return res.status(404).json({ error: "Entry not found or unauthorized." });

//     const updateSql = `
//       UPDATE payment_tracking 
//       SET payment_date = COALESCE($1, payment_date), 
//           remark = COALESCE($2, remark)
//       WHERE id = $3
//       RETURNING *
//     `;
//     // Pass entry_date to the query
//     const { rows } = await pool.query(updateSql, [entry_date, remark, id]);
//     res.json(rows[0]);
//   } catch (err) {
//     console.error("Update tracking error:", err);
//     res.status(500).json({ error: "Failed to update entry." });
//   }
// };

// // --- 10. DELETE TRACKING ENTRY ---
// export const deleteTrackingEntry = async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;

//   try {
//     const checkSql = `
//       SELECT t.id FROM payment_tracking t
//       JOIN payments p ON t.payment_id = p.id
//       WHERE t.id = $1 AND p.user_id = $2
//     `;
//     const check = await pool.query(checkSql, [id, userId]);
//     if (check.rowCount === 0) return res.status(404).json({ error: "Entry not found or unauthorized." });

//     await pool.query('DELETE FROM payment_tracking WHERE id = $1', [id]);
//     res.json({ message: "Entry deleted successfully." });
//   } catch (err) {
//     console.error("Delete tracking error:", err);
//     res.status(500).json({ error: "Failed to delete entry." });
//   }
// };

// backend/src/modules/controllers/payments.js
import pool from "../../config/db.js";
import fs from "fs";
import XLSX from "xlsx";

// Mapping Excel Columns to DB Columns
const EXCEL_TO_SQL_MAP = [
  'party',
  'contact_no'
];

// --- 1. GET CONTROLLER ---
export const getPayments = async (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      p.id,
      p.party,
      p.contact_no,
      p.payment_status,
      p.month,
      p.year,
      p.user_id,
      p.created_at,
      p.date_count,
      p.merged_into_id,
      (SELECT to_char(payment_date::date, 'YYYY-MM-DD')
         FROM payment_tracking
        WHERE payment_id = p.id
        ORDER BY created_at DESC
        LIMIT 1) AS latest_payment,
      (SELECT remark FROM payment_tracking WHERE payment_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_remark
    FROM payments p
    WHERE p.user_id = $1
    ORDER BY p.id ASC;
  `;

  try {
    const { rows } = await pool.query(sql, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Database query error (getPayments):", err);
    res.status(500).json({ error: "Failed to query database." });
  }
};

// --- 2. DELETE ALL ---
export const deleteAllPayments = async (req, res) => {
  const userId = req.user.id;
  const sql = "DELETE FROM payments WHERE user_id = $1";
  try {
    const result = await pool.query(sql, [userId]);
    res.json({
      message: `All ${result.rowCount} payment records deleted successfully.`,
      rowsDeleted: result.rowCount
    });
  } catch (err) {
    console.error("Database delete error (deleteAllPayments):", err);
    res.status(500).json({ error: "Failed to delete records." });
  }
};

// --- 3. UPLOAD CSV/XLSX ---
export const uploadCSV = async (req, res) => {
  const userId = req.user.id;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
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
    for (let i = 0; i < rawSheetData.length; i++) {
      const row = rawSheetData[i];
      if (row && String(row[0] || '').trim().toLowerCase() === 'party') {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex === -1) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Could not find the 'Party' header row in the file." });
    }

    const dataRows = rawSheetData.slice(headerRowIndex + 1);
    const headers = rawSheetData[headerRowIndex];

    records = dataRows.map(row => {
      const rawPartyValue = String(row[0] || '').trim();
      if (!row || rawPartyValue === '' || rawPartyValue.toLowerCase() === 'total') return null;

      const record = {};
      headers.forEach((fileHeader, index) => {
        const sqlKey = EXCEL_TO_SQL_MAP[index];
        if (sqlKey) {
          const rawValue = row[index] !== undefined ? row[index] : null;
          record[sqlKey] = rawValue === "" ? null : rawValue;
        }
      });

      if (!record.party) return null;
      return record;
    }).filter(r => r !== null);

    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  } catch (err) {
    try { fs.unlinkSync(filePath); } catch (e) {}
    console.error("File processing error:", err);
    return res.status(500).json({ error: "Failed to read file." });
  }

  if (records.length === 0) return res.status(400).json({ error: "No valid data rows found." });

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query(
      `SELECT party FROM payments WHERE user_id = $1 AND month = $2 AND year = $3`,
      [userId, currentMonth, currentYear]
    );

    const existingPartiesPool = existingRes.rows.map(r => r.party);
    const rowsToInsert = [];

    for (const rec of records) {
      const matchIndex = existingPartiesPool.indexOf(rec.party);
      if (matchIndex !== -1) {
        existingPartiesPool.splice(matchIndex, 1);
      } else {
        rowsToInsert.push(rec);
      }
    }

    if (rowsToInsert.length > 0) {
      const columns = [...EXCEL_TO_SQL_MAP, 'payment_status', 'user_id', 'month', 'year'];
      const values = [];
      const rowPlaceholders = [];
      let paramIndex = 1;

      for (const rec of rowsToInsert) {
        const singleRowPlaceholders = [];
        values.push(rec.party);
        singleRowPlaceholders.push(`$${paramIndex++}`);
        values.push(rec.contact_no);
        singleRowPlaceholders.push(`$${paramIndex++}`);
        values.push('PENDING');
        singleRowPlaceholders.push(`$${paramIndex++}`);
        values.push(userId);
        singleRowPlaceholders.push(`$${paramIndex++}`);
        values.push(currentMonth);
        singleRowPlaceholders.push(`$${paramIndex++}`);
        values.push(currentYear);
        singleRowPlaceholders.push(`$${paramIndex++}`);
        rowPlaceholders.push(`(${singleRowPlaceholders.join(', ')})`);
      }

      const insertSql = `INSERT INTO payments (${columns.join(', ')}) VALUES ${rowPlaceholders.join(', ')}`;
      await client.query(insertSql, values);
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: `Processed ${records.length} rows. Inserted ${rowsToInsert.length} new records.`,
      rowsInserted: rowsToInsert.length
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Database insert error:", err);
    res.status(500).json({ error: "Failed to insert data.", details: err.message });
  } finally {
    client.release();
  }
};

// --- 4. ADD TRACKING ENTRY ---
export const addTrackingEntry = async (req, res) => {
  const { paymentId } = req.params;
  const { entry_date, remark } = req.body;
  const userId = req.user.id;

  if (!entry_date && !remark) return res.status(400).json({ error: "entry_date or remark must be provided." });

  try {
    const ownership = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
    if (ownership.rowCount === 0) return res.status(404).json({ error: "Payment record not found or unauthorized." });

    const insertSql = `
      INSERT INTO payment_tracking (payment_id, payment_date, remark)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    const { rows } = await pool.query(insertSql, [paymentId, entry_date || null, remark || null]);
    res.status(201).json({ message: "Tracking entry added successfully.", id: rows[0].id });
  } catch (err) {
    console.error("Database insert error (addTrackingEntry):", err);
    res.status(500).json({ error: "Failed to save tracking entry." });
  }
};

// --- 5. GET TRACKING ENTRIES ---
export const getTrackingEntries = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    const ownership = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
    if (ownership.rowCount === 0) return res.status(404).json({ error: "Payment record not found or unauthorized." });

    const sql = `
      SELECT id, payment_date AS actual_payment, remark, created_at
      FROM payment_tracking
      WHERE payment_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(sql, [paymentId]);
    res.json(rows);
  } catch (err) {
    console.error("Database query error (getTrackingEntries):", err);
    res.status(500).json({ error: "Failed to fetch tracking history." });
  }
};

// --- 6. UPDATE PAYMENT STATUS ---
export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;
  const userId = req.user.id;
  
  const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'NO_RESPONSE', 'CLOSE_PARTY'];
  
  if (!validStatuses.includes(newStatus)) return res.status(400).json({ error: "Invalid payment status provided." });

  try {
    const sql = `UPDATE payments SET payment_status = $1 WHERE id = $2 AND user_id = $3`;
    const result = await pool.query(sql, [newStatus, id, userId]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Payment record not found or unauthorized to update." });
    res.status(200).json({ message: `Status updated to ${newStatus} successfully.` });
  } catch (err) {
    console.error("Database update error (updatePaymentStatus):", err);
    res.status(500).json({ error: "Failed to update payment status." });
  }
};

// --- 7. MERGE PAYMENTS (mark sources and move tracking) ---
export const mergePayments = async (req, res) => {
  const { targetId, sourceIds } = req.body;
  const userId = req.user.id;

  if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) return res.status(400).json({ error: "Invalid merge request data." });

  const targetIdInt = parseInt(targetId, 10);
  const sourceIdsInt = sourceIds
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id) && Number(id) !== Number(targetIdInt));

  if (isNaN(targetIdInt) || sourceIdsInt.length === 0) return res.status(400).json({ error: "Invalid IDs provided (must be numbers and not same as target)." });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const allIds = Array.from(new Set([targetIdInt, ...sourceIdsInt]));
    const checkSql = `SELECT id FROM payments WHERE user_id = $1 AND id = ANY($2)`;
    const checkRes = await client.query(checkSql, [userId, allIds]);
    if (checkRes.rowCount !== allIds.length) throw new Error("One or more records do not exist or do not belong to you.");

    const moveHistorySql = `UPDATE payment_tracking SET payment_id = $1 WHERE payment_id = ANY($2)`;
    await client.query(moveHistorySql, [targetIdInt, sourceIdsInt]);

    const markMergedSql = `UPDATE payments SET merged_into_id = $1 WHERE id = ANY($2)`;
    await client.query(markMergedSql, [targetIdInt, sourceIdsInt]);

    await client.query('COMMIT');
    res.json({ message: "Records merged successfully (sources marked & history moved)." });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Merge error details:", err);
    res.status(500).json({ error: err.message || "Failed to merge records." });
  } finally {
    client.release();
  }
};

// --- 8. UPDATE PAYMENT DETAILS ---
export const updatePaymentDetails = async (req, res) => {
  const { id } = req.params;
  const { party, contact_no } = req.body;
  const userId = req.user.id;

  if (!party) return res.status(400).json({ error: "Party name is required." });

  try {
    const sql = `UPDATE payments SET party = $1, contact_no = $2 WHERE id = $3 AND user_id = $4 RETURNING *`;
    const { rows } = await pool.query(sql, [party, contact_no, id, userId]);

    if (rows.length === 0) return res.status(404).json({ error: "Record not found or unauthorized." });

    res.json({ message: "Details updated successfully.", payment: rows[0] });
  } catch (err) {
    console.error("Update details error:", err);
    res.status(500).json({ error: "Failed to update details." });
  }
};

// --- 9. UPDATE TRACKING ENTRY ---
export const updateTrackingEntry = async (req, res) => {
  const { id } = req.params;
  const { entry_date, remark } = req.body;
  const userId = req.user.id;

  try {
    const checkSql = `
      SELECT t.id 
      FROM payment_tracking t
      JOIN payments p ON t.payment_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `;
    const check = await pool.query(checkSql, [id, userId]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Entry not found or unauthorized." });

    const updateSql = `
      UPDATE payment_tracking 
      SET payment_date = COALESCE($1, payment_date), 
          remark = COALESCE($2, remark)
      WHERE id = $3
      RETURNING *
    `;
    const { rows } = await pool.query(updateSql, [entry_date, remark, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Update tracking error:", err);
    res.status(500).json({ error: "Failed to update entry." });
  }
};

// --- 10. DELETE TRACKING ENTRY ---
export const deleteTrackingEntry = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const checkSql = `
      SELECT t.id FROM payment_tracking t
      JOIN payments p ON t.payment_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `;
    const check = await pool.query(checkSql, [id, userId]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Entry not found or unauthorized." });

    await pool.query('DELETE FROM payment_tracking WHERE id = $1', [id]);
    res.json({ message: "Entry deleted successfully." });
  } catch (err) {
    console.error("Delete tracking error:", err);
    res.status(500).json({ error: "Failed to delete entry." });
  }
};

// --- 11. GET MERGED CHILDREN ---
export const getMergedPayments = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const parent = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [id, userId]);
    if (parent.rowCount === 0) return res.status(404).json({ error: "Payment not found or unauthorized." });

    const sql = `SELECT id, party, contact_no, payment_status, month, year, merged_into_id, date_count, created_at FROM payments WHERE merged_into_id = $1 AND user_id = $2 ORDER BY id ASC`;
    const { rows } = await pool.query(sql, [id, userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching merged accounts:", err);
    res.status(500).json({ error: "Failed to fetch merged accounts." });
  }
};

// --- 12. UNMERGE (set merged_into_id = NULL) ---
export const unmergePayment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const check = await pool.query('SELECT id FROM payments WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Record not found or unauthorized." });

    const sql = `UPDATE payments SET merged_into_id = NULL WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(sql, [id]);
    res.json({ message: "Record unmerged.", payment: rows[0] });
  } catch (err) {
    console.error("Unmerge error:", err);
    res.status(500).json({ error: "Failed to unmerge record." });
  }
};
