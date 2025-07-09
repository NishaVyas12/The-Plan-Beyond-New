const express = require("express");
const router = express.Router();
const { pool } = require("../../config/database");
const { upload } = require("../../middleware/multer");
const { checkAuth } = require("../../middleware/auth");
const path = require("path");
const fs = require("fs/promises");

// CREATE
router.post("/employment", checkAuth, upload, async (req, res) => {
  const {
    type, organisation, joiningDate, leavingDate, supervisorContact,
    nomineeContact, employmentType, jobTitle, employmentId,
    benefitsType, benefitsDetails, otherStatus, notes
  } = req.body;
  const documentFile = req.files?.document?.[0];
  const filePath = documentFile ? `/images/${req.session.userId}/${documentFile.filename}` : null;

  try {
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
        benefitsDetails || null, otherStatus || null, filePath, notes || null
      ]
    );

    res.json({ success: true, documentId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: "Insert failed", error: err.message });
  }
});

// READ
router.get("/employment", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM user_employment_documents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );
    res.json({ success: true, documents: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Fetch failed", error: err.message });
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
  const documentFile = req.files?.document?.[0];

  try {
    const [existing] = await pool.query(
      `SELECT file_path FROM user_employment_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!existing.length) return res.status(404).json({ success: false, message: "Not found" });

    let filePath = existing[0].file_path;
    if (documentFile) {
      if (filePath) {
        try {
          await fs.unlink(path.join(__dirname, "..", filePath));
        } catch (err) {
          console.warn("Failed to delete old file:", err.message);
        }
      }
      filePath = `/images/${req.session.userId}/${documentFile.filename}`;
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
        benefitsDetails || null, otherStatus || null, filePath, notes || null,
        id, req.session.userId
      ]
    );

    res.json({ success: true, message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed", error: err.message });
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
    if (!rows.length) return res.status(404).json({ success: false, message: "Not found" });

    const filePath = rows[0].file_path;

    await pool.query(
      `DELETE FROM user_employment_documents WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (filePath) {
      try {
        await fs.unlink(path.join(__dirname, "..", filePath));
      } catch (err) {
        console.warn("Failed to delete file:", err.message);
      }
    }

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
});

module.exports = router;