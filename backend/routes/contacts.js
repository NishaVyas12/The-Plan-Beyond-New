const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const uploadWithMulter = require("../utils/fileUpload");
const {
  createUserContactsTable,
  createUploadedFilesTable,
  checkTableExists,
} = require("../database/schema");
const path = require("path");
const fs = require("fs").promises;
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const { checkAuth } = require("../middleware/auth");

// Middleware to check authentication
const auth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Session timed out, login again.",
    });
  }
  next();
};

// Helper function to validate contact data
const validateContact = (contact) => {
  if (!contact.first_name?.trim()) {
    return "First name is required.";
  }
  if (!contact.phone_number?.trim()) {
    return "At least one phone number is required.";
  }
  const parsedNumber = parsePhoneNumberFromString(contact.phone_number, "IN");
  if (!parsedNumber || !parsedNumber.isValid()) {
    return "Phone number must be in a valid international format.";
  }
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return "Invalid email format.";
  }
  if (
    contact.website &&
    !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(contact.website)
  ) {
    return "Invalid website URL.";
  }
  return null;
};

// Helper function to update contacts table schema
const updateUserContactsTableSchema = async (userId) => {
  const tableName = `contacts_user_${userId}`;
  const checkColumnsQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? 
    AND COLUMN_NAME IN ('first_name', 'middle_name', 'last_name', 'company', 'job_type', 'website', 'category', 'relation', 'phone_number', 'phone_number1', 'phone_number2', 'phone_number3', 'email', 'flat_building_no', 'street', 'country', 'state', 'city', 'postal_code', 'date_of_birth', 'anniversary', 'notes', 'contact_image', 'release_on_pass', 'is_ambassador', 'is_nominee')
    AND TABLE_SCHEMA = ?
  `;
  try {
    const [columns] = await pool.query(checkColumnsQuery, [
      tableName,
      process.env.DB_NAME || "plan_beyond",
    ]);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    const addColumnQueries = [
      {
        name: "first_name",
        query: `ALTER TABLE ${tableName} ADD COLUMN first_name VARCHAR(255) NOT NULL AFTER user_id`,
      },
      {
        name: "middle_name",
        query: `ALTER TABLE ${tableName} ADD COLUMN middle_name VARCHAR(255) DEFAULT '' AFTER first_name`,
      },
      {
        name: "last_name",
        query: `ALTER TABLE ${tableName} ADD COLUMN last_name VARCHAR(255) DEFAULT '' AFTER middle_name`,
      },
      {
        name: "company",
        query: `ALTER TABLE ${tableName} ADD COLUMN company VARCHAR(255) DEFAULT '' AFTER last_name`,
      },
      {
        name: "job_type",
        query: `ALTER TABLE ${tableName} ADD COLUMN job_type VARCHAR(255) DEFAULT '' AFTER company`,
      },
      {
        name: "website",
        query: `ALTER TABLE ${tableName} ADD COLUMN website VARCHAR(255) DEFAULT '' AFTER job_type`,
      },
      {
        name: "category",
        query: `ALTER TABLE ${tableName} ADD COLUMN category VARCHAR(50) DEFAULT '' AFTER website`,
      },
      {
        name: "relation",
        query: `ALTER TABLE ${tableName} ADD COLUMN relation VARCHAR(50) DEFAULT '' AFTER category`,
      },
      {
        name: "phone_number1",
        query: `ALTER TABLE ${tableName} ADD COLUMN phone_number1 VARCHAR(20) DEFAULT '' AFTER phone_number`,
      },
      {
        name: "phone_number2",
        query: `ALTER TABLE ${tableName} ADD COLUMN phone_number2 VARCHAR(20) DEFAULT '' AFTER phone_number1`,
      },
      {
        name: "phone_number3",
        query: `ALTER TABLE ${tableName} ADD COLUMN phone_number3 VARCHAR(20) DEFAULT '' AFTER phone_number2`,
      },
      {
        name: "email",
        query: `ALTER TABLE ${tableName} ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER phone_number3`,
      },
      {
        name: "flat_building_no",
        query: `ALTER TABLE ${tableName} ADD COLUMN flat_building_no VARCHAR(100) DEFAULT '' AFTER email`,
      },
      {
        name: "street",
        query: `ALTER TABLE ${tableName} ADD COLUMN street TEXT DEFAULT '' AFTER flat_building_no`,
      },
      {
        name: "country",
        query: `ALTER TABLE ${tableName} ADD COLUMN country VARCHAR(100) DEFAULT '' AFTER street`,
      },
      {
        name: "state",
        query: `ALTER TABLE ${tableName} ADD COLUMN state VARCHAR(100) DEFAULT '' AFTER country`,
      },
      {
        name: "city",
        query: `ALTER TABLE ${tableName} ADD COLUMN city VARCHAR(100) DEFAULT '' AFTER state`,
      },
      {
        name: "postal_code",
        query: `ALTER TABLE ${tableName} ADD COLUMN postal_code VARCHAR(20) DEFAULT '' AFTER city`,
      },
      {
        name: "date_of_birth",
        query: `ALTER TABLE ${tableName} ADD COLUMN date_of_birth VARCHAR(10) DEFAULT '' AFTER postal_code`,
      },
      {
        name: "anniversary",
        query: `ALTER TABLE ${tableName} ADD COLUMN anniversary VARCHAR(10) DEFAULT '' AFTER date_of_birth`,
      },
      {
        name: "notes",
        query: `ALTER TABLE ${tableName} ADD COLUMN notes TEXT DEFAULT NULL AFTER anniversary`,
      },
      {
        name: "contact_image",
        query: `ALTER TABLE ${tableName} ADD COLUMN contact_image VARCHAR(255) DEFAULT '' AFTER notes`,
      },
      {
        name: "release_on_pass",
        query: `ALTER TABLE ${tableName} ADD COLUMN release_on_pass BOOLEAN DEFAULT FALSE AFTER contact_image`,
      },
      {
        name: "is_ambassador",
        query: `ALTER TABLE ${tableName} ADD COLUMN is_ambassador BOOLEAN DEFAULT FALSE AFTER release_on_pass`,
      },
      {
        name: "is_nominee",
        query: `ALTER TABLE ${tableName} ADD COLUMN is_nominee BOOLEAN DEFAULT FALSE AFTER is_ambassador`,
      },
    ];

    for (const { name, query } of addColumnQueries) {
      if (!columnNames.includes(name)) {
        await pool.query(query);
      }
    }

    // Remove legacy columns if present
    if (columnNames.includes("name")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN first_name VARCHAR(255) NOT NULL DEFAULT '' AFTER user_id`
      );
      await pool.query(
        `UPDATE ${tableName} SET first_name = name WHERE first_name = ''`
      );
      await pool.query(`ALTER TABLE ${tableName} DROP COLUMN name`);
    }
    if (columnNames.includes("address")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN flat_building_no VARCHAR(100) DEFAULT '' AFTER email`
      );
      await pool.query(
        `UPDATE ${tableName} SET flat_building_no = address WHERE flat_building_no = ''`
      );
      await pool.query(`ALTER TABLE ${tableName} DROP COLUMN address`);
    }
  } catch (err) {
    console.error(`Error updating contacts table schema for user ${userId}:`, err);
    throw err;
  }
};

// POST /api/contacts/save
router.post(
  ["/save", "/save-contacts"],
  auth,
  uploadWithMulter,
  async (req, res) => {
    let { contacts: contactsJson, source } = req.body;
    const files = {
      profileImage: req.files?.profileImage || [],
      additionalFiles: req.files?.additionalFiles || [],
    };

    console.log("Received files:", {
      profileImage: files.profileImage.map((f) => ({
        filename: f.filename,
        path: f.path,
      })),
      additionalFiles: files.additionalFiles.map((f) => ({
        filename: f.filename,
        path: f.path,
      })),
    });

    let contacts;
    try {
      if (typeof contactsJson === "string") {
        contacts = JSON.parse(contactsJson);
      } else {
        contacts = contactsJson;
      }
    } catch (err) {
      console.error("Error parsing contacts JSON:", err);
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in contacts data.",
      });
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty contacts data.",
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

      const tableName = `contacts_user_${req.session.userId}`;
      const tableExists = await checkTableExists(tableName);
      if (!tableExists) {
        await createUserContactsTable(req.session.userId);
      }
      await updateUserContactsTableSchema(req.session.userId);
      await createUploadedFilesTable();

      const importantDatesTableExists = await checkTableExists("important_dates");

      const skipped = [];
      let savedCount = 0;
      let importantDatesAdded = 0;
      const savedContacts = [];

      const [existingContacts] = await pool.query(
        `SELECT id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, phone_number3, contact_image FROM ${tableName}`
      );
      const existingNames = new Set(
        existingContacts.map((c) =>
          [c.first_name, c.middle_name, c.last_name].filter(Boolean).join(" ")
        )
      );
      const existingPhoneNumbers = new Set(
        existingContacts
          .flatMap((c) => [
            c.phone_number,
            c.phone_number1,
            c.phone_number2,
            c.phone_number3,
          ])
          .filter((num) => num)
          .map((num) => num.trim())
      );

      let existingImportantDatesSet = new Set();
      if (importantDatesTableExists) {
        const [existingImportantDates] = await pool.query(
          `SELECT contact_name, occasion_type FROM important_dates WHERE user_id = ?`,
          [req.session.userId]
        );
        existingImportantDatesSet = new Set(
          existingImportantDates.map((d) => `${d.contact_name}|${d.occasion_type}`)
        );
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        for (const contact of contacts) {
          const validationError = validateContact(contact);
          if (validationError) {
            skipped.push({
              contact,
              reason: validationError,
            });
            continue;
          }

          const {
            id,
            first_name,
            middle_name,
            last_name,
            company,
            job_type,
            website,
            category,
            relation,
            phone_number,
            phone_number1,
            phone_number2,
            phone_number3,
            email,
            flat_building_no,
            street,
            country,
            state,
            city,
            postal_code,
            date_of_birth,
            anniversary,
            notes,
            contact_image: frontendContactImage,
            release_on_pass,
            is_ambassador,
            is_nominee,
          } = contact;

          const name = [first_name, middle_name, last_name]
            .filter(Boolean)
            .join(" ");
          const newPhoneNumbers = [
            phone_number,
            phone_number1,
            phone_number2,
            phone_number3,
          ]
            .filter((num) => num && typeof num === "string" && num.trim() !== "")
            .map((num) => num.trim());

          if (newPhoneNumbers.length === 0) {
            skipped.push({
              contact,
              reason: "No valid phone numbers provided",
            });
            continue;
          }

          if (source !== "custom") {
            const duplicatePhone = newPhoneNumbers.find((num) =>
              existingPhoneNumbers.has(num)
            );
            if (duplicatePhone) {
              skipped.push({
                contact,
                reason: `Phone number '${duplicatePhone}' already exists`,
              });
              continue;
            }

            if (existingNames.has(name)) {
              skipped.push({
                contact,
                reason: `Contact name '${name}' already exists`,
              });
              continue;
            }
          }

          let contactId = id;
          let contactImagePath = "";
          const uploadedFiles = [];

          // Handle profile image
          if (files.profileImage.length > 0) {
            const profileImage = files.profileImage[0];
            contactImagePath = `/Uploads/contact_image-${req.session.userId}/${profileImage.filename}`;
            if (contactImagePath.length > 255) {
              throw new Error("Profile image path exceeds 255 characters");
            }
            console.log(`Profile image path for contact ${name}:`, contactImagePath);
          } else if (id) {
            const [existing] = await connection.query(
              `SELECT contact_image FROM ${tableName} WHERE id = ? AND user_id = ?`,
              [id, req.session.userId]
            );
            if (existing.length > 0 && existing[0].contact_image) {
              contactImagePath = existing[0].contact_image;
            }
          }

          // Track temporary files
          const tempFiles = files.additionalFiles.map((file) => ({
            originalPath: file.path,
            filename: file.filename,
            originalname: file.originalname,
          }));

          try {
            if (id) {
              const [existing] = await connection.query(
                `SELECT id, contact_image FROM ${tableName} WHERE id = ? AND user_id = ?`,
                [id, req.session.userId]
              );
              if (existing.length > 0) {
                if (files.profileImage.length > 0 && existing[0].contact_image) {
                  const oldImagePath = path.join(
                    __dirname,
                    "..",
                    existing[0].contact_image
                  );
                  try {
                    await fs.unlink(oldImagePath);
                    console.log(`Deleted old profile image: ${oldImagePath}`);
                  } catch (unlinkErr) {
                    console.error(
                      `Error deleting old profile image ${oldImagePath}:`,
                      unlinkErr
                    );
                  }
                }
                await connection.query(
                  `UPDATE ${tableName} SET first_name = ?, middle_name = ?, last_name = ?, company = ?, job_type = ?, website = ?, category = ?, relation = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, phone_number3 = ?, email = ?, flat_building_no = ?, street = ?, country = ?, state = ?, city = ?, postal_code = ?, date_of_birth = ?, anniversary = ?, notes = ?, contact_image = ?, release_on_pass = ?, is_ambassador = ?, is_nominee = ? WHERE id = ?`,
                  [
                    first_name || "",
                    middle_name || "",
                    last_name || "",
                    company || "",
                    job_type || "",
                    website || "",
                    category || "",
                    relation || "",
                    phone_number || "",
                    phone_number1 || "",
                    phone_number2 || "",
                    phone_number3 || "",
                    email || null,
                    flat_building_no || "",
                    street || "",
                    country || "",
                    state || "",
                    city || "",
                    postal_code || "",
                    date_of_birth || "",
                    anniversary || "",
                    notes || null,
                    contactImagePath,
                    release_on_pass || false,
                    is_ambassador || false,
                    is_nominee || false,
                    id,
                  ]
                );
                savedCount++;
                console.log(
                  `Updated contact ${id} with image: ${contactImagePath}`
                );
              } else {
                skipped.push({ contact, reason: "Contact ID not found" });
                continue;
              }
            } else {
              const [result] = await connection.query(
                `INSERT INTO ${tableName} (user_id, first_name, middle_name, last_name, company, job_type, website, category, relation, phone_number, phone_number1, phone_number2, phone_number3, email, flat_building_no, street, country, state, city, postal_code, date_of_birth, anniversary, notes, contact_image, release_on_pass, is_ambassador, is_nominee)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  req.session.userId,
                  first_name || "",
                  middle_name || "",
                  last_name || "",
                  company || "",
                  job_type || "",
                  website || "",
                  category || "",
                  relation || "",
                  phone_number || "",
                  phone_number1 || "",
                  phone_number2 || "",
                  phone_number3 || "",
                  email || null,
                  flat_building_no || "",
                  street || "",
                  country || "",
                  state || "",
                  city || "",
                  postal_code || "",
                  date_of_birth || "",
                  anniversary || "",
                  notes || null,
                  contactImagePath,
                  release_on_pass || false,
                  is_ambassador || false,
                  is_nominee || false,
                ]
              );
              contactId = result.insertId;
              savedCount++;
              console.log(
                `Inserted contact ${contactId} with image: ${contactImagePath}`
              );
            }

            // Handle additional file uploads
            if (tempFiles.length > 0) {
              const finalDir = path.join(
                "Uploads",
                "send_file",
                `${req.session.userId}`,
                `${contactId}`
              );
              await fs.mkdir(finalDir, { recursive: true });

              for (const tempFile of tempFiles) {
                const finalPath = path.join(finalDir, tempFile.filename);
                await fs.rename(tempFile.originalPath, finalPath);
                const filePath = `/Uploads/send_file/${req.session.userId}/${contactId}/${tempFile.filename}`;
                if (filePath.length > 255) {
                  throw new Error(
                    `File path ${filePath} exceeds 255 characters`
                  );
                }
                const [result] = await connection.query(
                  `INSERT INTO uploaded_files (user_id, contact_id, file_path, file_name)
                   VALUES (?, ?, ?, ?)`,
                  [
                    req.session.userId,
                    contactId,
                    filePath,
                    tempFile.originalname,
                  ]
                );
                uploadedFiles.push({
                  id: result.insertId,
                  file_path: filePath,
                  file_name: tempFile.originalname,
                });
                console.log(
                  `Saved file for contact ${contactId}: ${filePath}`
                );
              }
            }

            existingNames.add(name);
            newPhoneNumbers.forEach((num) => existingPhoneNumbers.add(num));

            // Handle important dates
            if (importantDatesTableExists) {
              const occasions = [];
              if (date_of_birth && date_of_birth !== "") {
                occasions.push({ type: "Birthday", date: date_of_birth });
              }
              if (anniversary && anniversary !== "") {
                occasions.push({ type: "Anniversary", date: anniversary });
              }

              for (const occasion of occasions) {
                const uniqueKey = `${name}|${occasion.type}`;
                if (!existingImportantDatesSet.has(uniqueKey)) {
                  await connection.query(
                    `INSERT INTO important_dates (
                      user_id, occasion_type, occasion_date, get_reminded, contact_name,
                      phone_number, phone_number1, phone_number2, phone_number3
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      req.session.userId,
                      occasion.type,
                      occasion.date,
                      "Yes",
                      name,
                      phone_number || null,
                      phone_number1 || null,
                      phone_number2 || null,
                      phone_number3 || null,
                    ]
                  );
                  existingImportantDatesSet.add(uniqueKey);
                  importantDatesAdded++;
                } else if (id) {
                  // Update existing important dates if contact is being updated
                  await connection.query(
                    `UPDATE important_dates SET
                      occasion_date = ?,
                      phone_number = ?,
                      phone_number1 = ?,
                      phone_number2 = ?,
                      phone_number3 = ?
                    WHERE user_id = ? AND contact_name = ? AND occasion_type = ?`,
                    [
                      occasion.date,
                      phone_number || null,
                      phone_number1 || null,
                      phone_number2 || null,
                      phone_number3 || null,
                      req.session.userId,
                      name,
                      occasion.type,
                    ]
                  );
                }
              }
            }

            savedContacts.push({
              id: contactId,
              ...contact,
              contact_image: contactImagePath,
              uploaded_files: uploadedFiles,
            });
          } catch (err) {
            console.error(`Error processing contact ${name}:`, err);
            skipped.push({
              contact,
              reason: `Failed to save contact: ${err.message}`,
            });
            // Clean up files for this contact
            if (files.profileImage.length > 0) {
              const profileImagePath = path.join(
                __dirname,
                "..",
                `/Uploads/contact_image-${req.session.userId}/${files.profileImage[0].filename}`
              );
              try {
                await fs.unlink(profileImagePath);
              } catch (unlinkErr) {
                console.error(
                  `Error cleaning up profile image ${profileImagePath}:`,
                  unlinkErr
                );
              }
            }
            for (const tempFile of tempFiles) {
              try {
                await fs.unlink(tempFile.originalPath);
              } catch (unlinkErr) {
                console.error(
                  `Error cleaning up temp file ${tempFile.originalPath}:`,
                  unlinkErr
                );
              }
            }
            continue;
          }
        }

        await connection.commit();
        connection.release();

        res.json({
          success: true,
          message: `${savedCount} contacts saved/updated, ${importantDatesAdded} important dates added.`,
          contacts: savedContacts,
          skipped,
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        // Clean up all files on transaction failure
        if (files.profileImage.length > 0) {
          const profileImagePath = path.join(
            __dirname,
            "..",
            `/Uploads/contact_image-${req.session.userId}/${files.profileImage[0].filename}`
          );
          try {
            await fs.unlink(profileImagePath);
          } catch (unlinkErr) {
            console.error(
              `Error cleaning up profile image ${profileImagePath}:`,
              unlinkErr
            );
          }
        }
        for (const file of files.additionalFiles) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkErr) {
            console.error(
              `Error cleaning up temp file ${file.path}:`,
              unlinkErr
            );
          }
        }
        throw err;
      }
    } catch (err) {
      console.error("Error saving contacts:", err);
      res.status(500).json({
        success: false,
        message: `Server error: ${err.message}`,
      });
    }
  }
);

// POST /api/contacts/upload
router.post("/upload", auth, uploadWithMulter, async (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({
      success: false,
      message: "Contact ID is required.",
    });
  }

  try {
    const tableName = `contacts_user_${req.session.userId}`;
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: "Contact table not found.",
      });
    }

    const [existingContact] = await pool.query(
      `SELECT id FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [contactId, req.session.userId]
    );
    if (existingContact.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }

    const files = req.files?.additionalFiles || [];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const uploadedFiles = [];
      for (const file of files) {
        const finalDir = path.join(
          "Uploads",
          "send_file",
          `${req.session.userId}`,
          `${contactId}`
        );
        await fs.mkdir(finalDir, { recursive: true });
        const finalPath = path.join(finalDir, file.filename);
        await fs.rename(file.path, finalPath);
        const filePath = `/Uploads/send_file/${req.session.userId}/${contactId}/${file.filename}`;
        if (filePath.length > 255) {
          throw new Error(`File path ${filePath} exceeds 255 characters`);
        }
        const [result] = await connection.query(
          `INSERT INTO uploaded_files (user_id, contact_id, file_path, file_name)
           VALUES (?, ?, ?, ?)`,
          [req.session.userId, contactId, filePath, file.originalname]
        );
        uploadedFiles.push({
          id: result.insertId,
          file_path: filePath,
          file_name: file.originalname,
          contact_id: contactId,
        });
        console.log(`Uploaded file for contact ${contactId}: ${filePath}`);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: `Files uploaded successfully.`,
        contact_id: contactId,
        uploaded_files: uploadedFiles,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkErr) {
          console.error(`Error cleaning up file ${file.path}:`, unlinkErr);
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("Error uploading files:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// GET /api/contacts
router.get("/", checkAuth, async (req, res) => {
  try {
    const userId = parseInt(req.session.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const tableName = `contacts_user_${userId}`;
    await createUserContactsTable(userId);

    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      return res.json({ success: true, contacts: [], total: 0, totalPages: 0 });
    }

    // Get query parameters
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let offset = (page - 1) * limit;
    const filter = req.query.filter || "ALL";
    const search = req.query.search || "";

    // Determine if full fetch
    const noPagination = !req.query.page && !req.query.limit && filter === "ALL" && !search;
    if (noPagination) {
      limit = null;
      offset = null;
    }

    let whereClause = "";
    let queryParams = [];

    // Apply filter
    if (filter !== "ALL") {
      if (filter === "Ambassador") {
        whereClause += " WHERE is_ambassador = ?";
        queryParams.push(1);
      } else if (filter === "Nominee") {
        whereClause += " WHERE is_nominee = ?";
        queryParams.push(1);
      } else if (["Friends", "Work"].includes(filter)) {
        whereClause += " WHERE category = ?";
        queryParams.push(filter);
      } else if (filter === "Family") {
        whereClause += " WHERE category LIKE ?";
        queryParams.push("%Family%");
      }
    }

    // Apply search
    if (search) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += " first_name LIKE ? OR middle_name LIKE ? OR last_name LIKE ?";
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count for pagination
    let total = 0;
    if (!noPagination) {
      const [[result]] = await pool.query(
        `SELECT COUNT(*) AS total FROM ${tableName}${whereClause}`,
        queryParams
      );
      total = result.total;
    }

    // Fetch contacts with all fields
    const contactsQuery = `
      SELECT id, user_id, first_name, middle_name, last_name, company, job_type, website,
             category, relation, phone_number, phone_number1, phone_number2, phone_number3,
             email, flat_building_no, street, country, state, city, postal_code,
             date_of_birth, anniversary, notes, contact_image, release_on_pass,
             is_ambassador, is_nominee, created_at
      FROM ${tableName}
      ${whereClause}
      ORDER BY first_name ASC
      ${!noPagination ? 'LIMIT ? OFFSET ?' : ''}
    `;
    const queryValues = !noPagination ? [...queryParams, limit, offset] : queryParams;

    const [contacts] = await pool.query(contactsQuery, queryValues);

    // Fetch uploaded files
    const [uploadedFiles] = await pool.query(
      `SELECT id, contact_id, file_path, file_name FROM uploaded_files WHERE user_id = ?`,
      [userId]
    );

    const filesByContactId = uploadedFiles.reduce((acc, file) => {
      acc[file.contact_id] = acc[file.contact_id] || [];
      acc[file.contact_id].push({
        id: file.id,
        file_path: file.file_path,
        file_name: file.file_name,
      });
      return acc;
    }, {});

    // Parse and enrich contacts
    const parsedContacts = contacts.map((contact) => {
      const name = [contact.first_name, contact.middle_name, contact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      const categoryParts = [];
      if (contact.is_ambassador) categoryParts.push("Ambassador");
      if (contact.is_nominee) categoryParts.push("Nominee");
      if (contact.category) categoryParts.push(contact.category);
      if (contact.relation) categoryParts.push(contact.relation);
      const categoryDisplay = categoryParts.join("/");

      return {
        id: contact.id,
        user_id: contact.user_id,
        name,
        first_name: contact.first_name,
        middle_name: contact.middle_name || "",
        last_name: contact.last_name || "",
        company: contact.company || "",
        job_type: contact.job_type || "",
        website: contact.website || "",
        category: contact.category || "",
        relation: contact.relation || "",
        phone_number: contact.phone_number || "",
        phone_number1: contact.phone_number1 || "",
        phone_number2: contact.phone_number2 || "",
        phone_number3: contact.phone_number3 || "",
        email: contact.email || "",
        flat_building_no: contact.flat_building_no || "",
        street: contact.street || "",
        country: contact.country || "",
        state: contact.state || "",
        city: contact.city || "",
        postal_code: contact.postal_code || "",
        date_of_birth: contact.date_of_birth || "",
        anniversary: contact.anniversary || "",
        notes: contact.notes || "",
        contact_image: contact.contact_image || "",
        release_on_pass: contact.release_on_pass || false,
        is_ambassador: contact.is_ambassador || false,
        is_nominee: contact.is_nominee || false,
        created_at: contact.created_at,
        uploaded_files: filesByContactId[contact.id] || [],
      };
    });

    res.json({
      success: true,
      contacts: parsedContacts,
      total: noPagination ? parsedContacts.length : total,
      totalPages: noPagination ? 1 : Math.ceil(total / limit),
      currentPage: noPagination ? 1 : page,
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// DELETE /api/contacts/:id
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const tableName = `contacts_user_${req.session.userId}`;

  try {
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: "Contact table not found.",
      });
    }

    const [existingContact] = await pool.query(
      `SELECT id, contact_image, phone_number, phone_number1, phone_number2, phone_number3 FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (existingContact.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [files] = await connection.query(
        `SELECT file_path FROM uploaded_files WHERE user_id = ? AND contact_id = ?`,
        [req.session.userId, id]
      );

      await connection.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

      await connection.query(
        `DELETE FROM uploaded_files WHERE user_id = ? AND contact_id = ?`,
        [req.session.userId, id]
      );

      if (existingContact[0].contact_image) {
        const imagePath = path.join(
          __dirname,
          "..",
          existingContact[0].contact_image
        );
        try {
          await fs.unlink(imagePath);
          console.log(`Deleted profile image: ${imagePath}`);
        } catch (unlinkErr) {
          console.error(`Error deleting profile image ${imagePath}:`, unlinkErr);
        }
      }

      for (const file of files) {
        const filePath = path.join(__dirname, "..", file.file_path);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (unlinkErr) {
          console.error(`Error deleting file ${filePath}:`, unlinkErr);
        }
      }

      const importantDatesTableExists = await checkTableExists("important_dates");
      if (importantDatesTableExists) {
        await connection.query(
          `DELETE FROM important_dates WHERE user_id = ? AND (phone_number IN (?, ?, ?, ?) OR phone_number1 IN (?, ?, ?, ?) OR phone_number2 IN (?, ?, ?, ?) OR phone_number3 IN (?, ?, ?, ?))`,
          [
            req.session.userId,
            existingContact[0].phone_number || "",
            existingContact[0].phone_number1 || "",
            existingContact[0].phone_number2 || "",
            existingContact[0].phone_number3 || "",
            existingContact[0].phone_number || "",
            existingContact[0].phone_number1 || "",
            existingContact[0].phone_number2 || "",
            existingContact[0].phone_number3 || "",
            existingContact[0].phone_number || "",
            existingContact[0].phone_number1 || "",
            existingContact[0].phone_number2 || "",
            existingContact[0].phone_number3 || "",
            existingContact[0].phone_number || "",
            existingContact[0].phone_number1 || "",
            existingContact[0].phone_number2 || "",
            existingContact[0].phone_number3 || "",
          ]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Contact and associated files deleted successfully.",
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// DELETE /api/contacts/files/:fileId
router.delete("/files/:fileId", auth, async (req, res) => {
  const { fileId } = req.params;

  try {
    const [file] = await pool.query(
      `SELECT id, file_path, contact_id FROM uploaded_files WHERE id = ? AND user_id = ?`,
      [fileId, req.session.userId]
    );

    if (file.length === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    const filePath = path.join(__dirname, "..", file[0].file_path);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `DELETE FROM uploaded_files WHERE id = ? AND user_id = ?`,
        [fileId, req.session.userId]
      );

      try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (unlinkErr) {
        console.error(`Error deleting file ${filePath}:`, unlinkErr);
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "File deleted successfully.",
        file_id: fileId,
        contact_id: file[0].contact_id,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
});

// POST /api/contacts/categorize-contacts
router.post("/categorize-contacts", auth, async (req, res) => {
  const { contactIds, category, relation, isAmbassador, isNominee } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or empty contact IDs." });
  }

  if (!category || typeof category !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category specified." });
  }

  if (category === "Family" && (!relation || typeof relation !== "string")) {
    return res.status(400).json({
      success: false,
      message: "Relation is required for Family category.",
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

    const tableName = `contacts_user_${req.session.userId}`;
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: "Contact table not found.",
      });
    }

    // Check Nominee and Ambassador limits
    const [nomineeContacts] = await pool.query(
      `SELECT id FROM ${tableName} WHERE is_nominee = TRUE`
    );
    const [ambassadorContacts] = await pool.query(
      `SELECT id FROM ${tableName} WHERE is_ambassador = TRUE`
    );

    const newNomineeCount = contactIds.filter((id) => isNominee).length;
    const newAmbassadorCount = contactIds.filter((id) => isAmbassador).length;

    if (isNominee && nomineeContacts.length + newNomineeCount > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot have more than 5 Nominees." });
    }
    if (isAmbassador && ambassadorContacts.length + newAmbassadorCount > 2) {
      return res.status(400).json({
        success: false,
        message: "Cannot have more than 2 Ambassadors.",
      });
    }

    const [contacts] = await pool.query(
      `SELECT id, first_name, middle_name, last_name, phone_number, phone_number1, phone_number2, phone_number3, email, is_ambassador, is_nominee, contact_image FROM ${tableName} WHERE id IN (${contactIds
        .map(() => "?")
        .join(",")})`,
      contactIds
    );

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const contact of contacts) {
        const phoneNumbers = [
          contact.phone_number,
          contact.phone_number1,
          contact.phone_number2,
          contact.phone_number3,
        ].filter((num) => num);

        // Remove from nominees/ambassadors tables if isNominee/isAmbassador is false
        if (contact.is_nominee && !isNominee) {
          await connection.query(
            `DELETE FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
            [
              req.session.userId,
              contact.email || null,
              phoneNumbers,
              phoneNumbers,
              phoneNumbers,
            ]
          );
        }
        if (contact.is_ambassador && !isAmbassador) {
          await connection.query(
            `DELETE FROM ambassadors WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
            [
              req.session.userId,
              contact.email || null,
              phoneNumbers,
              phoneNumbers,
              phoneNumbers,
            ]
          );
        }

        if (isNominee) {
          const existingQuery = `
            SELECT id FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))
          `;
          const [existingNominee] = await connection.query(existingQuery, [
            req.session.userId,
            contact.email || null,
            phoneNumbers,
            phoneNumbers,
            phoneNumbers,
          ]);
          if (existingNominee.length === 0) {
            await connection.query(
              `INSERT INTO nominees (user_id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, relationship, category, nominee_type, profile_image)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                req.session.userId,
                contact.first_name,
                contact.middle_name || "",
                contact.last_name || "",
                contact.email || "",
                phoneNumbers[0] || "",
                phoneNumbers[1] || "",
                phoneNumbers[2] || "",
                relation || "",
                category,
                "",
                contact.contact_image || null,
              ]
            );
          }
        }
        if (isAmbassador) {
          const existingQuery = `
            SELECT id FROM ambassadors WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))
          `;
          const [existingAmbassador] = await connection.query(existingQuery, [
            req.session.userId,
            contact.email || null,
            phoneNumbers,
            phoneNumbers,
            phoneNumbers,
          ]);
          if (existingAmbassador.length === 0) {
            await connection.query(
              `INSERT INTO ambassadors (user_id, first_name, middle_name, last_name, email, phone_number, phone_number1, phone_number2, relationship, category, ambassador_type, profile_image)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                req.session.userId,
                contact.first_name,
                contact.middle_name || "",
                contact.last_name || "",
                contact.email || "",
                phoneNumbers[0] || "",
                phoneNumbers[1] || "",
                phoneNumbers[2] || "",
                relation || "",
                category,
                "",
                contact.contact_image || null,
              ]
            );
          }
        }
      }

      // Update contacts table with new category, relation, isAmbassador, and isNominee
      await connection.query(
        `UPDATE ${tableName} SET category = ?, relation = ?, is_ambassador = ?, is_nominee = ? WHERE id IN (${contactIds
          .map(() => "?")
          .join(",")})`,
        [
          category,
          relation || "",
          isAmbassador,
          isNominee,
          ...contactIds,
        ]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: `Successfully categorized ${contactIds.length} contacts.`,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error categorizing contacts:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;