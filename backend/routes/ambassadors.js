const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const upload = require("../utils/fileUpload");
const { checkTableExists, createUserContactsTable } = require("../database/schema");
const { transporter } = require("../config/email");

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

router.post("/", checkAuth, async (req, res) => {
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
      const [result] = await connection.query(
        `INSERT INTO ambassadors (user_id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, category, relationship, ambassador_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            is_ambassador = ? 
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
            existingContact[0].id,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO ${tableName} (user_id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, email, category, relation, is_ambassador)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          ]
        );
      }

      await connection.commit();
      connection.release();

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
        created_at: new Date(),
      };

      res.json({ success: true, ambassador });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
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
      `SELECT id, ambassador_type FROM ambassadors WHERE id = ? AND user_id = ?`,
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
      let imagePath = null;
      if (profileImage) {
        imagePath = `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`;
        await connection.query(
          `UPDATE ambassadors SET profile_image = ? WHERE id = ? AND user_id = ?`,
          [imagePath, id, req.session.userId]
        );
      }

      await connection.query(
        `UPDATE ambassadors 
         SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, relationship = ?, ambassador_type = ?, category = ?
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
          id,
          req.session.userId,
        ]
      );

      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);

      const [existingContact] = await connection.query(
        `SELECT id FROM ${tableName} 
         WHERE user_id = ? AND (first_name = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [req.session.userId, firstName, phoneNumbers, phoneNumbers, phoneNumbers]
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
            imagePath || null,
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
          contact_image: imagePath || null,
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
            imagePath || null,
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
          contact_image: imagePath || null,
        };
      }

      await connection.commit();
      connection.release();

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
        profile_image: imagePath || null,
      };

      res.json({ success: true, ambassador, contact });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
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
      "SELECT email, phone_number, phone_number1, phone_number2 FROM ambassadors WHERE id = ? AND user_id = ?",
      [parsedAmbassadorId, userId]
    );

    if (!ambassadors.length) {
      return res.status(404).json({
        success: false,
        message: "Ambassador not found.",
      });
    }

    const { email, phone_number, phone_number1, phone_number2 } = ambassadors[0];
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
        connection.release();
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
      connection.release();

      return res.json({
        success: true,
        message: "Ambassador removed successfully.",
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error removing ambassador:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

router.post("/upload-image", checkAuth, upload, async (req, res) => {
  const { ambassadorId } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  if (!ambassadorId) {
    return res.status(400).json({ success: false, message: "Ambassador ID is required." });
  }

  if (!profileImage) {
    return res.status(400).json({ success: false, message: "No profile image uploaded." });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [ambassadors] = await pool.query(
      "SELECT id, email, phone_number, phone_number1, phone_number2 FROM ambassadors WHERE id = ? AND user_id = ?",
      [ambassadorId, req.session.userId]
    );
    if (ambassadors.length === 0) {
      return res.status(404).json({ success: false, message: "Ambassador not found." });
    }

    const { email, phone_number, phone_number1, phone_number2 } = ambassadors[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);

    const imagePath = `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `UPDATE ambassadors SET profile_image = ? WHERE id = ? AND user_id = ?`,
        [imagePath, ambassadorId, req.session.userId]
      );

      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);

      const [existingContact] = await connection.query(
        `SELECT id FROM ${tableName} 
         WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      if (existingContact.length > 0) {
        await connection.query(
          `UPDATE ${tableName} SET contact_image = ? WHERE id = ?`,
          [imagePath, existingContact[0].id]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Ambassador image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error uploading ambassador image:", err);
    res.status(500).json({ success: false, message: "Server error." });
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