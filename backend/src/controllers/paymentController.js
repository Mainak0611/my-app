// backend/src/controllers/paymentController.js
import db from "../config/db.js";

export const getPayments = (req, res) => {
  const sql = "SELECT * FROM payments";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
