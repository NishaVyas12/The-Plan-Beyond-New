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

// CREATE
router.post("/employment", checkAuth, upload, async (req, res) => {
  const {
    type, organisation, joiningDate, leavingDate, supervisorContact,
    nomineeContact, employmentType, jobTitle, employmentId,
    benefitsType, benefitsDetails, otherStatus, notes
  } = req.body;
  const employmentFiles = req.files?.employmentFiles;

  if (!type) {
    return sendError(res, 400, "Employment status is required.");
  }

  try {
    // Handle multiple file uploads
    const filePath = employmentFiles
      ? employmentFiles.map(file => `/images/${req.session.userId}/documents/personalid/${file.filename}`)
      : [];

    // Insert a record with file path as JSON string
    const [result] = await pool.query(
      `INSERT INTO user_employment_documents (
        user_id, type, organisation, joining_date, leaving_date, supervisor_contact,
        nominee_contact, employment_type, job_title, employment_id,
        benefits_type, benefits_details, other_status, file_path, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId, type, organisation || null, joiningDate || null, leavingDate || null,
        supervisorContact || null, nomineeContact || null, employmentType || null,
        jobTitle || null, employmentId || null, benefitsType || null,
        benefitsDetails || null, otherStatus || null, JSON.stringify(filePath), notes || null
      ]
    );

    res.json({
      success: true,
      documentId: result.insertId,
      message: "Employment details saved successfully!",
      documents: [{
        id: result.insertId,
        type, organisation, joining_date: joiningDate, leaving_date: leavingDate,
        supervisor_contact: supervisorContact, nominee_contact: nomineeContact,
        employment_type: employmentType, job_title: jobTitle, employment_id: employmentId,
        benefits_type: benefitsType, benefits_details: benefitsDetails, other_status: otherStatus,
        file_path: filePath, notes
      }]
    });
  } catch (err) {
    sendError(res, 500, `Insert failed: ${err.message}`);
  }
});

// READ
router.get("/employment", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, organisation, joining_date, leaving_date, supervisor_contact,
       nominee_contact, employment_type, job_title, employment_id,
       benefits_type, benefits_details, other_status,
       JSON_UNQUOTE(file_path) AS file_path, notes,
       created_at, updated_at
       FROM user_employment_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );

    // Parse file_path JSON string to array
    const documents = rows.map(row => ({
      ...row,
      file_path: row.file_path ? JSON.parse(row.file_path) : []
    }));

    res.json({ success: true, documents });
  } catch (err) {
    sendError(res, 500, `Fetch failed: ${err.message}`);
  }
});

// UPDATE
router.put("/employment/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    type, organisation, joiningDate, leavingDate, supervisorContact,
    nomineeContact, employmentType, jobTitle, employmentId,
    benefitsType, benefitsDetails, otherStatus, notes
  } = req.body;
  const employmentFiles = req.files?.employmentFiles;

  if (!type) {
    return sendError(res, 400, "Employment status is required.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT file_path FROM user_employment_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!existing.length) return sendError(res, 404, "Document not found.");

    // Parse existing file path
    let existingFilePath = existing[0].file_path ? JSON.parse(existing[0].file_path) : [];

    // Delete old files if new ones are uploaded
    if (employmentFiles && employmentFiles.length > 0) {
      for (const filePath of existingFilePath) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      existingFilePath = employmentFiles.map(file => `/images/${req.session.userId}/documents/personalid/${file.filename}`);
    }

    await pool.query(
      `UPDATE user_employment_documents SET
        type = ?, organisation = ?, joining_date = ?, leaving_date = ?, supervisor_contact = ?,
        nominee_contact = ?, employment_type = ?, job_title = ?, employment_id = ?,
        benefits_type = ?, benefits_details = ?, other_status = ?, file_path = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        type, organisation || null, joiningDate || null, leavingDate || null,
        supervisorContact || null, nomineeContact || null, employmentType || null,
        jobTitle || null, employmentId || null, benefitsType || null,
        benefitsDetails || null, otherStatus || null, JSON.stringify(existingFilePath), notes || null,
        id, req.session.userId
      ]
    );

    res.json({ success: true, message: "Employment details updated successfully." });
  } catch (err) {
    sendError(res, 500, `Update failed: ${err.message}`);
  }
});

// DELETE
router.delete("/employment/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT file_path FROM user_employment_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (!rows.length) return sendError(res, 404, "Document not found.");

    const filePath = rows[0].file_path ? JSON.parse(rows[0].file_path) : [];

    await pool.query(
      `DELETE FROM user_employment_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    for (const file of filePath) {
      try {
        await fs.unlink(path.join(__dirname, "..", file));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Employment details deleted successfully." });
  } catch (err) {
    sendError(res, 500, `Delete failed: ${err.message}`);
  }
});

module.exports = router;