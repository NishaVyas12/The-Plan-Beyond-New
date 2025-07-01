const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { upload } = require("../middleware/multer");
const { checkTableExists, createUserContactsTable } = require("../database/schema");
const { transporter } = require("../config/email");
const path = require("path");
const fs = require("fs").promises;

const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: "Session timed out, login again." });
  }
  next();
};

router.get("/", checkAuth, async (req, res) => {
  try {
    const [ambassadors] = await pool.query(
      `SELECT id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, category, relationship AS relation, ambassador_type, profile_image, created_at
       FROM ambassadors WHERE user_id = ?`,
      [req.session.userId]
    );
    res.json({ success: true, ambassadors });
  } catch (err) {
    console.error("Error fetching ambassadors:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.post("/", checkAuth, upload, async (req, res) => {
  const {
    firstName,
    middleName = "",
    lastName = "",
    email,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation = "",
    ambassadorType,
    category = "",
  } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  if (!firstName || !email || !phone_number || !ambassadorType || !category) {
    return res.status(400).json({
      success: false,
      message: "First name, email, primary phone number, ambassador type, and category are required.",
    });
  }

  if (!["Primary", "Secondary", ""].includes(ambassadorType)) {
    return res.status(400).json({ success: false, message: "Invalid ambassador type." });
  }

  if (category === "Family" && !relation) {
    return res.status(400).json({
      success: false,
      message: "Relation is required for Family category.",
    });
  }

  try {
    const [existingAmbassador] = await pool.query(
      `SELECT id FROM ambassadors WHERE user_id = ? AND ambassador_type = ?`,
      [req.session.userId, ambassadorType]
    );
    if (existingAmbassador.length > 0 && ambassadorType !== "") {
      return res.status(400).json({
        success: false,
        message: `A ${ambassadorType} ambassador already exists. Only one ${ambassadorType} ambassador is allowed.`,
      });
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);
    const [existing] = await pool.query(
      `SELECT id FROM ambassadors WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ambassador with this email or phone number already exists.",
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let imagePath = null;
      if (profileImage) {
        imagePath = `/images/${req.session.userId}/${profileImage.filename}`;
        if (imagePath.length > 255) {
          throw new Error("Profile image path exceeds 255 characters");
        }
      } else {
        // Check if there's a contact with matching email or phone numbers and use its contact_image
        const tableName = `contacts_user_${req.session.userId}`;
        await createUserContactsTable(req.session.userId);
        const [existingContact] = await connection.query(
          `SELECT contact_image FROM ${tableName} 
           WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
          [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
        );
        if (existingContact.length > 0 && existingContact[0].contact_image) {
          imagePath = existingContact[0].contact_image;
        }
      }

      const [result] = await connection.query(
        `INSERT INTO ambassadors (user_id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, category, relationship, ambassador_type, profile_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          firstName,
          middleName,
          lastName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          category,
          relation,
          ambassadorType,
          imagePath,
        ]
      );

      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);

      const [existingContact] = await connection.query(
        `SELECT id FROM ${tableName} WHERE user_id = ? AND (first_name = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [req.session.userId, firstName, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      if (existingContact.length > 0) {
        await connection.query(
          `UPDATE ${tableName} SET 
            first_name = ?, 
            middle_name = ?,
            last_name = ?,
            email = ?, 
            phone_number = ?, 
            phone_number1 = ?, 
            phone_number2 = ?, 
            category = ?, 
            relation = ?, 
            is_ambassador = ?,
            contact_image = ?
           WHERE id = ?`,
          [
            firstName,
            middleName,
            lastName,
            email,
            phone_number,
            phone_number1,
            phone_number2,
            category,
            relation,
            1,
            imagePath,
            existingContact[0].id,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO ${tableName} (user_id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, email, category, relation, is_ambassador, contact_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            firstName,
            middleName,
            lastName,
            phone_number,
            phone_number1,
            phone_number2,
            email,
            category,
            relation,
            1,
            imagePath,
          ]
        );
      }

      await connection.commit();

      const ambassador = {
        id: result.insertId,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        category,
        relation,
        ambassador_type: ambassadorType,
        profile_image: imagePath,
        created_at: new Date(),
      };

      res.json({ success: true, ambassador });
    } catch (err) {
      await connection.rollback();
      if (profileImage) {
        const profileImagePath = path.join(__dirname, "..", `/images/${req.session.userId}/${profileImage.filename}`);
        try {
          await fs.unlink(profileImagePath);
          console.log(`Deleted profile image: ${profileImagePath}`);
        } catch (unlinkErr) {
          console.error(`Error cleaning up profile image ${profileImagePath}:`, unlinkErr);
        }
      }
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error adding ambassador:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.put("/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    middleName = "",
    lastName = "",
    email,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation = "",
    ambassadorType,
    category = "",
  } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  if (!firstName || !email || !phone_number || !ambassadorType || !category) {
    return res.status(400).json({
      success: false,
      message: "First name, email, primary phone number, ambassador type, and category are required.",
    });
  }

  if (!["Primary", "Secondary", ""].includes(ambassadorType)) {
    return res.status(400).json({ success: false, message: "Invalid ambassador type." });
  }

  if (category === "Family" && !relation) {
    return res.status(400).json({
      success: false,
      message: "Relation is required for Family category.",
    });
  }

  try {
    const [existing] = await pool.query(
      `SELECT id, ambassador_type, profile_image FROM ambassadors WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Ambassador not found." });
    }

    if (ambassadorType !== existing[0].ambassador_type && ambassadorType !== "") {
      const [existingAmbassador] = await pool.query(
        `SELECT id FROM ambassadors WHERE user_id = ? AND ambassador_type = ?`,
        [req.session.userId, ambassadorType]
      );
      if (existingAmbassador.length > 0) {
        return res.status(400).json({
          success: false,
          message: `A ${ambassadorType} ambassador already exists. Only one ${ambassadorType} ambassador is allowed.`,
        });
      }
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);
    const [conflict] = await pool.query(
      `SELECT id FROM ambassadors 
       WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND id != ?`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers, id]
    );
    if (conflict.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Another ambassador with this email or phone number already exists.",
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let imagePath = existing[0].profile_image;
      if (profileImage) {
        // Delete existing profile image if it exists
        if (existing[0].profile_image) {
          const oldImagePath = path.join(__dirname, "..", existing[0].profile_image);
          try {
            await fs.unlink(oldImagePath);
            console.log(`Deleted old profile image: ${oldImagePath}`);
          } catch (unlinkErr) {
            console.error(`Error deleting old profile image ${oldImagePath}:`, unlinkErr);
          }
        }
        imagePath = `/images/${req.session.userId}/${profileImage.filename}`;
        if (imagePath.length > 255) {
          throw new Error("Profile image path exceeds 255 characters");
        }
      } else if (!imagePath) {
        // Check if there's a contact with matching email or phone numbers and use its contact_image
        const tableName = `contacts_user_${req.session.userId}`;
        await createUserContactsTable(req.session.userId);
        const [existingContact] = await connection.query(
          `SELECT contact_image FROM ${tableName} 
           WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
          [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
        );
        if (existingContact.length > 0 && existingContact[0].contact_image) {
          imagePath = existingContact[0].contact_image;
        }
      }

      await connection.query(
        `UPDATE ambassadors 
         SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, relationship = ?, ambassador_type = ?, category = ?, profile_image = ?
         WHERE id = ? AND user_id = ?`,
        [
          firstName,
          middleName,
          lastName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          relation,
          ambassadorType,
          category,
          imagePath,
          id,
          req.session.userId,
        ]
      );

      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);

      const [existingContact] = await connection.query(
        `SELECT id FROM ${tableName} 
         WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      let contact;

      if (existingContact.length > 0) {
        await connection.query(
          `UPDATE ${tableName} SET 
           first_name = ?, 
           middle_name = ?,
           last_name = ?,
           email = ?, 
           phone_number = ?, 
           phone_number1 = ?, 
           phone_number2 = ?, 
           category = ?, 
           relation = ?, 
           is_ambassador = ?,
           contact_image = ?
           WHERE id = ?`,
          [
            firstName,
            middleName,
            lastName,
            email,
            phone_number,
            phone_number1,
            phone_number2,
            category,
            relation,
            1,
            imagePath,
            existingContact[0].id,
          ]
        );
        contact = {
          id: existingContact[0].id,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          category,
          relation,
          is_ambassador: 1,
          contact_image: imagePath,
        };
      } else {
        const [insertResult] = await connection.query(
          `INSERT INTO ${tableName} 
           (user_id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, email, category, relation, is_ambassador, contact_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            firstName,
            middleName,
            lastName,
            phone_number,
            phone_number1,
            phone_number2,
            email,
            category,
            relation,
            1,
            imagePath,
          ]
        );
        contact = {
          id: insertResult.insertId,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          category,
          relation,
          is_ambassador: 1,
          contact_image: imagePath,
        };
      }

      // Update nominee profile_image if a nominee exists with matching phone number
      const [existingNominee] = await connection.query(
        `SELECT id FROM nominees 
         WHERE user_id = ? AND (phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [req.session.userId, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      if (existingNominee.length > 0) {
        await connection.query(
          `UPDATE nominees SET profile_image = ? 
           WHERE id = ? AND user_id = ?`,
          [imagePath, existingNominee[0].id, req.session.userId]
        );
      }

      await connection.commit();

      const ambassador = {
        id,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        relation,
        ambassador_type: ambassadorType,
        category,
        profile_image: imagePath,
      };

      res.json({ success: true, ambassador, contact });
    } catch (err) {
      await connection.rollback();
      if (profileImage) {
        const profileImagePath = path.join(__dirname, "..", `/images/${req.session.userId}/${profileImage.filename}`);
        try {
          await fs.unlink(profileImagePath);
          console.log(`Deleted profile image: ${profileImagePath}`);
        } catch (unlinkErr) {
          console.error(`Error cleaning up profile image ${profileImagePath}:`, unlinkErr);
        }
      }
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error updating ambassador:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({
      success: false,
      message: "Valid Ambassador ID is required.",
    });
  }

  const parsedAmbassadorId = parseInt(id, 10);

  try {
    const [ambassadors] = await pool.query(
      "SELECT email, phone_number, phone_number1, phone_number2, profile_image FROM ambassadors WHERE id = ? AND user_id = ?",
      [parsedAmbassadorId, userId]
    );

    if (!ambassadors.length) {
      return res.status(404).json({
        success: false,
        message: "Ambassador not found.",
      });
    }

    const { email, phone_number, phone_number1, phone_number2, profile_image } = ambassadors[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [users] = await connection.query(
        "SELECT id, is_verified FROM users WHERE email = ? AND ambassador_id = ? AND ambassador_user_id = ?",
        [email, parsedAmbassadorId, userId]
      );

      if (users.length > 0) {
        const user = users[0];
        if (user.is_verified === 0) {
          await connection.query(
            "DELETE FROM users WHERE id = ? AND ambassador_id = ? AND ambassador_user_id = ?",
            [user.id, parsedAmbassadorId, userId]
          );
        } else {
          await connection.query(
            "UPDATE users SET ambassador_id = NULL, ambassador_user_id = NULL, ambassador_accept = NULL WHERE id = ? AND ambassador_id = ? AND ambassador_user_id = ?",
            [user.id, parsedAmbassadorId, userId]
          );
        }
      }

      const [ambassadorResult] = await connection.query(
        "DELETE FROM ambassadors WHERE id = ? AND user_id = ?",
        [parsedAmbassadorId, userId]
      );

      if (ambassadorResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Ambassador not found.",
        });
      }

      const tableName = `contacts_user_${userId}`;
      await createUserContactsTable(userId);

      await connection.query(
        `UPDATE ${tableName} SET is_ambassador = 0 
         WHERE (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND is_ambassador = 1`,
        [email, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      await connection.commit();
      return res.json({
        success: true,
        message: "Ambassador removed successfully.",
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error removing ambassador:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

router.post("/send-invite", checkAuth, async (req, res) => {
  const { ambassadorId } = req.body;

  if (!ambassadorId) {
    return res.status(400).json({ success: false, message: "Ambassador ID is required." });
  }

  try {
    const [ambassadors] = await pool.query(
      `SELECT id, email, first_name, ambassador_type FROM ambassadors WHERE id = ? AND user_id = ?`,
      [ambassadorId, req.session.userId]
    );

    if (ambassadors.length === 0) {
      return res.status(404).json({ success: false, message: "Ambassador not found." });
    }

    const ambassador = ambassadors[0];
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?ambassadorId=${ambassadorId}&userId=${req.session.userId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ambassador.email,
      subject: `Ambassador Invitation from Plan Beyond`,
      html: `
        <p>Hello ${ambassador.first_name},</p>
        <p>You have been invited to be an ${ambassador.ambassador_type} Ambassador.</p>
        <p>Please click the link below to accept the invitation:</p>
        <a href="${inviteLink}">Accept Invitation</a>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Invite sent to ${ambassador.first_name} (${ambassador.email})`,
    });
  } catch (err) {
    console.error("Error sending ambassador invite:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;