const express = require("express");
const router = express.Router();
const { checkAuth } = require("../../middleware/auth");
const { upload } = require("../../middleware/multer");
const { pool } = require("../../config/database");
const path = require("path");
const fs = require("fs/promises");

const sendError = (res, status, message) => {
  console.error(message);
  res.status(status).json({ success: false, message });
};

// CREATE Military Record
router.post("/military", checkAuth, upload, async (req, res) => {
  const {
    military_branch,
    military_name,
    military_rank,
    service_type,
    military_serve,
    service_status,
    nomineeContact,
    military_location,
    notes,
  } = req.body;
  const userId = req.session.userId;
  const militaryFiles = req.files?.militaryFiles || [];

  if (!military_branch) {
    return sendError(res, 400, "Military branch is required.");
  }

  try {
    const filePaths = militaryFiles
      ? militaryFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`)
      : [];

    const [result] = await pool.query(
      `INSERT INTO user_military_documents (
        user_id, military_branch, military_name, military_rank, service_type,
        military_serve, service_status, nominee_contact, military_location,
        file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        military_branch,
        military_branch === "Others" ? military_name : null,
        military_rank || null,
        service_type || null,
        military_serve || null,
        service_status === "true",
        nomineeContact || null,
        military_location || null,
        JSON.stringify(filePaths),
        notes || null,
      ]
    );

    res.json({
      success: true,
      militaryId: result.insertId,
      message: "Military information saved successfully!",
      documents: [{
        id: result.insertId,
        military_branch,
        military_name: military_branch === "Others" ? military_name : null,
        military_rank,
        service_type,
        military_serve,
        service_status: service_status === "true",
        nominee_contact: nomineeContact,
        military_location,
        file_paths: filePaths,
        notes,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ Military Records for current user
router.get("/military", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, military_branch, military_name, military_rank, service_type,
       military_serve, service_status, nominee_contact, military_location,
       JSON_UNQUOTE(file_paths) AS file_paths, notes,
       created_at, updated_at
       FROM user_military_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
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

// UPDATE Military Record
router.put("/military/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    military_branch,
    military_name,
    military_rank,
    service_type,
    military_serve,
    service_status,
    nomineeContact,
    military_location,
    notes,
  } = req.body;
  const userId = req.session.userId;
  const militaryFiles = req.files?.militaryFiles || [];

  if (!military_branch) {
    return sendError(res, 400, "Military branch is required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_paths FROM user_military_documents WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!existing.length) return sendError(res, 404, "Military document not found.");

    let existingFilePaths = existing[0].file_paths ? JSON.parse(existing[0].file_paths) : [];

    if (militaryFiles.length > 0) {
      for (const filePath of existingFilePaths) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      existingFilePaths = militaryFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    }

    await pool.query(
      `UPDATE user_military_documents SET
        military_branch = ?, military_name = ?, military_rank = ?, service_type = ?,
        military_serve = ?, service_status = ?, nominee_contact = ?, military_location = ?,
        file_paths = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        military_branch,
        military_branch === "Others" ? military_name : null,
        military_rank || null,
        service_type || null,
        military_serve || null,
        service_status === "true",
        nomineeContact || null,
        military_location || null,
        JSON.stringify(existingFilePaths),
        notes || null,
        id,
        userId,
      ]
    );

    res.json({ success: true, message: "Military details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE Military Record
router.delete("/military/:id", checkAuth, async (req, res) => {
  const militaryId = req.params.id;
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT file_paths FROM user_military_documents WHERE id = ? AND user_id = ?`,
      [militaryId, userId]
    );

    if (!rows.length) return sendError(res, 404, "Military document not found.");

    const filePaths = rows[0].file_paths ? JSON.parse(rows[0].file_paths) : [];

    await pool.query(
      `DELETE FROM user_military_documents WHERE id = ? AND user_id = ?`,
      [militaryId, userId]
    );

    for (const filePath of filePaths) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Military details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;