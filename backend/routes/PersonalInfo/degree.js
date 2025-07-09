const express = require("express");
const router = express.Router();
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");
const { pool } = require("../../config/database");

// CREATE Degree
router.post("/degrees", checkAuth, upload, async (req, res) => {
    const {
        university_name,
        degree,
        degree_field,
        degree_type,
        degree_start,
        degree_end,
        grade,
        completion_status,
        nomineeContact,
        activities,
        notes,
    } = req.body;

    const userId = req.session.userId;
    const files = req.files?.files || [];
    const filePaths = JSON.stringify(files.map((f) => `/images/${userId}/${f.filename}`));

    try {
        const [result] = await pool.query(
            `INSERT INTO user_degrees (
        user_id, university_name, degree, degree_field, degree_type, 
        degree_start, degree_end, grade, completion_status, nominee_contact, 
        activities, file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, university_name, degree, degree_field || null, degree_type || null,
                degree_start || null, degree_end || null, grade || null,
                completion_status === "true", nomineeContact || null,
                activities || null, filePaths, notes || null,
            ]
        );

        res.json({ success: true, degreeId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// READ Degrees for current user
router.get("/degrees", checkAuth, async (req, res) => {
    const userId = req.session.userId;
    try {
        const [degrees] = await pool.query("SELECT * FROM user_degrees WHERE user_id = ?", [userId]);
        res.json({ success: true, degrees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE Degree
router.delete("/degrees/:id", checkAuth, async (req, res) => {
    const degreeId = req.params.id;
    const userId = req.session.userId;

    try {
        const [result] = await pool.query("DELETE FROM user_degrees WHERE id = ? AND user_id = ?", [degreeId, userId]);
        res.json({ success: result.affectedRows > 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;