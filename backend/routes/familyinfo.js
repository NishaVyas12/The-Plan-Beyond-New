const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { checkTableExists } = require("../database/schema");
const { checkAuth } = require("../middleware/auth");
const { upload } = require("../middleware/multer");
const fs = require("fs").promises;
const path = require("path");

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

// POST /api/familyinfo/save (unchanged)
router.post("/save", checkAuth, upload, async (req, res) => {
  // Debug: Log req.body and req.files to inspect incoming data
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  // Check if req.body is defined, provide default empty object
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is missing.",
    });
  }

  const {
    first_name = "",
    middle_name = "",
    last_name = "",
    nickname = "",
    email = null,
    phone_number = "",
    phone_number1 = "",
    phone_number2 = "",
    phone_number3 = "",
    flat_building_no = "",
    street = "",
    country = "",
    state = "",
    city = "",
    zipcode = "",
    birthday = null,
    relation = "",
    emergency_contact = false,
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
    profile_image: "", // Initialize as empty, will be updated below
    birthday: birthday || null,
    relation: relation || "",
    emergency_contact:
      emergency_contact !== undefined ? emergency_contact : false,
  };

  const validationError = validateFamilyMember(familyMember);
  if (validationError) {
    // Clean up uploaded file if validation fails
    if (req.files?.profile_image?.[0]?.path) {
      try {
        await fs.unlink(req.files.profile_image[0].path);
        console.log(
          `Deleted temporary profile image: ${req.files.profile_image[0].path}`
        );
      } catch (unlinkErr) {
        console.warn(
          `Failed to delete temporary profile image: ${unlinkErr.message}`
        );
      }
    }
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
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

      // Handle profile_image
      if (req.files?.profile_image?.[0]?.path) {
        const file = req.files.profile_image[0];
        const tempPath = file.path;
        const finalPath = path.join(
          __dirname,
          "../images",
          `${req.session.userId}`,
          "family",
          `${Date.now()}-${file.filename}`
        );
        const finalDir = path.dirname(finalPath);
        await fs.mkdir(finalDir, { recursive: true });
        await fs.rename(tempPath, finalPath);
        familyMember.profile_image = `/${path
          .relative(path.join(__dirname, ".."), finalPath)
          .replace(/\\/g, "/")}`;
      } else {
        // Check contacts_user_<user_id> table for matching phone number or email
        const tableName = `contacts_user_${req.session.userId}`;
        await checkTableExists(tableName); // Ensure table exists, assuming createUserContactsTable is available
        const phoneNumbers = [
          familyMember.phone_number,
          familyMember.phone_number1,
          familyMember.phone_number2,
          familyMember.phone_number3,
        ].filter((num) => num);
        const queryParams = [
          req.session.userId,
          familyMember.email || null,
          ...phoneNumbers,
          ...phoneNumbers,
          ...phoneNumbers,
          ...phoneNumbers,
        ];
        const [existingContact] = await connection.query(
          `SELECT contact_image FROM ${tableName} 
           WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
          queryParams
        );
        if (existingContact.length > 0 && existingContact[0].contact_image) {
          familyMember.profile_image = existingContact[0].contact_image;
        } else {
          familyMember.profile_image = "/images/default-profile.png"; // Default image if no match
        }
      }

      const [result] = await connection.query(
        `INSERT INTO familyinfo (
          user_id, first_name, middle_name, last_name, nickname, email,
          phone_number, phone_number1, phone_number2, phone_number3,
          flat_building_no, street, country, state, city, zipcode, profile_image, birthday, relation, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          familyMember.emergency_contact,
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
      // Clean up uploaded file if transaction fails
      if (req.files?.profile_image?.[0]?.path) {
        try {
          await fs.unlink(req.files.profile_image[0].path);
          console.log(
            `Deleted temporary profile image: ${req.files.profile_image[0].path}`
          );
        } catch (unlinkErr) {
          console.warn(
            `Failed to delete temporary profile image: ${unlinkErr.message}`
          );
        }
      }
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

// GET /api/familyinfo (unchanged)
router.get("/", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
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
        emergency_contact,
        driver_license_number,
        driver_license_state_issued,
        driver_license_document,
        birth_certificate_document,
        aadhaar_card_document,
        pan_card_document,
        passport_document,
        aadhaar_number,
        pan_number,
        passport_number,
        passport_state_issued,
        passport_expiration,
        document_type,
        document_name,
        file_path,
        other_document_number,
        other_document_issued,
        other_document_expiration,
        notes,
        created_at
      FROM familyinfo WHERE user_id = ?`,
      [req.session.userId]
    );

    res.json({
      success: true,
      message: "Family members retrieved successfully.",
      familyMembers: familyMembers.map((member) => ({
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
        emergency_contact: member.emergency_contact || false,
        driver_license_number: member.driver_license_number || "",
        driver_license_state_issued: member.driver_license_state_issued || "",
        driver_license_document: member.driver_license_document || "",
        birth_certificate_document: member.birth_certificate_document || "",
        aadhaar_card_document: member.aadhaar_card_document || "",
        pan_card_document: member.pan_card_document || "",
        passport_document: member.passport_document || "",
        aadhaar_number: member.aadhaar_number || "",
        pan_number: member.pan_number || "",
        passport_number: member.passport_number || "",
        passport_state_issued: member.passport_state_issued || "",
        passport_expiration: member.passport_expiration || "",
        document_type: member.document_type
          ? member.document_type.split(",")
          : [],
        document_name: member.document_name
          ? member.document_name.split(",")
          : [],
        file_path: member.file_path ? member.file_path.split(",") : [],
        other_document_number: member.other_document_number
          ? member.other_document_number.split(",")
          : [],
        other_document_issued: member.other_document_issued
          ? member.other_document_issued.split(",")
          : [],
        other_document_expiration: member.other_document_expiration
          ? member.other_document_expiration.split(",")
          : [],
        notes: member.notes || "",
        created_at: member.created_at,
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

// GET /api/familyinfo/:id (unchanged)
router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
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
        emergency_contact,
        driver_license_number,
        driver_license_state_issued,
        DATE_FORMAT(driver_license_expiration, '%Y-%m-%d') AS driver_license_expiration,
        driver_license_document,
        birth_certificate_document,
        aadhaar_card_document,
        pan_card_document,
        passport_document,
        aadhaar_number,
        pan_number,
        passport_number,
        passport_state_issued,
        DATE_FORMAT(passport_expiration, '%Y-%m-%d') AS passport_expiration,
        document_type,
        document_name,
        file_path,
        other_document_number,
        DATE_FORMAT(other_document_issued, '%Y-%m-%d') AS other_document_issued,
        DATE_FORMAT(other_document_expiration, '%Y-%m-%d') AS other_document_expiration,
        notes,
        created_at
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    const member = rows[0];
    // Construct other_documents array from comma-separated fields
    const documentNames = member.document_name
      ? member.document_name.split(",")
      : [];
    const otherDocuments = documentNames.map((name, index) => ({
      id: `other-${index}-${Date.now()}`,
      document_name: name || "",
      number: member.other_document_number
        ? member.other_document_number.split(",")[index] || ""
        : "",
      issued_date: member.other_document_issued
        ? member.other_document_issued.split(",")[index] || ""
        : "",
      expiration_date: member.other_document_expiration
        ? member.other_document_expiration.split(",")[index] || ""
        : "",
      file: member.file_path ? member.file_path.split(",")[index] || "" : "",
    }));

    res.json({
      success: true,
      familyMember: {
        ...member,
        birthday: member.birthday || "",
        emergency_contact: member.emergency_contact || false,
        driver_license_number: member.driver_license_number || "",
        driver_license_state_issued: member.driver_license_state_issued || "",
        driver_license_expiration: member.driver_license_expiration || "",
        driver_license_document: member.driver_license_document || "",
        birth_certificate_document: member.birth_certificate_document || "",
        aadhaar_card_document: member.aadhaar_card_document || "",
        pan_card_document: member.pan_card_document || "",
        passport_document: member.passport_document || "",
        aadhaar_number: member.aadhaar_number || "",
        pan_number: member.pan_number || "",
        passport_number: member.passport_number || "",
        passport_state_issued: member.passport_state_issued || "",
        passport_expiration: member.passport_expiration || "",
        document_type: member.document_type
          ? member.document_type.split(",")
          : [],
        document_name: member.document_name
          ? member.document_name.split(",")
          : [],
        file_path: member.file_path ? member.file_path.split(",") : [],
        other_document_number: member.other_document_number
          ? member.other_document_number.split(",")
          : [],
        other_document_issued: member.other_document_issued
          ? member.other_document_issued.split(",")
          : [],
        other_document_expiration: member.other_document_expiration
          ? member.other_document_expiration.split(",")
          : [],
        notes: member.notes || "",
        other_documents: otherDocuments,
      },
    });
  } catch (err) {
    console.error("Error fetching family member details:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

// PUT /api/familyinfo/:id
router.put("/:id", checkAuth, upload, async (req, res) => {
  const { id } = req.params;
  const {
    driver_license_number,
    driver_license_state_issued,
    driver_license_expiration,
    aadhaar_number,
    pan_number,
    passport_number,
    passport_state_issued,
    passport_expiration,
    notes,
    emergency_contact,
    other_document_name,
    other_document_number,
    other_document_issued,
    other_document_expiration,
    other_document_index,
    birthday,
  } = req.body;

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const tableExists = await checkTableExists("familyinfo");
    if (!tableExists) {
      return res
        .status(500)
        .json({ success: false, message: "FamilyInfo table not found." });
    }

    // Fetch current family member data to preserve existing values
    const [current] = await pool.query(
      `SELECT 
        driver_license_number,
        driver_license_state_issued,
        driver_license_expiration,
        driver_license_document,
        birth_certificate_document,
        aadhaar_number,
        aadhaar_card_document,
        pan_number,
        pan_card_document,
        passport_number,
        passport_state_issued,
        passport_expiration,
        emergency_contact,
        document_type,
        document_name,
        file_path,
        other_document_number,
        other_document_issued,
        other_document_expiration,
        notes,
        birthday 
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!current.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    // Use existing values if fields are not provided in the request, nullify expiration if document is deleted
    const updatedFields = {
      driver_license_number:
        driver_license_number !== undefined
          ? driver_license_number
          : current[0].driver_license_number || "",
      driver_license_state_issued:
        driver_license_state_issued !== undefined
          ? driver_license_state_issued
          : current[0].driver_license_state_issued || "",
      driver_license_expiration:
        req.body.driver_license_document === ""
          ? null
          : driver_license_expiration !== undefined &&
            driver_license_expiration !== ""
          ? driver_license_expiration
          : current[0].driver_license_expiration || null,
      aadhaar_number:
        aadhaar_number !== undefined
          ? aadhaar_number
          : current[0].aadhaar_number || "",
      pan_number:
        pan_number !== undefined ? pan_number : current[0].pan_number || "",
      passport_number:
        passport_number !== undefined
          ? passport_number
          : current[0].passport_number || "",
      passport_state_issued:
        passport_state_issued !== undefined
          ? passport_state_issued
          : current[0].passport_state_issued || "",
      passport_expiration:
        req.body.passport_document === ""
          ? null
          : passport_expiration !== undefined && passport_expiration !== ""
          ? passport_expiration
          : current[0].passport_expiration || null,
      emergency_contact:
        emergency_contact !== undefined
          ? emergency_contact
          : current[0].emergency_contact || false,
      notes: notes !== undefined ? notes : current[0].notes || "",
      birthday:
        birthday !== undefined && birthday !== ""
          ? birthday
          : current[0].birthday || null,
    };

    // Use existing paths if no new file is uploaded, or set to empty string for deletion
    const documentFields = {
      birth_certificate_document:
        req.files?.birth_certificate_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.birth_certificate_document === ""
          ? ""
          : current[0].birth_certificate_document || ""),
      driver_license_document:
        req.files?.driver_license_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.driver_license_document === ""
          ? ""
          : current[0].driver_license_document || ""),
      pan_card_document:
        req.files?.pan_card_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.pan_card_document === ""
          ? ""
          : current[0].pan_card_document || ""),
      passport_document:
        req.files?.passport_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.passport_document === ""
          ? ""
          : current[0].passport_document || ""),
      aadhaar_card_document:
        req.files?.aadhaar_card_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.aadhaar_card_document === ""
          ? ""
          : current[0].aadhaar_card_document || ""),
    };

    // Delete files from filesystem if their paths are set to empty
    for (const [field, newPath] of Object.entries(documentFields)) {
      if (newPath === "" && current[0][field]) {
        const filePath = path.join(__dirname, "..", current[0][field]);
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error deleting file ${filePath}:`, err);
          }
        }
      }
    }

    // Handle other document updates or deletions
    let document_type = current[0].document_type
      ? current[0].document_type.split(",")
      : [];
    let document_name = current[0].document_name
      ? current[0].document_name.split(",")
      : [];
    let file_path = current[0].file_path ? current[0].file_path.split(",") : [];
    let other_document_number_array = current[0].other_document_number
      ? current[0].other_document_number.split(",")
      : [];
    let other_document_issued_array = current[0].other_document_issued
      ? current[0].other_document_issued.split(",")
      : [];
    let other_document_expiration_array = current[0].other_document_expiration
      ? current[0].other_document_expiration.split(",")
      : [];

    if (other_document_index !== undefined) {
      const index = parseInt(other_document_index, 10);
      if (index >= 0 && index < document_name.length) {
        // Check if the request is a deletion (all fields set to null)
        if (
          other_document_name === null &&
          other_document_number === null &&
          other_document_issued === null &&
          other_document_expiration === null &&
          req.body.file_path === null
        ) {
          // Delete file from filesystem if it exists
          if (file_path[index]) {
            const oldFilePath = path.join(__dirname, "..", file_path[index]);
            try {
              await fs.access(oldFilePath);
              await fs.unlink(oldFilePath);
              console.log(`Deleted other document file: ${oldFilePath}`);
            } catch (err) {
              if (err.code !== "ENOENT") {
                console.error(
                  `Error deleting other document file ${oldFilePath}:`,
                  err
                );
              }
            }
          }
          // Remove the document at the specified index
          document_type.splice(index, 1);
          document_name.splice(index, 1);
          file_path.splice(index, 1);
          other_document_number_array.splice(index, 1);
          other_document_issued_array.splice(index, 1);
          other_document_expiration_array.splice(index, 1);
        } else if (
          req.files?.other_file?.[0]?.path ||
          other_document_name ||
          req.body.file_path === ""
        ) {
          // Delete file from filesystem if file_path is set to empty
          if (req.body.file_path === "" && file_path[index]) {
            const oldFilePath = path.join(__dirname, "..", file_path[index]);
            try {
              await fs.access(oldFilePath);
              await fs.unlink(oldFilePath);
              console.log(`Deleted other document file: ${oldFilePath}`);
            } catch (err) {
              if (err.code !== "ENOENT") {
                console.error(
                  `Error deleting other document file ${oldFilePath}:`,
                  err
                );
              }
            }
          }
          // Update existing other document
          document_name[index] =
            other_document_name !== undefined
              ? other_document_name
              : document_name[index] || `Other Document ${Date.now()}`;
          file_path[index] =
            req.body.file_path === ""
              ? ""
              : req.files?.other_file?.[0]?.path.replace(/\\/g, "/") ||
                file_path[index];
          other_document_number_array[index] =
            other_document_number !== undefined
              ? other_document_number
              : other_document_number_array[index] || "";
          other_document_issued_array[index] =
            other_document_issued !== undefined
              ? other_document_issued
              : other_document_issued_array[index] || "";
          other_document_expiration_array[index] =
            other_document_expiration !== undefined
              ? other_document_expiration
              : other_document_expiration_array[index] || "";
        }
      }
    }

    // Filter out null or empty values to prevent extra commas
    const cleanedDocumentType = document_type.filter(
      (item) => item != null && item !== ""
    );
    const cleanedDocumentName = document_name.filter(
      (item) => item != null && item !== ""
    );
    const cleanedFilePath = file_path.filter(
      (item) => item != null && item !== ""
    );
    const cleanedOtherDocumentNumber = other_document_number_array.filter(
      (item) => item != null && item !== ""
    );
    const cleanedOtherDocumentIssued = other_document_issued_array.filter(
      (item) => item != null && item !== ""
    );
    const cleanedOtherDocumentExpiration =
      other_document_expiration_array.filter(
        (item) => item != null && item !== ""
      );

    const [result] = await pool.query(
      `UPDATE familyinfo SET
        driver_license_number = ?,
        driver_license_document = ?,
        birth_certificate_document = ?,
        driver_license_state_issued = ?,
        driver_license_expiration = ?,
        aadhaar_number = ?,
        aadhaar_card_document = ?,
        pan_number = ?,
        pan_card_document = ?,
        passport_number = ?,
        passport_document = ?,
        passport_state_issued = ?,
        passport_expiration = ?,
        emergency_contact = ?,
        document_type = ?,
        document_name = ?,
        file_path = ?,
        other_document_number = ?,
        other_document_issued = ?,
        other_document_expiration = ?,
        notes = ?,
        birthday = ? 
      WHERE id = ? AND user_id = ?`,
      [
        updatedFields.driver_license_number,
        documentFields.driver_license_document,
        documentFields.birth_certificate_document,
        updatedFields.driver_license_state_issued,
        updatedFields.driver_license_expiration,
        updatedFields.aadhaar_number,
        documentFields.aadhaar_card_document,
        updatedFields.pan_number,
        documentFields.pan_card_document,
        updatedFields.passport_number,
        documentFields.passport_document,
        updatedFields.passport_state_issued,
        updatedFields.passport_expiration,
        updatedFields.emergency_contact,
        cleanedDocumentType.length > 0 ? cleanedDocumentType.join(",") : null,
        cleanedDocumentName.length > 0 ? cleanedDocumentName.join(",") : null,
        cleanedFilePath.length > 0 ? cleanedFilePath.join(",") : null,
        cleanedOtherDocumentNumber.length > 0
          ? cleanedOtherDocumentNumber.join(",")
          : null,
        cleanedOtherDocumentIssued.length > 0
          ? cleanedOtherDocumentIssued.join(",")
          : null,
        cleanedOtherDocumentExpiration.length > 0
          ? cleanedOtherDocumentExpiration.join(",")
          : null,
        updatedFields.notes,
        updatedFields.birthday,
        id,
        req.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    const [updatedRows] = await pool.query(
      `SELECT 
        driver_license_number,
        driver_license_state_issued,
        DATE_FORMAT(driver_license_expiration, '%Y-%m-%d') AS driver_license_expiration,
        driver_license_document,
        birth_certificate_document,
        aadhaar_card_document,
        pan_card_document,
        passport_document,
        aadhaar_number,
        pan_number,
        passport_number,
        passport_state_issued,
        DATE_FORMAT(passport_expiration, '%Y-%m-%d') AS passport_expiration,
        emergency_contact,
        document_type,
        document_name,
        file_path,
        other_document_number,
        DATE_FORMAT(other_document_issued, '%Y-%m-%d') AS other_document_issued,
        DATE_FORMAT(other_document_expiration, '%Y-%m-%d') AS other_document_expiration,
        notes,
        DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    const updatedOtherDocuments = (
      updatedRows[0].document_name
        ? updatedRows[0].document_name.split(",")
        : []
    ).map((name, index) => ({
      id: `other-${index}-${Date.now()}`,
      document_name: name || "",
      number: updatedRows[0].other_document_number
        ? updatedRows[0].other_document_number.split(",")[index] || ""
        : "",
      issued_date: updatedRows[0].other_document_issued
        ? updatedRows[0].other_document_issued.split(",")[index] || ""
        : "",
      expiration_date: updatedRows[0].other_document_expiration
        ? updatedRows[0].other_document_expiration.split(",")[index] || ""
        : "",
      file: updatedRows[0].file_path
        ? updatedRows[0].file_path.split(",")[index] || ""
        : "",
    }));

    res.json({
      success: true,
      message: "Family member updated successfully.",
      familyMember: {
        ...updatedRows[0],
        emergency_contact: updatedRows[0].emergency_contact || false,
        birthday: updatedRows[0].birthday || "",
        other_documents: updatedOtherDocuments,
      },
    });
  } catch (err) {
    console.error("Error updating family member:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

// POST /api/familyinfo/other-document (unchanged)
router.post("/other-document", checkAuth, upload, async (req, res) => {
  const {
    family_id,
    other_document_name,
    other_document_number,
    other_document_issued,
    other_document_expiration,
  } = req.body;
  const new_file_path =
    req.files?.other_file?.[0]?.path.replace(/\\/g, "/") || "";
  const is_file_deletion = req.body.file_path === ""; // Check if file deletion is requested

  // Validate family_id
  if (!family_id) {
    return res.status(400).json({
      success: false,
      message: "Family ID is required.",
    });
  }

  // Use a default document name if other_document_name is not provided
  const documentName =
    other_document_name?.trim() || `Other Document ${Date.now()}`;

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
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

    const [family] = await pool.query(
      `SELECT id, document_type, document_name, file_path, other_document_number, other_document_issued, other_document_expiration
       FROM familyinfo WHERE id = ? AND user_id = ?`,
      [family_id, req.session.userId]
    );
    if (family.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Family member not found or unauthorized.",
      });
    }

    const current = family[0];
    const document_type = current.document_type
      ? [...current.document_type.split(","), "Other"]
      : ["Other"];
    const document_name = current.document_name
      ? [...current.document_name.split(","), documentName]
      : [documentName];
    let file_path_array = current.file_path
      ? [...current.file_path.split(","), new_file_path]
      : [new_file_path];
    const other_document_number_array = current.other_document_number
      ? [
          ...current.other_document_number.split(","),
          other_document_number || "",
        ]
      : [other_document_number || ""];
    const other_document_issued_array = current.other_document_issued
      ? [
          ...current.other_document_issued.split(","),
          other_document_issued || "",
        ]
      : [other_document_issued || ""];
    const other_document_expiration_array = current.other_document_expiration
      ? [
          ...current.other_document_expiration.split(","),
          other_document_expiration || "",
        ]
      : [other_document_expiration || ""];

    // Delete old file from filesystem if file_path is set to empty
    if (is_file_deletion && current.file_path) {
      const existing_file_paths = current.file_path.split(",");
      // Assuming the last file in the array is being targeted (newest document)
      const oldFilePath = existing_file_paths[existing_file_paths.length - 1];
      if (oldFilePath) {
        const fullPath = path.join(__dirname, "..", oldFilePath);
        try {
          await fs.access(fullPath);
          await fs.unlink(fullPath);
          console.log(`Deleted other document file: ${fullPath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(
              `Error deleting other document file ${fullPath}:`,
              err
            );
          }
        }
      }
      // Update file_path_array to reflect deletion
      file_path_array[file_path_array.length - 1] = "";
    }

    const [result] = await pool.query(
      `UPDATE familyinfo SET
        document_type = ?,
        document_name = ?,
        file_path = ?,
        other_document_number = ?,
        other_document_issued = ?,
        other_document_expiration = ?
      WHERE id = ? AND user_id = ?`,
      [
        document_type.join(","),
        document_name.join(","),
        file_path_array.join(","),
        other_document_number_array.join(","),
        other_document_issued_array.join(","),
        other_document_expiration_array.join(","),
        family_id,
        req.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Family member not found or unauthorized.",
      });
    }

    res.json({
      success: true,
      message: `${documentName} file updated successfully.`,
      updatedDocument: {
        id: `other-${document_name.length - 1}-${Date.now()}`,
        document_name: documentName,
        number: other_document_number || "",
        issued_date: other_document_issued || "",
        expiration_date: other_document_expiration || "",
        file: is_file_deletion ? "" : new_file_path,
      },
    });
  } catch (err) {
    console.error("Error updating other document:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

router.delete("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT 
        profile_image,
        driver_license_document,
        birth_certificate_document,
        aadhaar_card_document,
        pan_card_document,
        passport_document,
        file_path
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!existing.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    const existingMember = existing[0];

    const fileFields = [
      "profile_image",
      "driver_license_document",
      "birth_certificate_document",
      "aadhaar_card_document",
      "pan_card_document",
      "passport_document",
    ];

    for (const field of fileFields) {
      if (existingMember[field]) {
        const filePath = path.join(
          __dirname,
          "..",
          existingMember[field].replace(/^\//, "")
        );
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`Deleted ${field}: ${filePath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.warn(
              `Failed to delete ${field} ${filePath}: ${err.message}`
            );
          }
        }
      }
    }

    const [result] = await connection.query(
      "DELETE FROM familyinfo WHERE id = ? AND user_id = ?",
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    await connection.commit();
    res.json({ success: true, message: "Family member deleted successfully." });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting family member:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  } finally {
    connection.release();
  }
});

router.put("/:id/basic", checkAuth, upload, async (req, res) => {
  const { id } = req.params;

  // Debug: Log req.body and req.files to inspect incoming data
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  // Check if req.body is defined, provide default empty object
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "Request body is missing.",
    });
  }

  const {
    first_name = "",
    middle_name = "",
    last_name = "",
    nickname = "",
    email = null,
    phone_number = "",
    phone_number1 = "",
    phone_number2 = "",
    phone_number3 = "",
    flat_building_no = "",
    street = "",
    country = "",
    state = "",
    city = "",
    zipcode = "",
    birthday = null,
    relation = "",
    emergency_contact = false,
  } = req.body;

  const familyMember = {
    first_name: first_name?.trim(),
    phone_number: phone_number?.trim(),
    email: email?.trim() || null,
  };

  const validationError = validateFamilyMember(familyMember);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const tableExists = await checkTableExists("familyinfo");
    if (!tableExists) {
      return res
        .status(500)
        .json({ success: false, message: "FamilyInfo table not found." });
    }

    const [current] = await pool.query(
      `SELECT 
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
        emergency_contact
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!current.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    let profile_image = current[0].profile_image || "";
    if (req.files?.profile_image?.[0]?.path) {
      const file = req.files.profile_image[0];
      const tempPath = file.path;
      const finalPath = path.join(
        __dirname,
        "../images",
        `${req.session.userId}`,
        "family",
        `${id}`,
        file.filename
      );
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      profile_image = `/${path
        .relative(path.join(__dirname, ".."), finalPath)
        .replace(/\\/g, "/")}`;

      if (current[0].profile_image) {
        const oldFilePath = path.join(
          __dirname,
          "..",
          current[0].profile_image.replace(/^\//, "")
        );
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted old profile image: ${oldFilePath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(
              `Error deleting old profile image ${oldFilePath}:`,
              err
            );
          }
        }
      }
    } else if (req.body.profile_image === "") {
      profile_image = "";
      if (current[0].profile_image) {
        const oldFilePath = path.join(
          __dirname,
          "..",
          current[0].profile_image.replace(/^\//, "")
        );
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted profile image: ${oldFilePath}`);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error deleting profile image ${oldFilePath}:`, err);
          }
        }
      }
    }

    const updatedFields = {
      first_name:
        first_name !== undefined ? first_name : current[0].first_name || "",
      middle_name:
        middle_name !== undefined ? middle_name : current[0].middle_name || "",
      last_name:
        last_name !== undefined ? last_name : current[0].last_name || "",
      nickname: nickname !== undefined ? nickname : current[0].nickname || "",
      email: email !== undefined ? email : current[0].email || null,
      phone_number:
        phone_number !== undefined
          ? phone_number
          : current[0].phone_number || "",
      phone_number1:
        phone_number1 !== undefined
          ? phone_number1
          : current[0].phone_number1 || "",
      phone_number2:
        phone_number2 !== undefined
          ? phone_number2
          : current[0].phone_number2 || "",
      phone_number3:
        phone_number3 !== undefined
          ? phone_number3
          : current[0].phone_number3 || "",
      flat_building_no:
        flat_building_no !== undefined
          ? flat_building_no
          : current[0].flat_building_no || "",
      street: street !== undefined ? street : current[0].street || "",
      country: country !== undefined ? country : current[0].country || "",
      state: state !== undefined ? state : current[0].state || "",
      city: city !== undefined ? city : current[0].city || "",
      zipcode: zipcode !== undefined ? zipcode : current[0].zipcode || "",
      profile_image: profile_image,
      birthday:
        birthday !== undefined && birthday !== ""
          ? birthday
          : current[0].birthday || null,
      relation: relation !== undefined ? relation : current[0].relation || "",
      emergency_contact:
        emergency_contact !== undefined
          ? emergency_contact
          : current[0].emergency_contact || false,
    };

    const [result] = await pool.query(
      `UPDATE familyinfo SET
        first_name = ?,
        middle_name = ?,
        last_name = ?,
        nickname = ?,
        email = ?,
        phone_number = ?,
        phone_number1 = ?,
        phone_number2 = ?,
        phone_number3 = ?,
        flat_building_no = ?,
        street = ?,
        country = ?,
        state = ?,
        city = ?,
        zipcode = ?,
        profile_image = ?,
        birthday = ?,
        relation = ?,
        emergency_contact = ?
      WHERE id = ? AND user_id = ?`,
      [
        updatedFields.first_name,
        updatedFields.middle_name,
        updatedFields.last_name,
        updatedFields.nickname,
        updatedFields.email,
        updatedFields.phone_number,
        updatedFields.phone_number1,
        updatedFields.phone_number2,
        updatedFields.phone_number3,
        updatedFields.flat_building_no,
        updatedFields.street,
        updatedFields.country,
        updatedFields.state,
        updatedFields.city,
        updatedFields.zipcode,
        updatedFields.profile_image,
        updatedFields.birthday,
        updatedFields.relation,
        updatedFields.emergency_contact,
        id,
        req.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    const [updatedRows] = await pool.query(
      `SELECT 
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
        emergency_contact
      FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!updatedRows.length) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Family member not found or unauthorized.",
        });
    }

    res.json({
      success: true,
      message: "Family member basic details updated successfully.",
      familyMember: {
        ...updatedRows[0],
        emergency_contact: updatedRows[0].emergency_contact || false,
        birthday: updatedRows[0].birthday || "",
      },
    });
  } catch (err) {
    if (req.files?.profile_image?.[0]?.path) {
      try {
        await fs.unlink(req.files.profile_image[0].path);
        console.log(
          `Deleted temporary profile image: ${req.files.profile_image[0].path}`
        );
      } catch (unlinkErr) {
        console.warn(
          `Failed to delete temporary profile image: ${unlinkErr.message}`
        );
      }
    }
    console.error("Error updating family member basic details:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});
module.exports = router;
