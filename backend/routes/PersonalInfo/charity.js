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
  const charityFiles = req.files?.charityFiles || [];
  const newFolderDocs = req.files?.newFolderDocuments || [];

  if (!charity_name) {
    return sendError(res, 400, "Charity name is required.");
  }

  try {
    const charityPaths = charityFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    const newFolderPaths = newFolderDocs.map(file => `/images/${userId}/documents/newfolder/${file.filename}`);

    const [result] = await pool.query(
      `INSERT INTO user_charity_documents (
        user_id, charity_name, charity_website, payment_method, amount,
        frequency, enrolled, nominee_contact, file_paths, new_folder_documents, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        charity_name,
        charity_website || null,
        payment_method || null,
        amount || 0,
        frequency || null,
        enrolled === "true",
        nomineeContact || null,
        JSON.stringify(charityPaths),
        JSON.stringify(newFolderPaths),
        notes || null,
      ]
    );

    res.json({
      success: true,
      charityId: result.insertId,
      message: "Charity information saved successfully!",
      documents: [{
        id: result.insertId,
        charity_name,
        charity_website,
        payment_method,
        amount,
        frequency,
        enrolled: enrolled === "true",
        nominee_contact: nomineeContact,
        file_paths: charityPaths,
        new_folder_documents: newFolderPaths,
        notes,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ
router.get("/charity", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, charity_name, charity_website, payment_method, amount,
       frequency, enrolled, nominee_contact,
       JSON_UNQUOTE(file_paths) AS file_paths,
       JSON_UNQUOTE(new_folder_documents) AS new_folder_documents,
       notes, created_at, updated_at
       FROM user_charity_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const documents = rows.map(row => ({
      ...row,
      file_paths: row.file_paths ? JSON.parse(row.file_paths) : [],
      new_folder_documents: row.new_folder_documents ? JSON.parse(row.new_folder_documents) : [],
    }));

    res.json({ success: true, documents });
  } catch (err) {
    sendError(res, 500, `Fetch failed: ${err.message}`);
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
  const charityFiles = req.files?.charityFiles || [];
  const newFolderDocs = req.files?.newFolderDocuments || [];
  const userId = req.session.userId;

  if (!charity_name) {
    return sendError(res, 400, "Charity name is required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_paths, new_folder_documents FROM user_charity_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );

    if (!existing.length) return sendError(res, 404, "Charity document not found.");

    let existingFilePaths = existing[0].file_paths ? JSON.parse(existing[0].file_paths) : [];
    let existingNewFolderDocs = existing[0].new_folder_documents ? JSON.parse(existing[0].new_folder_documents) : [];

    // Replace old charity files if new uploaded
    if (charityFiles.length > 0) {
      for (const filePath of existingFilePaths) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old charity file:", err.message);
        }
      }
      existingFilePaths = charityFiles.map(file => `/images/${userId}/documents/personalid/${file.filename}`);
    }

    // Replace old new_folder_documents if new uploaded
    if (newFolderDocs.length > 0) {
      for (const filePath of existingNewFolderDocs) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old new folder file:", err.message);
        }
      }
      existingNewFolderDocs = newFolderDocs.map(file => `/images/${userId}/documents/newfolder/${file.filename}`);
    }

    await pool.query(
      `UPDATE user_charity_documents
       SET charity_name = ?, charity_website = ?, payment_method = ?, amount = ?,
           frequency = ?, enrolled = ?, nominee_contact = ?, file_paths = ?, new_folder_documents = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        charity_name,
        charity_website || null,
        payment_method || null,
        amount || 0,
        frequency || null,
        enrolled === "true",
        nomineeContact || null,
        JSON.stringify(existingFilePaths),
        JSON.stringify(existingNewFolderDocs),
        notes || null,
        req.params.id,
        userId,
      ]
    );

    res.json({ success: true, message: "Charity details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE
router.delete("/charity/:id", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT file_paths, new_folder_documents FROM user_charity_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.userId]
    );

    if (!rows.length) return sendError(res, 404, "Charity document not found.");

    const filePaths = rows[0].file_paths ? JSON.parse(rows[0].file_paths) : [];
    const newFolderPaths = rows[0].new_folder_documents ? JSON.parse(rows[0].new_folder_documents) : [];

    await pool.query(
      `DELETE FROM user_charity_documents WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.userId]
    );

    // Delete files from both arrays
    for (const filePath of [...filePaths, ...newFolderPaths]) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Charity details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;