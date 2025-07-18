const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { checkTableExists } = require("../database/schema");
const { checkAuth } = require("../middleware/auth");
const { upload } = require("../middleware/multer");
const fs = require("fs").promises;
const path = require("path");
const sanitize = require("sanitize-filename");

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
    anniversary = null,
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
    profile_image: "",
    birthday: birthday || null,
    anniversary: anniversary || null,
    relation: relation || "",
    emergency_contact: emergency_contact !== undefined ? emergency_contact : false,
    new_folder_documents: [],
  };

  const validationError = validateFamilyMember(familyMember);
  if (validationError) {
    // Clean up uploaded files if validation fails
    if (req.files?.profile_image?.[0]?.path || req.files?.new_folder_documents?.length) {
      const filesToDelete = [
        ...(req.files?.profile_image?.[0]?.path ? [req.files.profile_image[0].path] : []),
        ...(req.files?.new_folder_documents?.map(file => file.path) || []),
      ];
      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted temporary file: ${filePath}`);
        } catch (unlinkErr) {
          console.warn(`Failed to delete temporary file: ${unlinkErr.message}`);
        }
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
        await checkTableExists(tableName);
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
          familyMember.profile_image = "/images/default-profile.png";
        }
      }

      // Handle new_folder_documents
      if (req.files?.new_folder_documents?.length) {
        const documentPaths = [];
        for (const file of req.files.new_folder_documents) {
          const tempPath = file.path;
          const finalPath = path.join(
            __dirname,
            "../images",
            `${req.session.userId}`,
            "family",
            "folders",
            `${Date.now()}-${file.filename}`
          );
          const finalDir = path.dirname(finalPath);
          await fs.mkdir(finalDir, { recursive: true });
          await fs.rename(tempPath, finalPath);
          documentPaths.push(`/${path
            .relative(path.join(__dirname, ".."), finalPath)
            .replace(/\\/g, "/")}`);
        }
        familyMember.new_folder_documents = JSON.stringify(documentPaths);
      }

      const [result] = await connection.query(
        `INSERT INTO familyinfo (
          user_id, first_name, middle_name, last_name, nickname, email,
          phone_number, phone_number1, phone_number2, phone_number3,
          flat_building_no, street, country, state, city, zipcode, profile_image, 
          birthday, anniversary, relation, emergency_contact, new_folder_documents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          familyMember.anniversary,
          familyMember.relation,
          familyMember.emergency_contact,
          familyMember.new_folder_documents.length ? familyMember.new_folder_documents : null,
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
      // Clean up uploaded files if transaction fails
      const filesToDelete = [
        ...(req.files?.profile_image?.[0]?.path ? [req.files.profile_image[0].path] : []),
        ...(req.files?.new_folder_documents?.map(file => file.path) || []),
      ];
      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted temporary file: ${filePath}`);
        } catch (unlinkErr) {
          console.warn(`Failed to delete temporary file: ${unlinkErr.message}`);
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


// GET /api/familyinfo
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
        DATE_FORMAT(anniversary, '%Y-%m-%d') AS anniversary,
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
        new_folder_documents,
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
        anniversary: member.anniversary || "",
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
        new_folder_documents: member.new_folder_documents
          ? JSON.parse(member.new_folder_documents)
          : [],
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

// GET /api/familyinfo/:id
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
        DATE_FORMAT(anniversary, '%Y-%m-%d') AS anniversary,
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
        new_folder_documents,
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
        anniversary: member.anniversary || "",
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
        new_folder_documents: member.new_folder_documents
          ? JSON.parse(member.new_folder_documents)
          : [],
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

// ✅ PUT /api/familyinfo/:id
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
    anniversary,
  } = req.body;

  const connection = await pool.getConnection();
  try {
    // ✅ Check user exists
    const [users] = await connection.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // ✅ Fetch current family member data
    const [current] = await connection.query(
      `SELECT driver_license_number, driver_license_state_issued, driver_license_expiration,
        driver_license_document, birth_certificate_document, aadhaar_number, aadhaar_card_document,
        pan_number, pan_card_document, passport_number, passport_state_issued, passport_expiration,
        passport_document, emergency_contact, document_type, document_name, file_path,
        other_document_number, other_document_issued, other_document_expiration, notes,
        birthday, anniversary, new_folder_documents
       FROM familyinfo WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (!current.length) {
      return res.status(404).json({ success: false, message: "Family member not found or unauthorized." });
    }

    const currentMember = current[0];

    // ✅ Update fields (or preserve old values)
    const updatedFields = {
      driver_license_number: driver_license_number || currentMember.driver_license_number || "",
      driver_license_state_issued: driver_license_state_issued || currentMember.driver_license_state_issued || "",
      driver_license_expiration:
        req.body.driver_license_document === ""
          ? null
          : driver_license_expiration || currentMember.driver_license_expiration || null,
      aadhaar_number: aadhaar_number || currentMember.aadhaar_number || "",
      pan_number: pan_number || currentMember.pan_number || "",
      passport_number: passport_number || currentMember.passport_number || "",
      passport_state_issued: passport_state_issued || currentMember.passport_state_issued || "",
      passport_expiration:
        req.body.passport_document === ""
          ? null
          : passport_expiration || currentMember.passport_expiration || null,
      emergency_contact: emergency_contact || currentMember.emergency_contact || false,
      notes: notes || currentMember.notes || "",
      birthday: birthday === "" ? null : birthday || currentMember.birthday || null,
      anniversary: anniversary === "" ? null : anniversary || currentMember.anniversary || null,
    };

    // ✅ Handle single document fields
    const documentFields = {
      birth_certificate_document: req.files?.birth_certificate_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.birth_certificate_document === "" ? "" : currentMember.birth_certificate_document || ""),
      driver_license_document: req.files?.driver_license_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.driver_license_document === "" ? "" : currentMember.driver_license_document || ""),
      pan_card_document: req.files?.pan_card_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.pan_card_document === "" ? "" : currentMember.pan_card_document || ""),
      passport_document: req.files?.passport_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.passport_document === "" ? "" : currentMember.passport_document || ""),
      aadhaar_card_document: req.files?.aadhaar_card_document?.[0]?.path.replace(/\\/g, "/") ||
        (req.body.aadhaar_card_document === "" ? "" : currentMember.aadhaar_card_document || ""),
    };

    // ✅ Handle new_folder_documents
    let folderDocs = [];
    try {
      folderDocs = currentMember.new_folder_documents ? JSON.parse(currentMember.new_folder_documents) : [];
    } catch {
      folderDocs = [];
    }

    if (req.files?.new_folder_documents) {
      const uploadedFiles = req.files.new_folder_documents.map(f => f.path.replace(/\\/g, "/"));
      folderDocs.push(...uploadedFiles);
    }

    if (req.body.new_folder_documents === "") {
      folderDocs = []; // clear all
    }

    // ✅ Delete files from disk for cleared single docs
    for (const [field, newPath] of Object.entries(documentFields)) {
      if (newPath === "" && currentMember[field]) {
        const filePath = path.join(__dirname, "..", currentMember[field]);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          if (err.code !== "ENOENT") console.error(`Error deleting file: ${filePath}`, err);
        }
      }
    }

    // ✅ Update DB
    await connection.query(
      `UPDATE familyinfo SET
        driver_license_number=?, driver_license_document=?, birth_certificate_document=?, driver_license_state_issued=?, driver_license_expiration=?,
        aadhaar_number=?, aadhaar_card_document=?, pan_number=?, pan_card_document=?, passport_number=?, passport_document=?,
        passport_state_issued=?, passport_expiration=?, emergency_contact=?, notes=?, birthday=?, anniversary=?, new_folder_documents=?
      WHERE id=? AND user_id=?`,
      [
        updatedFields.driver_license_number, documentFields.driver_license_document, documentFields.birth_certificate_document,
        updatedFields.driver_license_state_issued, updatedFields.driver_license_expiration, updatedFields.aadhaar_number,
        documentFields.aadhaar_card_document, updatedFields.pan_number, documentFields.pan_card_document,
        updatedFields.passport_number, documentFields.passport_document, updatedFields.passport_state_issued,
        updatedFields.passport_expiration, updatedFields.emergency_contact, updatedFields.notes,
        updatedFields.birthday, updatedFields.anniversary, JSON.stringify(folderDocs), id, req.session.userId
      ]
    );

    res.json({ success: true, message: "Family member updated successfully.", new_folder_documents: folderDocs });
  } catch (err) {
    console.error("Error updating family member:", err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  } finally {
    connection.release();
  }
});


