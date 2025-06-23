const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const upload = require("../utils/fileUpload");
const { checkTableExists, createUserContactsTable } = require("../database/schema");
const nodemailer = require("nodemailer");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: "Session timed out, login again." });
  }
  next();
};

// Error handling utility
const sendError = (res, status, message) => {
  console.error(message);
  res.status(status).json({ success: false, message });
};

// GET /api/nominees - Fetch all nominees
router.get("/nominees", checkAuth, async (req, res) => {
  try {
    const [nominees] = await pool.query(
      `SELECT id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, 
              category, relationship AS relation, nominee_type, profile_image, created_at
       FROM nominees WHERE user_id = ?`,
      [req.session.userId]
    );
    res.json({ success: true, nominees });
  } catch (err) {
    sendError(res, 500, `Error fetching nominees: ${err.message}`);
  }
});

// POST /api/nominees - Add a new nominee
router.post("/nominees", checkAuth, upload, async (req, res) => {
  const {
    firstName,
    middleName = "",
    lastName = "",
    email,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation = "",
    nomineeType = "",
    category,
  } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  // Manual validation
  if (!firstName || !email || !phone_number || !category) {
    return sendError(res, 400, "First name, email, primary phone number, and category are required.");
  }
  if (!["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary", ""].includes(nomineeType)) {
    return sendError(res, 400, "Invalid nominee type.");
  }
  if (category === "Family" && !relation) {
    return sendError(res, 400, "Relation is required for Family category.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "Invalid email format.");
  }

  try {
    const [existingNominees] = await pool.query(
      `SELECT id, nominee_type FROM nominees WHERE user_id = ?`,
      [req.session.userId]
    );
    if (existingNominees.length >= 5) {
      return sendError(res, 400, "Maximum of five nominees already added.");
    }
    if (nomineeType && existingNominees.some((n) => n.nominee_type === nomineeType)) {
      return sendError(res, 400, `A ${nomineeType} nominee already exists.`);
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);
    const [existing] = await pool.query(
      `SELECT id FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
    );
    if (existing.length > 0) {
      return sendError(res, 400, "Nominee with this email or phone number already exists.");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const imagePath = profileImage
        ? `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`
        : null;

      const [result] = await connection.query(
        `INSERT INTO nominees (user_id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, category, relationship, nominee_type, profile_image)
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
          nomineeType,
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
            first_name = ?, middle_name = ?, last_name = ?, email = ?, 
            phone_number = ?, phone_number1 = ?, phone_number2 = ?, 
            category = ?, relation = ?, is_nominee = ?, contact_image = ?
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
          `INSERT INTO ${tableName} (user_id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, email, category, relation, is_nominee, contact_image)
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
      connection.release();

      const nominee = {
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
        nominee_type: nomineeType,
        profile_image: imagePath,
        created_at: new Date(),
      };

      res.json({ success: true, nominee });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    sendError(res, 500, `Error adding nominee: ${err.message}`);
  }
});

// PUT /api/nominees/:id - Update a nominee
router.put("/nominees/:id", checkAuth, upload, async (req, res) => {
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
    nomineeType = "",
    category,
  } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  // Manual validation
  if (!firstName || !email || !phone_number || !category) {
    return sendError(res, 400, "First name, email, primary phone number, and category are required.");
  }
  if (!["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary", ""].includes(nomineeType)) {
    return sendError(res, 400, "Invalid nominee type.");
  }
  if (category === "Family" && !relation) {
    return sendError(res, 400, "Relation is required for Family category.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, 400, "Invalid email format.");
  }

  try {
    const [existing] = await pool.query(
      `SELECT id, nominee_type FROM nominees WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (existing.length === 0) {
      return sendError(res, 404, "Nominee not found.");
    }

    if (nomineeType && nomineeType !== existing[0].nominee_type) {
      const [typeConflict] = await pool.query(
        `SELECT id FROM nominees WHERE user_id = ? AND nominee_type = ? AND id != ?`,
        [req.session.userId, nomineeType, id]
      );
      if (typeConflict.length > 0) {
        return sendError(res, 400, `A ${nomineeType} nominee already exists.`);
      }
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);
    const [conflict] = await pool.query(
      `SELECT id FROM nominees 
       WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND id != ?`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers, id]
    );
    if (conflict.length > 0) {
      return sendError(res, 400, "Another nominee with this email or phone number already exists.");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const imagePath = profileImage
        ? `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`
        : null;

      await connection.query(
        `UPDATE nominees 
         SET first_name = ?, middle_name = ?, last_name = ?, email = ?, 
             phone_number = ?, phone_number1 = ?, phone_number2 = ?, 
             relationship = ?, nominee_type = ?, category = ?, profile_image = COALESCE(?, profile_image)
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
          nomineeType,
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

      if (existingContact.length > 0) {
        await connection.query(
          `UPDATE ${tableName} SET 
           first_name = ?, middle_name = ?, last_name = ?, email = ?, 
           phone_number = ?, phone_number1 = ?, phone_number2 = ?, 
           category = ?, relation = ?, is_nominee = ?, contact_image = COALESCE(?, contact_image)
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
          `INSERT INTO ${tableName} 
           (user_id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, email, category, relation, is_nominee, contact_image)
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
      connection.release();

      const nominee = {
        id,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        category,
        relation,
        nominee_type: nomineeType,
        profile_image: imagePath || existing[0].profile_image,
      };

      res.json({ success: true, nominee });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    sendError(res, 500, `Error updating nominee: ${err.message}`);
  }
});

// DELETE /api/nominees/:id - Remove a nominee
router.delete("/nominees/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  if (!id || isNaN(parseInt(id, 10))) {
    return sendError(res, 400, "Valid Nominee ID is required.");
  }

  const parsedNomineeId = parseInt(id, 10);

  try {
    const [nominees] = await pool.query(
      `SELECT email, phone_number, phone_number1, phone_number2 FROM nominees WHERE id = ? AND user_id = ?`,
      [parsedNomineeId, userId]
    );

    if (!nominees.length) {
      return sendError(res, 404, "Nominee not found.");
    }

    const { email, phone_number, phone_number1, phone_number2 } = nominees[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [nomineeResult] = await connection.query(
        `DELETE FROM nominees WHERE id = ? AND user_id = ?`,
        [parsedNomineeId, userId]
      );

      if (nomineeResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return sendError(res, 404, "Nominee not found.");
      }

      const tableName = `contacts_user_${userId}`;
      await createUserContactsTable(userId);

      await connection.query(
        `UPDATE ${tableName} SET is_nominee = 0 
         WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND is_nominee = 1`,
        [userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: "Nominee removed successfully.",
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    sendError(res, 500, `Error removing nominee: ${err.message}`);
  }
});

// POST /api/nominees/upload-image - Upload profile image
router.post("/nominees/upload-image", checkAuth, upload, async (req, res) => {
  const { nomineeId } = req.body;
  const profileImage = req.files?.profileImage?.[0];

  if (!nomineeId) {
    return sendError(res, 400, "Nominee ID is required.");
  }

  if (!profileImage) {
    return sendError(res, 400, "No profile image uploaded.");
  }

  try {
    const [nominees] = await pool.query(
      `SELECT id, email, phone_number, phone_number1, phone_number2 FROM nominees WHERE id = ? AND user_id = ?`,
      [nomineeId, req.session.userId]
    );
    if (nominees.length === 0) {
      return sendError(res, 404, "Nominee not found.");
    }

    const { email, phone_number, phone_number1, phone_number2 } = nominees[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter((num) => num);
    const imagePath = `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `UPDATE nominees SET profile_image = ? WHERE id = ? AND user_id = ?`,
        [imagePath, nomineeId, req.session.userId]
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
        message: "Nominee image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    sendError(res, 500, `Error uploading nominee image: ${err.message}`);
  }
});

// POST /api/nominees/send-invite - Send nominee invite
router.post("/nominees/send-invite", checkAuth, async (req, res) => {
  const { nomineeId } = req.body;

  if (!nomineeId) {
    return sendError(res, 400, "Nominee ID is required.");
  }

  try {
    const [nominees] = await pool.query(
      `SELECT id, email, first_name, nominee_type FROM nominees WHERE id = ? AND user_id = ?`,
      [nomineeId, req.session.userId]
    );

    if (nominees.length === 0) {
      return sendError(res, 404, "Nominee not found.");
    }

    const nominee = nominees[0];
    if (!nominee.nominee_type) {
      return sendError(res, 400, "Cannot send invite without a nominee type.");
    }

    const inviteLink = `${process.env.FRONTEND_URL}/accept-nominee-invite?nomineeId=${nomineeId}&userId=${req.session.userId}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: nominee.email,
      subject: `Nominee Invitation from Plan Beyond`,
      html: `
        <p>Hello ${nominee.first_name},</p>
        <p>You have been invited to be a ${nominee.nominee_type} Nominee for asset management.</p>
        <p>Please click the link below to accept the invitation:</p>
        <a href="${inviteLink}">Accept Invitation</a>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Invite sent to ${nominee.first_name} (${nominee.email})`,
    });
  } catch (err) {
    sendError(res, 500, `Error sending nominee invite: ${err.message}`);
  }
});

module.exports = router;