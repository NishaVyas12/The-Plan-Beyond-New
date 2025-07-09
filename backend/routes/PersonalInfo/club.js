const express = require("express");
const router = express.Router();
const { pool } = require("../../config/database");
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");

// CREATE
router.post("/club", checkAuth, upload, async (req, res) => {
  const {
    club,
    club_name,
    club_contact,
    membership_type,
    membership_status,
    nomineeContact,
    notes,
  } = req.body;

  const userId = req.session.userId;
  const files = req.files?.files || [];
  const filePaths = JSON.stringify(files.map((f) => `/images/${userId}/${f.filename}`));

  try {
    const [result] = await pool.query(
      `INSERT INTO user_club_documents (
        user_id, club, club_name, club_contact, membership_type,
        membership_status, nominee_contact, file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        club,
        club === "Others" ? club_name : null,
        club_contact || null,
        membership_type || null,
        membership_status === "true",
        nomineeContact || null,
        filePaths,
        notes || null,
      ]
    );

    res.json({ success: true, clubId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// READ
router.get("/club", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM user_club_documents WHERE user_id = ?`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/club/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    club,
    club_name,
    club_contact,
    membership_type,
    membership_status,
    nomineeContact,
    notes,
  } = req.body;

  const userId = req.session.userId;
  const files = req.files?.files || [];
  const filePaths = JSON.stringify(files.map((f) => `/images/${userId}/${f.filename}`));

  try {
    await pool.query(
      `UPDATE user_club_documents SET
        club = ?, club_name = ?, club_contact = ?, membership_type = ?,
        membership_status = ?, nominee_contact = ?, file_paths = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        club,
        club === "Others" ? club_name : null,
        club_contact || null,
        membership_type || null,
        membership_status === "true",
        nomineeContact || null,
        filePaths,
        notes || null,
        id,
        userId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/club/:id", checkAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM user_club_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;