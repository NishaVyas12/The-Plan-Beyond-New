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

router.post("/ids", checkAuth, upload, async (req, res) => {
    const {
        document_type,
        document_number,
        expirationDate,
        stateIssued,
        countryIssued,
        location,
        notes
    } = req.body;

    const documentFile = req.files?.document?.[0];

    if (!document_type || !document_number) {
        return sendError(res, 400, "Type and Number are required.");
    }

    try {
        const filePath = documentFile
            ? `/images/${req.session.userId}/${documentFile.filename}`
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
                expirationDate || null,
                stateIssued || null,
                countryIssued || null,
                location || null,
                notes || null,
                filePath
            ]
        );

        res.json({
            success: true,
            document: {
                id: result.insertId,
                document_type,
                document_number,
                expiration_date: expirationDate,
                state_issued: stateIssued,
                country_issued: countryIssued,
                location,
                notes,
                file_path: filePath
            }
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
        res.json({ success: true, documents: docs });
    } catch (err) {
        sendError(res, 500, `Error fetching ID documents: ${err.message}`);
    }
});

router.put("/ids/:id", checkAuth, upload, async (req, res) => {
    const { id } = req.params;
    const {
        type,
        number,
        expirationDate,
        stateIssued,
        countryIssued,
        location,
        notes
    } = req.body;
    const documentFile = req.files?.document?.[0];

    if (!type || !number) {
        return sendError(res, 400, "Type and Number are required.");
    }

    try {
        const [existing] = await pool.query(
            `SELECT file_path FROM user_ids_documents WHERE id = ? AND user_id = ?`,
            [id, req.session.userId]
        );

        if (!existing.length) return sendError(res, 404, "Document not found.");

        let filePath = existing[0].file_path;

        // Replace old file if a new one is uploaded
        if (documentFile) {
            if (filePath) {
                const oldPath = path.join(__dirname, "..", filePath);
                try {
                    await fs.unlink(oldPath);
                } catch (err) {
                    console.error("Error deleting old file:", err.message);
                }
            }
            filePath = `/images/${req.session.userId}/${documentFile.filename}`;
        }

        await pool.query(
            `UPDATE user_ids_documents SET
        type = ?, number = ?, expiration_date = ?, state_issued = ?, country_issued = ?,
        location = ?, notes = ?, file_path = ?
       WHERE id = ? AND user_id = ?`,
            [
                type,
                number,
                expirationDate || null,
                stateIssued || null,
                countryIssued || null,
                location || null,
                notes || null,
                filePath,
                id,
                req.session.userId
            ]
        );

        res.json({ success: true, message: "Document updated successfully." });
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

        const filePath = rows[0].file_path;

        await pool.query(
            `DELETE FROM user_ids_documents WHERE id = ? AND user_id = ?`,
            [id, req.session.userId]
        );

        if (filePath) {
            const absolutePath = path.join(__dirname, "..", filePath);
            try {
                await fs.unlink(absolutePath);
            } catch (err) {
                console.warn(`File delete failed: ${err.message}`);
            }
        }

        res.json({ success: true, message: "Document deleted successfully." });
    } catch (err) {
        sendError(res, 500, `Error deleting document: ${err.message}`);
    }
});

module.exports = router;