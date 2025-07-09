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
  const degreeFiles = req.files?.degreeFiles || [];

  if (!university_name || !degree) {
    return sendError(res, 400, "University name and degree are required.");
  }

  try {
    const filePaths = degreeFiles
      ? degreeFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`)
      : [];

    const [result] = await pool.query(
      `INSERT INTO user_degrees (
        user_id, university_name, degree, degree_field, degree_type, 
        degree_start, degree_end, grade, completion_status, nominee_contact, 
        activities, file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        university_name,
        degree,
        degree_field || null,
        degree_type || null,
        degree_start || null,
        degree_end || null,
        grade || null,
        completion_status === "true",
        nomineeContact || null,
        activities || null,
        JSON.stringify(filePaths),
        notes || null,
      ]
    );

    res.json({
      success: true,
      degreeId: result.insertId,
      message: "Degree information saved successfully!",
      documents: [{
        id: result.insertId,
        university_name,
        degree,
        degree_field,
        degree_type,
        degree_start,
        degree_end,
        grade,
        completion_status: completion_status === "true",
        nominee_contact: nomineeContact,
        file_paths: filePaths,
        activities,
        notes,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ Degrees for current user
router.get("/degrees", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, university_name, degree, degree_field, degree_type,
       degree_start, degree_end, grade, completion_status, nominee_contact,
       JSON_UNQUOTE(file_paths) AS file_paths, activities, notes,
       created_at, updated_at
       FROM user_degrees WHERE user_id = ? ORDER BY created_at DESC`,
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

// UPDATE Degree
router.put("/degrees/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
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
  const degreeFiles = req.files?.degreeFiles || [];

  if (!university_name || !degree) {
    return sendError(res, 400, "University name and degree are required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_paths FROM user_degrees WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!existing.length) return sendError(res, 404, "Degree document not found.");

    let existingFilePaths = existing[0].file_paths ? JSON.parse(existing[0].file_paths) : [];

    if (degreeFiles.length > 0) {
      for (const filePath of existingFilePaths) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      existingFilePaths = degreeFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    }

    await pool.query(
      `UPDATE user_degrees SET
        university_name = ?, degree = ?, degree_field = ?, degree_type = ?,
        degree_start = ?, degree_end = ?, grade = ?, completion_status = ?,
        nominee_contact = ?, activities = ?, file_paths = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        university_name,
        degree,
        degree_field || null,
        degree_type || null,
        degree_start || null,
        degree_end || null,
        grade || null,
        completion_status === "true",
        nomineeContact || null,
        activities || null,
        JSON.stringify(existingFilePaths),
        notes || null,
        id,
        userId,
      ]
    );

    res.json({ success: true, message: "Degree details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE Degree
router.delete("/degrees/:id", checkAuth, async (req, res) => {
  const degreeId = req.params.id;
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT file_paths FROM user_degrees WHERE id = ? AND user_id = ?`,
      [degreeId, userId]
    );

    if (!rows.length) return sendError(res, 404, "Degree document not found.");

    const filePaths = rows[0].file_paths ? JSON.parse(rows[0].file_paths) : [];

    await pool.query(
      `DELETE FROM user_degrees WHERE id = ? AND user_id = ?`,
      [degreeId, userId]
    );

    for (const filePath of filePaths) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Degree details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;