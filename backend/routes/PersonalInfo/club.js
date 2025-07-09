const express = require("express");
const router = express.Router();
const { pool } = require("../../config/database");
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");
const path = require("path");
const fs = require("fs/promises");

const sendError = (res, status, message) => {
  console.error(message);
  res.status(status).json({ success: false, message });
};

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
  const clubFiles = req.files?.clubFiles || [];

  if (!club) {
    return sendError(res, 400, "Club name is required.");
  }

  try {
    const filePaths = clubFiles
      ? clubFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`)
      : [];

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
        JSON.stringify(filePaths),
        notes || null,
      ]
    );

    res.json({
      success: true,
      clubId: result.insertId,
      message: "Club information saved successfully!",
      documents: [{
        id: result.insertId,
        club,
        club_name: club === "Others" ? club_name : null,
        club_contact,
        membership_type,
        membership_status: membership_status === "true",
        nominee_contact: nomineeContact,
        file_paths: filePaths,
        notes,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ
router.get("/club", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, club, club_name, club_contact, membership_type,
       membership_status, nominee_contact,
       JSON_UNQUOTE(file_paths) AS file_paths, notes,
       created_at, updated_at
       FROM user_club_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const documents = rows.map(row => ({
      ...row,
      file_paths: row.file_paths ? JSON.parse(row.file_paths) : [],
    }));

    res.json({ success: true, documents });
  } catch (err) {
    sendError(res, 500, `Fetch failed: ${err.message}`);
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
  const clubFiles = req.files?.clubFiles || [];

  if (!club) {
    return sendError(res, 400, "Club name is required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_paths FROM user_club_documents WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!existing.length) return sendError(res, 404, "Club document not found.");

    let existingFilePaths = existing[0].file_paths ? JSON.parse(existing[0].file_paths) : [];

    if (clubFiles.length > 0) {
      for (const filePath of existingFilePaths) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      existingFilePaths = clubFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    }

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
        JSON.stringify(existingFilePaths),
        notes || null,
        id,
        userId,
      ]
    );

    res.json({ success: true, message: "Club details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE
router.delete("/club/:id", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT file_paths FROM user_club_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.userId]
    );

    if (!rows.length) return sendError(res, 404, "Club document not found.");

    const filePaths = rows[0].file_paths ? JSON.parse(rows[0].file_paths) : [];

    await pool.query(
      `DELETE FROM user_club_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.userId]
    );

    for (const filePath of filePaths) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Club details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;