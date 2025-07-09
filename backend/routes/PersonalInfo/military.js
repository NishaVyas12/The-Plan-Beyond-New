const express = require("express");
const router = express.Router();
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");
const { pool } = require("../../config/database");

router.post("/military", checkAuth, upload, async (req, res) => {
    try {
        const {
            military_branch, military_name, military_rank, service_type,
            military_serve, service_status, nominee_contact,
            military_location, notes
        } = req.body;

        const userId = req.session.userId;
        // const filePaths = req.files?.map(file => file.path).join(",") || "";

        await pool.query(`
      INSERT INTO user_military_documents (
        user_id, military_branch, military_name, military_rank, service_type,
        military_serve, service_status, nominee_contact,
        military_location, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            userId, military_branch, military_name, military_rank, service_type,
            military_serve, service_status === "true", nominee_contact,
            military_location, notes
        ]);

        res.json({ success: true, message: "Military record saved." });
    } catch (error) {
        console.error("Create error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/military", checkAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const [rows] = await pool.query("SELECT * FROM user_military_documents WHERE user_id = ?", [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.put("/military/:id", checkAuth, async (req, res) => {

    try {
        const { id } = req.params;
        const {
            military_branch, military_name, military_rank, service_type,
            military_serve, service_status, nominee_contact,
            military_location, notes
        } = req.body;

        const filePaths = req.files?.map(file => file.path).join(",") || "";

        await pool.query(`
      UPDATE user_military_documents SET
        military_branch = ?, military_name = ?, military_rank = ?, service_type = ?,
        military_serve = ?, service_status = ?, nominee_contact = ?,
        military_location = ?, file_paths = ?, notes = ?
      WHERE id = ?
    `, [
            military_branch, military_name, military_rank, service_type,
            military_serve, service_status === "true", nominee_contact,
            military_location, filePaths, notes, id
        ]);

        res.json({ success: true, message: "Military record updated." });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.delete("/military/:id", checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM user_military_documents WHERE id = ?", [id]);
        res.json({ success: true, message: "Military record deleted." });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;