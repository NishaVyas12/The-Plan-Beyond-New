const express = require("express");
const { pool } = require("../config/database");
const { checkAuth } = require("../middleware/auth");
const { upload } = require("../middleware/multer");
const router = express.Router();

// CREATE Pet
router.post("/pets", checkAuth, upload, async (req, res) => {
    const userId = req.session.userId;
    const { name, type, breed, birthday } = req.body;
    const photo = req.file ? `/images/${req.file.filename}` : null;

    if (!name) {
        return res.status(400).json({ success: false, message: "Pet name is required." });
    }

    try {
        await pool.query(
            `INSERT INTO pets (user_id, name, type, breed, birthday, photo)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name, type, breed, birthday, photo]
        );
        res.json({ success: true, message: "Pet added successfully." });
    } catch (err) {
        console.error("Error adding pet:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// GET Single Pet by ID
router.get("/pets/:id", checkAuth, async (req, res) => {
    const userId = req.session.userId;
    const petId = req.params.id;

    try {
        const [pet] = await pool.query(
            "SELECT * FROM pets WHERE id = ? AND user_id = ?",
            [petId, userId]
        );

        if (pet.length === 0) {
            return res.status(404).json({ success: false, message: "Pet not found." });
        }

        res.json({ success: true, pet: pet[0] });
    } catch (err) {
        console.error("Error fetching pet:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// READ All Pets for User
router.get("/pets", checkAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        const [pets] = await pool.query(
            "SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        res.json({ success: true, pets });
    } catch (err) {
        console.error("Error fetching pets:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// UPDATE Pet
router.put("/pets/:id", checkAuth, upload, async (req, res) => {
    const userId = req.session.userId;
    const petId = req.params.id;
    const { name, type, breed, birthday } = req.body;
    const photo = req.file ? `/images/${req.file.filename}` : null;

    try {
        const [existing] = await pool.query(
            "SELECT id FROM pets WHERE id = ? AND user_id = ?",
            [petId, userId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Pet not found." });
        }

        await pool.query(
            `UPDATE pets SET name = ?, type = ?, breed = ?, birthday = ?, photo = COALESCE(?, photo)
       WHERE id = ? AND user_id = ?`,
            [name, type, breed, birthday, photo, petId, userId]
        );
        res.json({ success: true, message: "Pet updated successfully." });
    } catch (err) {
        console.error("Error updating pet:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// DELETE Pet
router.delete("/pets/:id", checkAuth, async (req, res) => {
    const userId = req.session.userId;
    const petId = req.params.id;

    try {
        const [existing] = await pool.query(
            "SELECT id FROM pets WHERE id = ? AND user_id = ?",
            [petId, userId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Pet not found." });
        }

        await pool.query("DELETE FROM pets WHERE id = ? AND user_id = ?", [petId, userId]);
        res.json({ success: true, message: "Pet deleted successfully." });
    } catch (err) {
        console.error("Error deleting pet:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;
