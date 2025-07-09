const express = require("express");
const router = express.Router();
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");
const { pool } = require("../../config/database");

router.post("/miscellaneous", checkAuth, upload, async (req, res) => {

    try {
        const { item, description, category, status, nomineeContact, notes } = req.body;
        const userId = req.session.userId;
        // const filePaths = req.files?.map(f => f.path).join(',') || '';

        await pool.query(
            `INSERT INTO user_miscellaneous_documents (
        user_id, item, description, category, status, nominee_contact, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, item, description, category, status === "true", nomineeContact, notes]
        );

        res.json({ success: true, message: "Miscellaneous item saved." });
    } catch (error) {
        console.error("Create error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/miscellaneous", checkAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const [rows] = await pool.query("SELECT * FROM user_miscellaneous_documents WHERE user_id = ?", [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Get error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.put("/miscellaneous/:id", checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { item, description, category, status, nomineeContact, notes } = req.body;
        const filePaths = req.files?.map(f => f.path).join(',') || '';

        await pool.query(
            `UPDATE user_miscellaneous_documents SET
        item = ?, description = ?, category = ?, status = ?, nominee_contact = ?, file_paths = ?, notes = ?
      WHERE id = ?`,
            [item, description, category, status === "true", nomineeContact, filePaths, notes, id]
        );

        res.json({ success: true, message: "Updated successfully." });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.delete("/miscellaneous/:id", checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM user_miscellaneous_documents WHERE id = ?", [id]);
        res.json({ success: true, message: "Deleted successfully." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;