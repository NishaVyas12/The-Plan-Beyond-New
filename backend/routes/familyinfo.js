const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { checkTableExists } = require("../database/schema");
const { checkAuth } = require("../middleware/auth");

// Validate family member data
const validateFamilyMember = (member) => {
  if (!member.first_name?.trim()) {
    return "First name is required.";
  }
  if (!member.phone_number?.trim()) {
    return "Primary phone number is required.";
  }
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    return "Invalid email format.";
  }
  return null;
};

// POST /api/familyinfo/save
router.post("/save", checkAuth, async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    nickname,
    email,
    phone_number,
    phone_number1,
    phone_number2,
    phone_number3,
    flat_building_no,
    street,
    country,
    state,
    city,
    zipcode,
    profile_image,
    birthday,
    relation,
  } = req.body;

  const familyMember = {
    first_name,
    middle_name: middle_name || "",
    last_name: last_name || "",
    nickname: nickname || "",
    email: email || null,
    phone_number,
    phone_number1: phone_number1 || "",
    phone_number2: phone_number2 || "",
    phone_number3: phone_number3 || "",
    flat_building_no: flat_building_no || "",
    street: street || "",
    country: country || "",
    state: state || "",
    city: city || "",
    zipcode: zipcode || "",
    profile_image: profile_image || "",
    birthday: birthday || null,
    relation: relation || "",
  };

  const validationError = validateFamilyMember(familyMember);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const tableExists = await checkTableExists("familyinfo");
    if (!tableExists) {
      return res.status(500).json({
        success: false,
        message: "FamilyInfo table not found.",
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO familyinfo (
          user_id, first_name, middle_name, last_name, nickname, email,
          phone_number, phone_number1, phone_number2, phone_number3,
          flat_building_no, street, country, state, city, zipcode, profile_image, birthday, relation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          familyMember.first_name,
          familyMember.middle_name,
          familyMember.last_name,
          familyMember.nickname,
          familyMember.email,
          familyMember.phone_number,
          familyMember.phone_number1,
          familyMember.phone_number2,
          familyMember.phone_number3,
          familyMember.flat_building_no,
          familyMember.street,
          familyMember.country,
          familyMember.state,
          familyMember.city,
          familyMember.zipcode,
          familyMember.profile_image,
          familyMember.birthday,
          familyMember.relation,
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Family member saved successfully.",
        familyMember: {
          id: result.insertId,
          ...familyMember,
          user_id: req.session.userId,
          created_at: new Date(),
        },
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error saving family member:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// GET /api/familyinfo
router.get("/", checkAuth, async (req, res) => {
  try {
    // Verify user exists
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if familyinfo table exists
    const tableExists = await checkTableExists("familyinfo");
    if (!tableExists) {
      return res.status(500).json({
        success: false,
        message: "FamilyInfo table not found.",
      });
    }

    // Fetch all family members for the authenticated user
    const [familyMembers] = await pool.query(
      `SELECT 
        id, 
        first_name, 
        middle_name, 
        last_name, 
        nickname, 
        email, 
        phone_number, 
        phone_number1, 
        phone_number2, 
        phone_number3, 
        flat_building_no, 
        street, 
        country, 
        state, 
        city, 
        zipcode, 
        profile_image,
        DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday,
        relation,
        created_at
      FROM familyinfo WHERE user_id = ?`,
      [req.session.userId]
    );

    res.json({
      success: true,
      message: "Family members retrieved successfully.",
      familyMembers: familyMembers.map(member => ({
        id: member.id,
        first_name: member.first_name || "",
        middle_name: member.middle_name || "",
        last_name: member.last_name || "",
        nickname: member.nickname || "",
        email: member.email || "",
        phone_number: member.phone_number || "",
        phone_number1: member.phone_number1 || "",
        phone_number2: member.phone_number2 || "",
        phone_number3: member.phone_number3 || "",
        flat_building_no: member.flat_building_no || "",
        street: member.street || "",
        country: member.country || "",
        state: member.state || "",
        city: member.city || "",
        zipcode: member.zipcode || "",
        profile_image: member.profile_image || "",
        birthday: member.birthday || "",
        relation: member.relation || "",
        created_at: member.created_at
      })),
    });
  } catch (err) {
    console.error("Error fetching family members:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// GET /api/familyinfo/:id
router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify user exists
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [req.session.userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if familyinfo table exists
    const tableExists = await checkTableExists("familyinfo");
    if (!tableExists) {
      return res.status(500).json({
        success: false,
        message: "FamilyInfo table not found.",
      });
    }

    // Fetch family member by ID and user_id
    const [familyMembers] = await pool.query(
      `SELECT 
        id, 
        first_name, 
        middle_name, 
        last_name, 
        nickname, 
        email, 
        phone_number, 
        phone_number1, 
        phone_number2, 
        phone_number3, 
        flat_building_no, 
        street, 
        country, 
        state, 
        city, 
        zipcode, 
        profile_image,
        DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday,
        relation,
        created_at
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (familyMembers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Family member not found.",
      });
    }

    const member = familyMembers[0];
    res.json({
      success: true,
      message: "Family member retrieved successfully.",
      familyMember: {
        id: member.id,
        first_name: member.first_name || "",
        middle_name: member.middle_name || "",
        last_name: member.last_name || "",
        nickname: member.nickname || "",
        email: member.email || "",
        phone_number: member.phone_number || "",
        phone_number1: member.phone_number1 || "",
        phone_number2: member.phone_number2 || "",
        phone_number3: member.phone_number3 || "",
        flat_building_no: member.flat_building_no || "",
        street: member.street || "",
        country: member.country || "",
        state: member.state || "",
        city: member.city || "",
        zipcode: member.zipcode || "",
        profile_image: member.profile_image || "",
        birthday: member.birthday || "",
        relation: member.relation || "",
        created_at: member.created_at
      },
    });
  } catch (err) {
    console.error("Error fetching family member:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

module.exports = router;