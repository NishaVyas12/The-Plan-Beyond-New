const express = require("express");
const { pool } = require("../../config/database");
const { checkAuth } = require("../../middleware/auth");
const router = express.Router();

// CREATE
router.post("/religion", checkAuth, async (req, res) => {
    const { religion, religion1, nomineeContact } = req.body;
    const userId = req.session.userId;

    try {
        const [result] = await pool.query(
            `INSERT INTO user_religion_documents (user_id, religion, religion_other, nominee_contact)
       VALUES (?, ?, ?, ?)`,
            [userId, religion, religion === "Others" ? religion1 : null, nomineeContact || null]
        );

        res.json({ success: true, religionId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/religion", checkAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        const [rows] = await pool.query(
            `SELECT * FROM user_religion_documents WHERE user_id = ?`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/religion/:id", checkAuth, async (req, res) => {
    const { id } = req.params;
    const { religion, religion1, nomineeContact } = req.body;

    try {
        await pool.query(
            `UPDATE user_religion_documents
       SET religion = ?, religion_other = ?, nominee_contact = ?
       WHERE id = ? AND user_id = ?`,
            [religion, religion === "Others" ? religion1 : null, nomineeContact || null, id, req.session.userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/religion/:id", checkAuth, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `DELETE FROM user_religion_documents WHERE id = ? AND user_id = ?`,
            [id, req.session.userId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;