const express = require("express");
const { pool } = require("../config/database");
const { checkAuth } = require("../middleware/auth");
const { profileImageUpload } = require("../middleware/multer"); 
const path = require("path");
const fs = require("fs");
const router = express.Router();


router.use("/images", express.static(path.join(__dirname, "../images")));

router.get("/user", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [req.session.userId]
    );
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const user = users[0];
    res.json({
      success: true,
      email: user.email,
    });
  } catch (err) {
    console.error("Error retrieving user:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/check-session", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [req.session.userId]
    );
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const user = users[0];
    res.json({ success: true, userId: user.id, email: user.email });
  } catch (err) {
    console.error("Error checking session:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/get-profile", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const [profiles] = await pool.query(
      `SELECT first_name, middle_name, last_name, email, phone_number, phone_verified,
              DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth, 
              gender, address_line_1, address_line_2, city, state, zip_code, country, profile_image
       FROM profile WHERE user_id = ?`,
      [req.session.userId]
    );

    if (profiles.length === 0) {
      return res.json({ success: true, profile: {} });
    }

    res.json({ success: true, profile: profiles[0] });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/update-profile", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  const {
    first_name,
    middle_name,
    last_name,
    email,
    phone_number,
    date_of_birth,
    gender,
    address_line_1,
    address_line_2,
    city,
    state,
    zip_code,
    country,
  } = req.body;

  try {
    // Ensure the user exists
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Update profile
    await pool.query(
      `INSERT INTO profile (
        user_id, first_name, middle_name, last_name, email, phone_number,
        date_of_birth, gender, address_line_1, address_line_2, city, state, zip_code, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        middle_name = VALUES(middle_name),
        last_name = VALUES(last_name),
        email = VALUES(email),
        phone_number = VALUES(phone_number),
        date_of_birth = VALUES(date_of_birth),
        gender = VALUES(gender),
        address_line_1 = VALUES(address_line_1),
        address_line_2 = VALUES(address_line_2),
        city = VALUES(city),
        state = VALUES(state),
        zip_code = VALUES(zip_code),
        country = VALUES(country)`,
      [
        userId,
        first_name || null,
        middle_name || null,
        last_name || null,
        email || null,
        phone_number || null,
        date_of_birth || null,
        gender || null,
        address_line_1 || null,
        address_line_2 || null,
        city || null,
        state || null,
        zip_code || null,
        country || null,
      ]
    );

    res.json({ success: true, message: "User profile updated successfully." });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/upload-image", checkAuth, profileImageUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No profile image uploaded." });
  }

  try {
    const userId = req.session.userId;
    const imagePath = `/images/${req.file.filename}`; // e.g., /images/10.png
    const fullPath = path.join(__dirname, "../images", req.file.filename); // Absolute path to file

    // Log the file path for debugging
    console.log("Profile image saved at:", fullPath);
    console.log("File exists:", fs.existsSync(fullPath));

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `INSERT INTO profile (user_id, profile_image) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE profile_image = ?`,
        [userId, imagePath, imagePath]
      );

      await connection.commit();
      res.json({
        success: true,
        message: "User profile image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error uploading user image:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/popup/submit", checkAuth, async (req, res) => {
  const { responses } = req.body;
  const userId = req.session.userId;

  if (!responses || typeof responses !== "object") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing responses data." });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (responses.personalInfo) {
      const { fullName, gender, dateOfBirth, country } = responses.personalInfo;

      let first_name = fullName;
      let last_name = null;
      if (fullName && fullName.includes(" ")) {
        const nameParts = fullName.split(" ");
        first_name = nameParts[0];
        last_name = nameParts.slice(1).join(" ");
      }

      await pool.query(
        `INSERT INTO profile (
          user_id, first_name, last_name, gender, date_of_birth, country
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          first_name = VALUES(first_name),
          last_name = VALUES(last_name),
          gender = VALUES(gender),
          date_of_birth = VALUES(date_of_birth),
          country = VALUES(country)`,
        [
          userId,
          first_name || null,
          last_name || null,
          gender || null,
          dateOfBirth || null,
          country || null,
        ]
      );
    }

    const responsesJson = JSON.stringify(responses);

    await pool.query(
      `
      INSERT INTO user_popup_responses (user_id, responses) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE responses = ?
      `,
      [userId, responsesJson, responsesJson]
    );

    res.json({ success: true, message: "User responses saved successfully." });
  } catch (err) {
    console.error("Error saving popup responses:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.get("/popup/status", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [responses] = await pool.query(
      "SELECT id FROM user_popup_responses WHERE user_id = ?",
      [userId]
    );

    res.json({
      success: true,
      hasResponses: responses.length > 0,
    });
  } catch (err) {
    console.error("Error checking popup status:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

module.exports = router;