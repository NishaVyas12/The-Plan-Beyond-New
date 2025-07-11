const express = require("express");
const router = express.Router();
const { pool } = require("../../config/database");
const { upload } = require("../../middleware/multer");
const { checkAuth } = require("../../middleware/auth");
const path = require("path");
const fs = require("fs/promises");

const sendError = (res, status, message) => {
  console.error(message);
  res.status(status).json({ success: false, message });
};

const uniqueDocumentTypes = [
  "Aadhaar Card",
  "Voter ID",
  "Passport",
  "PAN Card",
  "Driver’s License",
];

router.post("/ids", checkAuth, upload, async (req, res) => {
  const {
    document_type,
    document_number,
    expirationDate,
    stateIssued,
    countryIssued,
    location,
    notes,
  } = req.body;

  const personalIdFiles = req.files?.personalIdFiles;

  if (!document_type || !document_number) {
    return sendError(res, 400, "Type and Number are required.");
  }

  try {
    if (uniqueDocumentTypes.includes(document_type)) {
      const [existing] = await pool.query(
        `SELECT id FROM user_ids_documents WHERE user_id = ? AND document_type = ?`,
        [req.session.userId, document_type]
      );
      if (existing.length > 0) {
        return sendError(res, 400, `${document_type} can only be uploaded once.`);
      }
    }

    const filePaths = personalIdFiles
      ? personalIdFiles.map(
          (file) =>
            `/images/${req.session.userId}/documents/personalid/${file.filename}`
        )
      : [];

    const parsedExpirationDate = expirationDate
      ? new Date(expirationDate).toISOString().split("T")[0]
      : null;

    const [result] = await pool.query(
      `INSERT INTO user_ids_documents (
          user_id, document_type, document_number, expiration_date, state_issued, country_issued,
          location, notes, file_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        document_type,
        document_number,
        parsedExpirationDate,
        stateIssued || null,
        countryIssued || null,
        location || null,
        notes || null,
        JSON.stringify(filePaths), // Store file paths as JSON array
      ]
    );

    res.json({
      success: true,
      documents: [{
        id: result.insertId,
        document_type,
        document_number,
        expiration_date: parsedExpirationDate,
        state_issued: stateIssued,
        country_issued: countryIssued,
        location,
        notes,
        file_path: filePaths,
      }],
    });
  } catch (err) {
    sendError(res, 500, `Error creating ID document: ${err.message}`);
  }
});

router.get("/ids", checkAuth, async (req, res) => {
  try {
    const [docs] = await pool.query(
      `SELECT * FROM user_ids_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const formattedDocs = docs.map((doc) => ({
      ...doc,
      file_path: doc.file_path ? JSON.parse(doc.file_path) : [], // Parse JSON string to array
      expiration_date: doc.expiration_date || null,
      created_at: doc.created_at
        ? new Date(doc.created_at).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null,
    }));

    res.json({ success: true, documents: formattedDocs });
  } catch (err) {
    sendError(res, 500, `Error fetching ID documents: ${err.message}`);
  }
});

router.put("/ids/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    document_type,
    document_number,
    expirationDate,
    stateIssued,
    countryIssued,
    location,
    notes,
    removeFile,
  } = req.body;
  const personalIdFiles = req.files?.personalIdFiles;

  if (!document_type || !document_number) {
    return sendError(res, 400, "Type and Number are required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_path, document_type FROM user_ids_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!existing.length) return sendError(res, 404, "Document not found.");

    if (
      uniqueDocumentTypes.includes(document_type) &&
      document_type !== existing[0].document_type
    ) {
      const [duplicate] = await pool.query(
        `SELECT id FROM user_ids_documents WHERE user_id = ? AND document_type = ? AND id != ?`,
        [req.session.userId, document_type, id]
      );
      if (duplicate.length > 0) {
        return sendError(res, 400, `${document_type} can only be uploaded once.`);
      }
    }

    let filePaths = existing[0].file_path ? JSON.parse(existing[0].file_path) : [];

    if (removeFile === "true") {
      // Delete all existing files
      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          const oldPath = path.join(__dirname, "..", filePath);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.warn(`Error deleting old file: ${err.message}`);
          }
        }
      }
      filePaths = [];
    } else if (personalIdFiles && personalIdFiles.length > 0) {
      // Delete old files if new files are uploaded
      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          const oldPath = path.join(__dirname, "..", filePath);
          try {
            await fs.unlink(oldPath);
          } catch (err) {
            console.warn(`Error deleting old file: ${err.message}`);
          }
        }
      }
      // Add new file paths
      filePaths = personalIdFiles.map(
        (file) =>
          `/images/${req.session.userId}/documents/personalid/${file.filename}`
      );
    }

    const parsedExpirationDate = expirationDate
      ? new Date(expirationDate).toISOString().split("T")[0]
      : null;

    await pool.query(
      `UPDATE user_ids_documents SET
          document_type = ?, document_number = ?, expiration_date = ?, state_issued = ?, country_issued = ?,
          location = ?, notes = ?, file_path = ?
      WHERE id = ? AND user_id = ?`,
      [
        document_type,
        document_number,
        parsedExpirationDate,
        stateIssued || null,
        countryIssued || null,
        location || null,
        notes || null,
        JSON.stringify(filePaths), // Store file paths as JSON array
        id,
        req.session.userId,
      ]
    );

    res.json({
      success: true,
      document: {
        id,
        document_type,
        document_number,
        expiration_date: parsedExpirationDate,
        state_issued: stateIssued,
        country_issued: countryIssued,
        location,
        notes,
        file_path: filePaths,
      },
    });
  } catch (err) {
    sendError(res, 500, `Error updating document: ${err.message}`);
  }
});

router.delete("/ids/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT file_path FROM user_ids_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!rows.length) return sendError(res, 404, "Document not found.");

    const filePaths = rows[0].file_path ? JSON.parse(rows[0].file_path) : [];

    await pool.query(
      `DELETE FROM user_ids_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (filePaths.length > 0) {
      for (const filePath of filePaths) {
        const absolutePath = path.join(__dirname, "..", filePath);
        try {
          await fs.unlink(absolutePath);
        } catch (err) {
          console.warn(`File delete failed: ${err.message}`);
        }
      }
    }

    res.json({ success: true, message: "Document deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Error deleting document: ${err.message}`);
  }
});

module.exports = router;