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

// CREATE Miscellaneous Record
router.post("/miscellaneous", checkAuth, upload, async (req, res) => {
  const { item, description, category, status, nomineeContact, notes } = req.body;
  const userId = req.session.userId;
  const miscellaneousFiles = req.files?.miscellaneousFiles || [];

  if (!item) {
    return sendError(res, 400, "Item name is required.");
  }

  try {
    const filePaths = miscellaneousFiles
      ? miscellaneousFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`)
      : [];

    const [result] = await pool.query(
      `INSERT INTO user_miscellaneous_documents (
        user_id, item, description, category, status, nominee_contact, file_paths, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        item,
        description || null,
        category || null,
        status === "true",
        nomineeContact || null,
        JSON.stringify(filePaths),
        notes || null,
      ]
    );

    res.json({
      success: true,
      miscellaneousId: result.insertId,
      message: "Miscellaneous information saved successfully!",
      documents: [{
        id: result.insertId,
        item,
        description,
        category,
        status: status === "true",
        nominee_contact: nomineeContact,
        file_paths: filePaths,
        notes,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ Miscellaneous Records for current user
router.get("/miscellaneous", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, item, description, category, status, nominee_contact,
       JSON_UNQUOTE(file_paths) AS file_paths, notes,
       created_at, updated_at
       FROM user_miscellaneous_documents WHERE user_id = ? ORDER BY created_at DESC`,
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

// UPDATE Miscellaneous Record
router.put("/miscellaneous/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const { item, description, category, status, nomineeContact, notes } = req.body;
  const userId = req.session.userId;
  const miscellaneousFiles = req.files?.miscellaneousFiles || [];

  if (!item) {
    return sendError(res, 400, "Item name is required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_paths FROM user_miscellaneous_documents WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (!existing.length) return sendError(res, 404, "Miscellaneous document not found.");

    let existingFilePaths = existing[0].file_paths ? JSON.parse(existing[0].file_paths) : [];

    if (miscellaneousFiles.length > 0) {
      for (const filePath of existingFilePaths) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      existingFilePaths = miscellaneousFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    }

    await pool.query(
      `UPDATE user_miscellaneous_documents SET
        item = ?, description = ?, category = ?, status = ?, nominee_contact = ?, file_paths = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        item,
        description || null,
        category || null,
        status === "true",
        nomineeContact || null,
        JSON.stringify(existingFilePaths),
        notes || null,
        id,
        userId,
      ]
    );

    res.json({ success: true, message: "Miscellaneous details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE Miscellaneous Record
router.delete("/miscellaneous/:id", checkAuth, async (req, res) => {
  const miscellaneousId = req.params.id;
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT file_paths FROM user_miscellaneous_documents WHERE id = ? AND user_id = ?`,
      [miscellaneousId, userId]
    );

    if (!rows.length) return sendError(res, 404, "Miscellaneous document not found.");

    const filePaths = rows[0].file_paths ? JSON.parse(rows[0].file_paths) : [];

    await pool.query(
      `DELETE FROM user_miscellaneous_documents WHERE id = ? AND user_id = ?`,
      [miscellaneousId, userId]
    );

    for (const filePath of filePaths) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Miscellaneous details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;