// POST /api/familyinfo/other-document
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
  const { fieldName, fileIndex } = req.query;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT profile_image, driver_license_document, birth_certificate_document,
              aadhaar_card_document, pan_card_document, passport_document, new_folder_documents
       FROM familyinfo WHERE id=? AND user_id=?`,
      [id, req.session.userId]
    );

    if (!existing.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Family member not found." });
    }

    const member = existing[0];

    // ✅ Delete a specific file from new_folder_documents
    if (fieldName === "new_folder_documents" && fileIndex !== undefined) {
      let files = [];
      try {
        files = JSON.parse(member.new_folder_documents || "[]");
      } catch {
        files = [];
      }

      if (fileIndex < 0 || fileIndex >= files.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Invalid file index." });
      }

      const deletedFile = files[fileIndex];
      files.splice(fileIndex, 1);

      await connection.query(
        "UPDATE familyinfo SET new_folder_documents=? WHERE id=? AND user_id=?",
        [JSON.stringify(files), id, req.session.userId]
      );

      // Remove file physically
      const absolutePath = path.join(__dirname, "..", deletedFile);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }

      await connection.commit();
      return res.json({ success: true, message: "File removed successfully.", updatedFiles: files });
    }

    // ✅ Delete entire member (with files)
    const filePaths = [
      member.profile_image,
      member.driver_license_document,
      member.birth_certificate_document,
      member.aadhaar_card_document,
      member.pan_card_document,
      member.passport_document,
      ...(JSON.parse(member.new_folder_documents || "[]"))
    ];

    for (const file of filePaths) {
      if (file) {
        const absolutePath = path.join(__dirname, "..", file);
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      }
    }

    await connection.query("DELETE FROM familyinfo WHERE id=? AND user_id=?", [id, req.session.userId]);
    await connection.commit();
    res.json({ success: true, message: "Family member deleted successfully." });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting family member:", err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
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
    anniversary = null,
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
        anniversary,
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
        birthday !== undefined ? (birthday === "" || birthday === null ? null : birthday) : current[0].birthday || null,
      anniversary:
        anniversary !== undefined ? (anniversary === "" || anniversary === null ? null : anniversary) : current[0].anniversary || null,
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
        anniversary = ?,
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
        updatedFields.anniversary,
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
        DATE_FORMAT(anniversary, '%Y-%m-%d') AS anniversary,
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
        anniversary: updatedRows[0].anniversary || "",
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