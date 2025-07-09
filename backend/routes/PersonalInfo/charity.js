const express = require("express");
const router = express.Router();
const { pool } = require("../../config/database");
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");

// CREATE
router.post("/charity", checkAuth, upload, async (req, res) => {
    const {
        charity_name,
        charity_website,
        payment_method,
        amount,
        frequency,
        enrolled,
        nomineeContact,
        notes,
    } = req.body;

    const userId = req.session.userId;
    const files = req.files?.files || [];
    const filePaths = JSON.stringify(
        files.map((f) => `/images/${userId}/${f.filename}`)
    );

    try {
        const [result] = await pool.query(
            `INSERT INTO user_charity_documents (
        user_id, charity_name, charity_website, payment_method, amount,
        frequency, enrolled, nominee_contact, file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                charity_name,
                charity_website || null,
                payment_method || null,
                amount || 0,
                frequency || null,
                enrolled === "true",
                nomineeContact || null,
                filePaths,
                notes || null,
            ]
        );

        res.json({ success: true, charityId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// READ
router.get("/charity", checkAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM user_charity_documents WHERE user_id = ?`,
            [req.session.userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
router.put("/charity/:id", checkAuth, upload, async (req, res) => {
    const {
        charity_name,
        charity_website,
        payment_method,
        amount,
        frequency,
        enrolled,
        nomineeContact,
        notes,
    } = req.body;

    const files = req.files?.files || [];
    const filePaths = files.length
        ? JSON.stringify(files.map((f) => `/images/${req.session.userId}/${f.filename}`))
        : null;

    try {
        const [result] = await pool.query(
            `UPDATE user_charity_documents
       SET charity_name = ?, charity_website = ?, payment_method = ?, amount = ?,
           frequency = ?, enrolled = ?, nominee_contact = ?, file_paths = COALESCE(?, file_paths), notes = ?
       WHERE id = ? AND user_id = ?`,
            [
                charity_name,
                charity_website || null,
                payment_method || null,
                amount || 0,
                frequency || null,
                enrolled === "true",
                nomineeContact || null,
                filePaths,
                notes || null,
                req.params.id,
                req.session.userId,
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete("/charity/:id", checkAuth, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM user_charity_documents WHERE id = ? AND user_id = ?`,
            [req.params.id, req.session.userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;