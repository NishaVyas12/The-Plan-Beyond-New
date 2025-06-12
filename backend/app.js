const dotenv = require("dotenv");
const express = require("express");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passwordValidator = require("password-validator");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");
dotenv.config();

if (!process.env.FRONTEND_URL) {
  console.error("Error: FRONTEND_URL is not defined in the .env file");
  process.exit(1);
}

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: "4abb9ebc8ad8a34bc118ef1856571ea209a6d90c00052f2a1353a6b4f6707065",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/documents", express.static(path.join(__dirname, "documents")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "plan_beyond",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// WebAuthn configuration
const rpName = "The Plan Beyond";
const rpID = "localhost";
const origin = `http://localhost:5173`

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "images", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "photos", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const imageUpload = multer({
  imageStorage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "documents", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let baseName = path.basename(file.originalname, ext);
    let filename = file.originalname;
    const uploadPath = path.join(
      __dirname,
      "documents",
      req.session.userId.toString()
    );

    let counter = 0;
    while (fs.existsSync(path.join(uploadPath, filename))) {
      counter++;
      filename = `${baseName}_${counter}${ext}`;
    }

    cb(null, filename);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "image/gif",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, PDF, or GIF allowed."));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "videos", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let baseName = path.basename(file.originalname, ext);
    let filename = file.originalname;
    const uploadPath = path.join(
      __dirname,
      "videos",
      req.session.userId.toString()
    );

    let counter = 0;
    while (fs.existsSync(path.join(uploadPath, filename))) {
      counter++;
      filename = `${baseName}-${counter}${ext}`;
    }

    cb(null, filename);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/mpeg",
      "video/quicktime",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."));
    }
  },
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

app.use("/videos", express.static(path.join(__dirname, "videos")));

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "audios", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let baseName = path.basename(file.originalname, ext);
    let filename = file.originalname;
    const uploadPath = path.join(
      __dirname,
      "audios",
      req.session.userId.toString()
    );

    let counter = 0;
    while (fs.existsSync(path.join(uploadPath, filename))) {
      counter++;
      filename = `${baseName}-${counter}${ext}`;
    }

    cb(null, filename);
  },
});

const audioUpload = multer({
  storage: audioStorage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

app.use("/audios", express.static(path.join(__dirname, "audios")));

const passwordSchema = new passwordValidator();
passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols(1)
  .has()
  .not()
  .spaces();

const passwordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password-related attempts, please try again later.",
  },
});
app.use("/api/forgot-password", passwordRateLimiter);
app.use("/api/reset-password", passwordRateLimiter);
app.use("/api/change-password", passwordRateLimiter);

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      otp VARCHAR(6),
      is_verified BOOLEAN DEFAULT FALSE,
      ambassador_accept BOOLEAN DEFAULT FALSE,
      biometric_credential_id VARCHAR(255),
      biometric_public_key TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

createUsersTable().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Error creating users table:", err);
  process.exit(1);
});

const checkColumnExists = async (tableName, columnName) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0].count > 0;
};

// Check if a foreign key constraint exists
const checkConstraintExists = async (constraintName) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_NAME = ? AND TABLE_NAME = 'users'`,
    [constraintName]
  );
  return rows[0].count > 0;
};

// ALTER TABLE to add new columns to users table idempotently
const alterUsersTable = async () => {
  try {
    // Check and add ambassador_id column
    if (!(await checkColumnExists("users", "ambassador_id"))) {
      await pool.query(`ALTER TABLE users ADD COLUMN ambassador_id INT NULL`);
      console.log("Added ambassador_id column to users table.");
    }

    // Check and add ambassador_user_id column
    if (!(await checkColumnExists("users", "ambassador_user_id"))) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN ambassador_user_id INT NULL`
      );
      console.log("Added ambassador_user_id column to users table.");
    }

    // Check and add ambassador_accept column
    if (!(await checkColumnExists("users", "ambassador_accept"))) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN ambassador_accept BOOLEAN DEFAULT FALSE`
      );
      console.log("Added ambassador_accept column to users table.");
    }

    // Check and add foreign key constraint for ambassador_id
    if (!(await checkConstraintExists("fk_ambassador_id"))) {
      try {
        await pool.query(
          `ALTER TABLE users
           ADD CONSTRAINT fk_ambassador_id
           FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON DELETE SET NULL`
        );
        console.log("Added fk_ambassador_id constraint to users table.");
      } catch (err) {
        console.warn(
          "Could not add fk_ambassador_id constraint (possibly non-InnoDB table or missing ambassadors table):",
          err.message
        );
      }
    }

    // Check and add foreign key constraint for ambassador_user_id
    if (!(await checkConstraintExists("fk_ambassador_user_id"))) {
      try {
        await pool.query(
          `ALTER TABLE users
           ADD CONSTRAINT fk_ambassador_user_id
           FOREIGN KEY (ambassador_user_id) REFERENCES users(id) ON DELETE SET NULL`
        );
        console.log("Added fk_ambassador_user_id constraint to users table.");
      } catch (err) {
        console.warn(
          "Could not add fk_ambassador_user_id constraint:",
          err.message
        );
      }
    }
  } catch (err) {
    console.error("Error altering users table:", err);
    throw err;
  }
};

const createProfileTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS profile (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      first_name VARCHAR(255),
      middle_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255),
      phone_number VARCHAR(20),
      phone_verified BOOLEAN DEFAULT FALSE,
      date_of_birth DATE,
      gender VARCHAR(50),
      address_line_1 VARCHAR(255),
      address_line_2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100),
      profile_image VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

const createUserContactsTable = async (userId) => {
  const tableName = `contacts_user_${userId}`;
  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      email VARCHAR(255),
      date_of_birth VARCHAR(10) DEFAULT '',
      anniversary VARCHAR(10) DEFAULT '',
      address TEXT,
      category VARCHAR(50) DEFAULT '',
      relation VARCHAR(50) DEFAULT '',
      isAmbassador BOOLEAN DEFAULT FALSE,
      isNominee BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

const createNomineesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS nominees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      contact TEXT NOT NULL, -- Updated from VARCHAR(255) to TEXT
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      relationship VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      nominee_type ENUM('Primary', 'Secondary', '') NOT NULL DEFAULT '',
      profile_image VARCHAR(1000), -- Added profile_image column
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

const createAmbassadorsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ambassadors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      contact TEXT NOT NULL, -- Updated from VARCHAR(255) to TEXT
      first_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      relationship VARCHAR(100) NOT NULL,
      ambassador_type ENUM('Primary', 'Secondary', '') NOT NULL DEFAULT '',
      profile_image VARCHAR(1000), -- Added profile_image column
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

const updateUserContactsTableSchema = async (userId) => {
  const tableName = `contacts_user_${userId}`;
  const checkColumnsQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? 
    AND COLUMN_NAME IN ('category', 'phone_numbers', 'source', 'date_of_birth', 'anniversary', 'address') 
    AND TABLE_SCHEMA = ?
  `;
  try {
    const [columns] = await pool.query(checkColumnsQuery, [
      tableName,
      process.env.DB_NAME || "plan_beyond",
    ]);

    const columnNames = columns.map((col) => col.COLUMN_NAME);

    if (!columnNames.includes("category")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN category VARCHAR(50) DEFAULT '' AFTER email`
      );
    }

    if (!columnNames.includes("date_of_birth")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN date_of_birth VARCHAR(10) DEFAULT '' AFTER email`
      );
    }

    if (!columnNames.includes("anniversary")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN anniversary VARCHAR(10) DEFAULT '' AFTER date_of_birth`
      );
    }

    if (!columnNames.includes("address")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN address TEXT AFTER anniversary`
      );
    }

    if (columnNames.includes("source")) {
      await pool.query(`ALTER TABLE ${tableName} DROP COLUMN source`);
    }

    if (columnNames.includes("phone_numbers")) {
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN phone_number VARCHAR(20) NOT NULL DEFAULT '' AFTER name`
      );
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN phone_number1 VARCHAR(20) DEFAULT '' AFTER phone_number`
      );
      await pool.query(
        `ALTER TABLE ${tableName} ADD COLUMN phone_number2 VARCHAR(20) DEFAULT '' AFTER phone_number1`
      );

      const [contacts] = await pool.query(
        `SELECT id, phone_numbers FROM ${tableName}`
      );
      for (const contact of contacts) {
        let phoneNumbers = [];
        try {
          phoneNumbers = JSON.parse(contact.phone_numbers);
          if (!Array.isArray(phoneNumbers)) phoneNumbers = [];
        } catch {
          phoneNumbers = [];
        }
        await pool.query(
          `UPDATE ${tableName} SET phone_number = ?, phone_number1 = ?, phone_number2 = ? WHERE id = ?`,
          [
            phoneNumbers[0] || "",
            phoneNumbers[1] || "",
            phoneNumbers[2] || "",
            contact.id,
          ]
        );
      }
      await pool.query(`ALTER TABLE ${tableName} DROP COLUMN phone_numbers`);
    }
  } catch (err) {
    throw err;
  }
};

const updateSpecialTablesSchema = async () => {
  const tables = ["nominees", "ambassadors"];
  const typeFields = {
    nominees: "nominee_type",
    ambassadors: "ambassador_type",
  };

  for (const tableName of tables) {
    const checkColumnsQuery = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = ? 
      AND COLUMN_NAME IN ('phone', 'phone_number', 'phone_number1', 'phone_number2', 'category', 'relation', 'relationship') 
      AND TABLE_SCHEMA = ?
    `;
    try {
      const [columns] = await pool.query(checkColumnsQuery, [
        tableName,
        process.env.DB_NAME || "plan_beyond",
      ]);

      const columnNames = columns.map((col) => col.COLUMN_NAME);
      if (
        columnNames.includes("phone") &&
        !columnNames.includes("phone_number")
      ) {
        await pool.query(
          `ALTER TABLE ${tableName} CHANGE phone phone_number VARCHAR(20) NOT NULL`
        );
      }
      if (!columnNames.includes("phone_number1")) {
        await pool.query(
          `ALTER TABLE ${tableName} ADD COLUMN phone_number1 VARCHAR(20) DEFAULT '' AFTER phone_number`
        );
      }
      if (!columnNames.includes("phone_number2")) {
        await pool.query(
          `ALTER TABLE ${tableName} ADD COLUMN phone_number2 VARCHAR(20) DEFAULT '' AFTER phone_number1`
        );
      }
      if (!columnNames.includes("category")) {
        await pool.query(
          `ALTER TABLE ${tableName} ADD COLUMN category VARCHAR(50) DEFAULT '' AFTER phone_number2`
        );
      }
      if (columnNames.includes("relationship")) {
        await pool.query(
          `ALTER TABLE ${tableName} CHANGE relationship relation VARCHAR(50) DEFAULT ''`
        );
      } else if (!columnNames.includes("relation")) {
        await pool.query(
          `ALTER TABLE ${tableName} ADD COLUMN relation VARCHAR(50) DEFAULT '' AFTER category`
        );
      }
      if (
        tableName === "ambassadors" &&
        !(await checkColumnExists("ambassadors", "ambassador_accept"))
      ) {
        await pool.query(
          `ALTER TABLE ambassadors ADD COLUMN ambassador_accept BOOLEAN DEFAULT FALSE`
        );
        console.log("Added ambassador_accept column to ambassadors table.");
      }
    } catch (err) {
      throw err;
    }
  }
};

const createUserPopupResponsesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_popup_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      responses JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY unique_user (user_id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    throw err;
  }
};

const checkTableExists = async (tableName) => {
  const query = `
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = ? AND table_name = ?
  `;
  try {
    const [rows] = await pool.query(query, [
      process.env.DB_NAME || "plan_beyond",
      tableName,
    ]);
    return rows[0].count > 0;
  } catch (err) {
    console.error(`Error checking existence of table ${tableName}:`, err);
    throw err;
  }
};

const ensureProfileTableSchema = async () => {
  const checks = [
    {
      column: "email",
      query: `ALTER TABLE profile ADD COLUMN email VARCHAR(255) AFTER last_name`,
    },
    {
      column: "profile_image",
      query: `ALTER TABLE profile ADD COLUMN profile_image VARCHAR(255) AFTER country`,
    },
    {
      column: "date_of_birth",
      query: `ALTER TABLE profile MODIFY COLUMN date_of_birth DATE`,
    },
    {
      column: "middle_name",
      query: `ALTER TABLE profile ADD COLUMN middle_name VARCHAR(255) AFTER first_name`,
    },
    {
      column: "phone_verified",
      query: `ALTER TABLE profile ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE AFTER phone_number`,
    },
  ];

  for (const check of checks) {
    const checkColumn = `
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'profile' 
      AND COLUMN_NAME = ? 
      AND TABLE_SCHEMA = ?
    `;
    try {
      const [columns] = await pool.query(checkColumn, [
        check.column,
        process.env.DB_NAME || "plan_beyond",
      ]);
      if (columns.length === 0 && check.column !== "date_of_birth") {
        await pool.query(check.query);
      } else if (
        check.column === "date_of_birth" &&
        columns.length > 0 &&
        columns[0].DATA_TYPE !== "date"
      ) {
        await pool.query(check.query);
      }
    } catch (err) {
      throw err;
    }
  }
};

const createVideoMessageTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS video_message (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_path VARCHAR(255) NOT NULL,
      notes TEXT,
      delivery_date DATE,
      contact1 VARCHAR(255),
      contact_name1 VARCHAR(255),
      contact2 VARCHAR(255),
      contact_name2 VARCHAR(255),
      contact3 VARCHAR(255),
      contact_name3 VARCHAR(255),
      contact4 VARCHAR(255),
      contact_name4 VARCHAR(255),
      contact5 VARCHAR(255),
      contact_name5 VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
    console.log("video_message table created or already exists.");
  } catch (err) {
    console.error("Error creating video_message table:", err);
    throw err;
  }
};

const createImageUploadTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS image_message (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      image_path VARCHAR(255) NOT NULL,
      notes TEXT,
      delivery_date DATE,
      contact1 VARCHAR(255),
      contact_name1 VARCHAR(255),
      contact2 VARCHAR(255),
      contact_name2 VARCHAR(255),
      contact3 VARCHAR(255),
      contact_name3 VARCHAR(255),
      contact4 VARCHAR(255),
      contact_name4 VARCHAR(255),
      contact5 VARCHAR(255),
      contact_name5 VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
    console.log("image_message table created or already exists.");
  } catch (err) {
    console.error("Error creating image_message table:", err);
    throw err;
  }
};

const createGovernmentIdTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS government_id (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      number VARCHAR(100),
      location VARCHAR(255),
      file_path VARCHAR(255),
      nominee_contact VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_type (user_id, type)
    )
  `;
  try {
    await pool.query(query);
    console.log("government_id table created or already exists.");
  } catch (err) {
    console.error("Error creating government_id table:", err);
    throw err;
  }
};

const createEmploymentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS employment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      employment_type VARCHAR(50) NOT NULL,
      organisation_name VARCHAR(255),
      nominee_contact VARCHAR(255),
      joining_date VARCHAR(50),
      leaving_date VARCHAR(50),
      hr_contact VARCHAR(255),
      job_type VARCHAR(100),
      full_part VARCHAR(20),
      employee_id VARCHAR(100),
      employment_benefit VARCHAR(100),
      benefit_number VARCHAR(255),
      employment_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("employment table created or already exists.");
  } catch (err) {
    console.error("Error creating employment table:", err);
    throw err;
  }
};

const createReligiousTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS religious (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,  -- Added UNIQUE constraint
      religion VARCHAR(50) NOT NULL,
      nominee_contact VARCHAR(255),
      religion1 VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("religious table created or already exists.");
  } catch (err) {
    console.error("Error creating religious table:", err);
    throw err;
  }
};

const createCharitiesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS charities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      charity_name VARCHAR(255) NOT NULL,
      charity_website VARCHAR(255),
      nominee_contact VARCHAR(255),
      payment_method VARCHAR(100),
      amount DECIMAL(10, 2),
      frequency ENUM('weekly', 'monthly', 'quarterly', 'yearly') DEFAULT NULL,
      enrolled BOOLEAN DEFAULT FALSE,
      charity_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("charities table created or already exists.");
  } catch (err) {
    console.error("Error creating charities table:", err);
    throw err;
  }
};

const createClubsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS clubs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      club VARCHAR(100) NOT NULL,
      club_name VARCHAR(255),
      club_contact VARCHAR(255),
      nominee_contact VARCHAR(255),
      club_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("clubs table created or already exists.");
  } catch (err) {
    console.error("Error creating clubs table:", err);
    throw err;
  }
};

const createDegreesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS degrees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      university_name VARCHAR(255) NOT NULL,
      degree VARCHAR(100) NOT NULL,
      degree_field VARCHAR(255),
      nominee_contact VARCHAR(255),
      degree_start DATE,
      degree_end DATE,
      grade VARCHAR(50),
      activities TEXT,
      degree_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("degrees table created or already exists.");
  } catch (err) {
    console.error("Error creating degrees table:", err);
    throw err;
  }
};

const createMilitaryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS military (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      military_branch VARCHAR(255) NOT NULL,
      military_name VARCHAR(255),
      nominee_contact VARCHAR(255),
      military_rank VARCHAR(255),
      military_serve VARCHAR(255),
      military_location VARCHAR(255),
      military_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("military table created or already exists.");
  } catch (err) {
    console.error("Error creating military table:", err);
    throw err;
  }
};

const createMiscellaneousTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS miscellaneous (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      item VARCHAR(255) NOT NULL,
      description TEXT,
      nominee_contact VARCHAR(255),
      miscellaneous_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("miscellaneous table created or already exists.");
  } catch (err) {
    console.error("Error creating miscellaneous table:", err);
    throw err;
  }
};

const createFeedbackMessagesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS feedback_messages (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("Feedback messages table created or already exists");
  } catch (err) {
    console.error("Error creating feedback table:", err);
    throw err;
  }
};

const createPasswordManagementTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS password_management (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      store_password VARCHAR(50) NOT NULL,
      service_name VARCHAR(255),
      master_password VARCHAR(255),
      payment_method VARCHAR(100),
      amount DECIMAL(10, 2),
      frequency ENUM('weekly', 'monthly', 'quarterly', 'yearly') DEFAULT NULL,
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      password_file VARCHAR(255),
      password_location VARCHAR(255),
      pass_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("password_management table created or already exists.");
  } catch (err) {
    console.error("Error creating password_management table:", err);
    throw err;
  }
};

const createEmailManagementTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS email_management (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      email_service VARCHAR(255),
      email_address VARCHAR(255),
      email_primary TINYINT(1) DEFAULT 0,
      email_paid TINYINT(1) DEFAULT 0,
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled TINYINT(1) DEFAULT 0,
      nominee_contact VARCHAR(255),
      email_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("email_management table created or already exists.");
  } catch (err) {
    console.error("Error creating email_management table:", err);
    throw err;
  }
};

const createDeviceManagementTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS device_management (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      device_name VARCHAR(255),
      device_code VARCHAR(255),
      device_type VARCHAR(255),
      own_or_rent VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled TINYINT(1) DEFAULT 0,
      nominee_contact VARCHAR(255),
      device_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("device_management table created or already exists.");
  } catch (err) {
    console.error("Error creating device_management table:", err);
    throw err;
  }
};

const createWifiManagementTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS wifi_management (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wifi_subscription TINYINT(1) DEFAULT 0,
      user_id INT NOT NULL,
      wifi_network VARCHAR(255),
      wifi_code VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled TINYINT(1) DEFAULT 0,
      wifi_system VARCHAR(255),
      router_code VARCHAR(255),
      wifi_access VARCHAR(255),
      nominee_contact VARCHAR(255),
      wifi_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("wifi_management table created or already exists.");
  } catch (err) {
    console.error("Error creating wifi_management table:", err);
    throw err;
  }
};

const createSocialMediaTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS social_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      social_name VARCHAR(255),
      social_email VARCHAR(255),
      prem_or_paid TINYINT(1) DEFAULT 0,
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      social_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("social_media table created or already exists.");
  } catch (err) {
    console.error("Error creating social_media table:", err);
    throw err;
  }
};

const createShoppingTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS shopping (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      shopping_subscription TINYINT(1) DEFAULT 0,
      shoping_name VARCHAR(255),
      associated VARCHAR(255),
      phone_number VARCHAR(255),
      password VARCHAR(255),
      shoping_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      shoping_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("shopping table created or already exists.");
  } catch (err) {
    console.error("Error creating shopping table:", err);
    throw err;
  }
};

const createVideoStreamingTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS video_streaming (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_name VARCHAR(255),
      video_subscription TINYINT(1) DEFAULT 0,
      video_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      password VARCHAR(255),
      phone_number VARCHAR(255),
      associated VARCHAR(255),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      streaming_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("video_streaming table created or already exists.");
  } catch (err) {
    console.error("Error creating video_streaming table:", err);
    throw err;
  }
};

const createMusicTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS music (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      music_subscription TINYINT(1) DEFAULT 0,
      music_name VARCHAR(255),
      music_email VARCHAR(255),
      payment_method VARCHAR(255),
      password VARCHAR(255),
      phone_number VARCHAR(255),
      associated VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      music_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("music table created or already exists.");
  } catch (err) {
    console.error("Error creating music table:", err);
    throw err;
  }
};

const createGamingTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS gaming (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      gaming_subscription TINYINT(1) DEFAULT 0,
      gaming_name VARCHAR(255),
      gaming_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      password VARCHAR(255),
      phone_number VARCHAR(255),
      associated VARCHAR(255),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      gaming_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("gaming table created or already exists.");
  } catch (err) {
    console.error("Error creating gaming table:", err);
    throw err;
  }
};

const createCloudStorageTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS cloud_storage (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      cloud_name VARCHAR(255),
      cloud_email VARCHAR(255),
      password VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      cloud_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("cloud_storage table created or already exists.");
  } catch (err) {
    console.error("Error creating cloud_storage table:", err);
    throw err;
  }
};

const createBusinessNetworkingTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS business_networking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      business_name VARCHAR(255),
      business_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      business_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("business_networking table created or already exists.");
  } catch (err) {
    console.error("Error creating business_networking table:", err);
    throw err;
  }
};

const createSoftwareAppLicensesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS software_app_licenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      software_name VARCHAR(255),
      software_key VARCHAR(255),
      software_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      software_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("software_app_licenses table created or already exists.");
  } catch (err) {
    console.error("Error creating software_app_licenses table:", err);
    throw err;
  }
};

const createDomainHostingTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS domain_hosting (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      domain_name VARCHAR(255),
      domain_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      domain_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("domain_hosting table created or already exists.");
  } catch (err) {
    console.error("Error creating domain_hosting table:", err);
    throw err;
  }
};

const createOtherSubscriptionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS other_subscription (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subscription_name VARCHAR(255),
      subscription_type VARCHAR(255),
      subs_email VARCHAR(255),
      payment_method VARCHAR(255),
      amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled BOOLEAN DEFAULT FALSE,
      nominee_contact VARCHAR(255),
      subs_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("other_subscription table created or already exists.");
  } catch (err) {
    console.error("Error creating other_subscription table:", err);
    throw err;
  }
};

const createPropertyHomeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS property_home (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      home_own VARCHAR(50) NOT NULL,
      plot_number VARCHAR(255),
      deed_location VARCHAR(255),
      home_taxes VARCHAR(255),
      ownership VARCHAR(255),
      mortgage_name VARCHAR(255),
      mortgage_number VARCHAR(255),
      agent VARCHAR(255),
      landlord_name VARCHAR(255),
      home_rent DECIMAL(10, 2),
      lease_end DATE,
      other_ownership TEXT,
      nominee_contact VARCHAR(255),
      home_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("property_home table created or already exists.");
  } catch (err) {
    console.error("Error creating property_home table:", err);
    throw err;
  }
};

const createPropertyVehicleTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS property_vehicle (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      vehicle_own VARCHAR(50) NOT NULL,
      vehicle_location VARCHAR(255),
      vehicle_company VARCHAR(255),
      vehicle_account_number VARCHAR(255),
      vehicle_amount DECIMAL(10, 2),
      payment_date DATE,
      vehicle_ownership TEXT,
      nominee_contact VARCHAR(255),
      vehicle_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("property_vehicle table created or already exists.");
  } catch (err) {
    console.error("Error creating property_vehicle table:", err);
    throw err;
  }
};

const createImportantPossessionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS important_possession (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      possession_name VARCHAR(255) NOT NULL,
      possession_thought TEXT,
      nominee_contact VARCHAR(255),
      possession_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("important_possession table created or already exists.");
  } catch (err) {
    console.error("Error creating important_possession table:", err);
    throw err;
  }
};

const createStorageFacilitiesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS storage_facilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      storage_name VARCHAR(255) NOT NULL,
      storage_unit VARCHAR(50),
      country VARCHAR(50),
      address1 VARCHAR(255),
      address2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      phone_number VARCHAR(20),
      payment_method VARCHAR(100),
      amount DECIMAL(10, 2),
      frequency VARCHAR(20),
      enrolled ENUM('yes', 'no'),
      nominee_contact VARCHAR(255),
      storage_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("storage_facilities table created or already exists.");
  } catch (err) {
    console.error("Error creating storage_facilities table:", err);
    throw err;
  }
};

const createSafeDepositTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS safe_deposit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      bank_branch VARCHAR(255),
      bank_account VARCHAR(100),
      safe_box VARCHAR(50),
      safe_key VARCHAR(255),
      nominee_contact VARCHAR(255),
      safe_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("safe_deposit table created or already exists.");
  } catch (err) {
    console.error("Error creating safe_deposit table:", err);
    throw err;
  }
};

const createHomeSafeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS home_safe (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      safe_where VARCHAR(255) NOT NULL,
      who_knows_location VARCHAR(255),
      open_safe VARCHAR(255),
      nominee_contact VARCHAR(255),
      home_safe_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("home_safe table created or already exists.");
  } catch (err) {
    console.error("Error creating home_safe table:", err);
    throw err;
  }
};

const createOtherRealEstateTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS other_real_estate (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      estate_name VARCHAR(255) NOT NULL,
      estate_type VARCHAR(50),
      country VARCHAR(100),
      address1 VARCHAR(255),
      address2 VARCHAR(255),
      state VARCHAR(100),
      city VARCHAR(100),
      postal_code VARCHAR(20),
      nominee_contact VARCHAR(255),
      other_estate_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("other_real_estate table created or already exists.");
  } catch (err) {
    console.error("Error creating other_real_estate table:", err);
    throw err;
  }
};

const createVehicleInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS vehicle_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_name VARCHAR(255) NOT NULL,
      insurance_account VARCHAR(100),
      account_agent VARCHAR(255),
      insurance_location VARCHAR(255),
      nominee_contact VARCHAR(255),
      vehicle_insurance_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("vehicle_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating vehicle_insurance table:", err);
    throw err;
  }
};

const createHomeInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS home_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_name VARCHAR(255) NOT NULL,
      insurance_type1 TINYINT(1) DEFAULT 0,
      insurance_type2 TINYINT(1) DEFAULT 0,
      insurance_type3 TINYINT(1) DEFAULT 0,
      insurance_type4 TINYINT(1) DEFAULT 0,
      insurance_type5 TINYINT(1) DEFAULT 0,
      insurance_type6 TINYINT(1) DEFAULT 0,
      insurance_type7 TINYINT(1) DEFAULT 0,
      insurance_agent VARCHAR(255),
      insurance_account VARCHAR(100),
      insurance_location VARCHAR(255),
      nominee_contact VARCHAR(255),
      home_insurance_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("home_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating home_insurance table:", err);
    throw err;
  }
};

const createHealthInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS health_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_type VARCHAR(50) NOT NULL,
      carrier VARCHAR(255),
      policy_number VARCHAR(100),
      insurance_amount VARCHAR(100),
      start_date DATE,
      end_date DATE,
      renewal_date DATE,
      dependents TEXT,
      other_coverage TEXT,
      card_location VARCHAR(255),
      online_portal VARCHAR(255),
      nominee_contact VARCHAR(255),
      insurance_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("health_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating health_insurance table:", err);
    throw err;
  }
};

const createAdvanceDirectiveTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS advance_directive (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      valid_care_proxy VARCHAR(255),
      location VARCHAR(255),
      last_updated DATE,
      create_it VARCHAR(50) NOT NULL,
      service_name VARCHAR(255),
      online_url VARCHAR(255),
      health_proxy_create TEXT,
      nominee_contact VARCHAR(255),
      advance_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("advance_directive table created or already exists.");
  } catch (err) {
    console.error("Error creating advance_directive table:", err);
    throw err;
  }
};

const createMedicalEquipmentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS medical_equipment (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      equipment_type VARCHAR(255) NOT NULL,
      equipment_model VARCHAR(255),
      provider_contact VARCHAR(255),
      nominee_contact VARCHAR(255),
      equipment_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("medical_equipment table created or already exists.");
  } catch (err) {
    console.error("Error creating medical_equipment table:", err);
    throw err;
  }
};

const createFitnessWellnessTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS fitness_wellness (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      service_type VARCHAR(255) NOT NULL,
      service_name VARCHAR(255),
      payment_method VARCHAR(255),
      payment_amount DECIMAL(10, 2),
      frequency VARCHAR(50),
      enrolled VARCHAR(50),
      nominee_contact VARCHAR(255),
      fitness_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("fitness_wellness table created or already exists.");
  } catch (err) {
    console.error("Error creating fitness_wellness table:", err);
    throw err;
  }
};

const createAccountAssetsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS account_assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      account_type VARCHAR(50) NOT NULL,
      financial_institution VARCHAR(255),
      account_number VARCHAR(255),
      personal_contact VARCHAR(255),
      nominee_contact VARCHAR(255),
      account_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("account_assets table created or already exists.");
  } catch (err) {
    console.error("Error creating account_assets table:", err);
    throw err;
  }
};

const createCreditCardsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      reminder BOOLEAN DEFAULT FALSE,
      card_name VARCHAR(255) NOT NULL,
      agent_number VARCHAR(255) NOT NULL,
      where_it_kept VARCHAR(255) NOT NULL,
      renewal_fee VARCHAR(10) NOT NULL,
      card_type VARCHAR(50) NOT NULL,
      card_issuer VARCHAR(255),
      card_number VARCHAR(255),
      card_expiry VARCHAR(255),
      nominee_contact VARCHAR(255),
      credit_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("credit_cards table created or already exists.");
  } catch (err) {
    console.error("Error creating credit_cards table:", err);
    throw err;
  }
};

const createLoansTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS loans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      loan_name VARCHAR(255) NOT NULL,
      loan_type VARCHAR(50) NOT NULL,
      financial_institution VARCHAR(255),
      account_number VARCHAR(20),
      nominee_contact VARCHAR(255),
      loan_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("loans table created or already exists.");
  } catch (err) {
    console.error("Error creating loans table:", err);
    throw err;
  }
};

const createAdvisorAgentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS advisor_agent (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      advisor_type VARCHAR(50) NOT NULL,
      advisor_contact VARCHAR(255) NOT NULL,
      nominee_contact VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("advisor_agent table created or already exists.");
  } catch (err) {
    console.error("Error creating advisor_agent table:", err);
    throw err;
  }
};

const createLifeInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS life_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_company VARCHAR(255),
      location VARCHAR(255),
      policy_type VARCHAR(100),
      policy_number VARCHAR(100),
      insured_name VARCHAR(255),
      policy_start DATE,
      policy_end DATE,
      death_value VARCHAR(100),
      ltc VARCHAR(10),
      insurance_agent VARCHAR(255),
      nominee_contact VARCHAR(255),
      life_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("life_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating life_insurance table:", err);
    throw err;
  }
};

const createDisabilityInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS disability_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_company VARCHAR(255),
      policy_location TEXT,
      policy_type VARCHAR(50),
      policy_number VARCHAR(100),
      policy_start DATE,
      policy_end DATE,
      benefit_amount VARCHAR(100),
      benefit_period VARCHAR(100),
      information TEXT,
      insurance_agent TEXT,
      nominee_contact TEXT,
      disability_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("disability_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating disability_insurance table:", err);
    throw err;
  }
};

const createTaxReturnsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS tax_returns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      tax_year VARCHAR(50),
      prepare_taxes VARCHAR(50),
      prepare_contact TEXT,
      service_name VARCHAR(255),
      other_prepare_taxes TEXT,
      payment_method TEXT,
      amount TEXT,
      frequency TEXT,
      autoPay TEXT,
      nominee_contact TEXT,
      tax_return_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("tax_returns table created or already exists.");
  } catch (err) {
    console.error("Error creating tax_returns table:", err);
    throw err;
  }
};

const createOtherAnnuitiesBenefitsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS other_annuities_benefits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      annuity_type VARCHAR(50),
      payer_contact TEXT,
      insurance_company VARCHAR(255),
      insurance_amount VARCHAR(100),
      admin_contact TEXT,
      other_annuity TEXT,
      nominee_contact TEXT,
      annuity_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("other_annuities_benefits table created or already exists.");
  } catch (err) {
    console.error("Error creating other_annuities_benefits table:", err);
    throw err;
  }
};

const createPensionsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS pensions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      admin_pension TEXT,
      account_number VARCHAR(100),
      nominee_contact TEXT,
      pension_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("pensions table created or already exists.");
  } catch (err) {
    console.error("Error creating pensions table:", err);
    throw err;
  }
};

const createMilitaryBenefitsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS military_benefits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      admin_contact TEXT,
      account_number VARCHAR(100),
      nominee_contact VARCHAR(100),
      military_benefit_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("military_benefits table created or already exists.");
  } catch (err) {
    console.error("Error creating military_benefits table:", err);
    throw err;
  }
};

const createDisabilityBenefitsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS disability_benefits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      disability_source VARCHAR(50),
      admin_contact TEXT,
      insurance_company VARCHAR(255),
      account_number VARCHAR(100),
      other_benefit VARCHAR(255),
      nominee_contact VARCHAR(100),
      disability_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("disability_benefits table created or already exists.");
  } catch (err) {
    console.error("Error creating disability_benefits table:", err);
    throw err;
  }
};

const createEmergencyContactsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      contact_name VARCHAR(255),
      relationship VARCHAR(100),
      phone_number VARCHAR(255),
      phone_number1 VARCHAR(255),
      phone_number2 VARCHAR(255),
      emergency_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("emergency_contacts table created or already exists.");
  } catch (err) {
    console.error("Error creating emergency_contacts table:", err);
    throw err;
  }
};

const createPetsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS pets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      pet_name VARCHAR(255),
      pet_type VARCHAR(100),
      pet_breed VARCHAR(100),
      pet_sex VARCHAR(50),
      color VARCHAR(100),
      weight VARCHAR(50),
      birthday DATE,
      microchip VARCHAR(255),
      petsitter TEXT,
      nominee_contact VARCHAR(255),
      pet_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("pets table created or already exists.");
  } catch (err) {
    console.error("Error creating pets table:", err);
    throw err;
  }
};

const createPhysicalPhotosTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS physical_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      location VARCHAR(255),
      nominee_contact VARCHAR(255),
      physical_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("physical_photos table created or already exists.");
  } catch (err) {
    console.error("Error creating physical_photos table:", err);
    throw err;
  }
};

const createFamilyRecipesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS family_recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      recipe_name VARCHAR(255),
      ingredients TEXT,
      cooking_instruction TEXT,
      nominee_contact VARCHAR(255),
      recipe_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("family_recipes table created or already exists.");
  } catch (err) {
    console.error("Error creating family_recipes table:", err);
    throw err;
  }
};

const createAttorneysTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS attorneys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      attorney_type VARCHAR(255),
      attorney_contact VARCHAR(255),
      nominee_contact VARCHAR(255),
      attorney_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("attorneys table created or already exists.");
  } catch (err) {
    console.error("Error creating attorneys table:", err);
    throw err;
  }
};

const createWillsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS wills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_location VARCHAR(255),
      last_updated DATE,
      create_will VARCHAR(50),
      attorney_agent VARCHAR(255),
      service_name VARCHAR(255),
      service_url VARCHAR(255),
      will_create VARCHAR(255),
      nominee_contact VARCHAR(255),
      will_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("wills table created or already exists.");
  } catch (err) {
    console.error("Error creating wills table:", err);
    throw err;
  }
};

const createPowerOfAttorneyTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS power_of_attorney (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      poa_name VARCHAR(255),
      poa_alternate VARCHAR(255),
      poa_location VARCHAR(255),
      last_updated DATE,
      poa_type VARCHAR(50),
      creation_method VARCHAR(50),
      attorney_contact_info VARCHAR(255),
      service_name VARCHAR(255),
      service_url VARCHAR(255),
      other_creation_method VARCHAR(255),
      nominee_contact VARCHAR(255),
      attorney_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("power_of_attorney table created or already exists.");
  } catch (err) {
    console.error("Error creating power_of_attorney table:", err);
    throw err;
  }
};

const createTrustsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS trusts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      trust_name VARCHAR(255),
      trust_location VARCHAR(255),
      last_updated DATE,
      trust_purpose VARCHAR(50),
      trust_specific VARCHAR(255),
      other_purpose VARCHAR(255),
      trust_create VARCHAR(50),
      contact_attorney VARCHAR(255),
      service_name VARCHAR(255),
      service_url VARCHAR(255),
      other_service VARCHAR(255),
      llc VARCHAR(255),
      nominee_contact VARCHAR(255),
      trusts_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("trusts table created or already exists.");
  } catch (err) {
    console.error("Error creating trusts table:", err);
    throw err;
  }
};

const createOtherLegalDocumentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS other_legal_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_name VARCHAR(255),
      location VARCHAR(255),
      creation_method VARCHAR(50),
      other_creation_details VARCHAR(255),
      last_updated DATE,
      nominee_contact VARCHAR(255),
      legal_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("other_legal_documents table created or already exists.");
  } catch (err) {
    console.error("Error creating other_legal_documents table:", err);
    throw err;
  }
};

const createOtherInsuranceTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS other_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      insurance_type VARCHAR(100),
      policy_number VARCHAR(100),
      insurance_agent VARCHAR(255),
      location VARCHAR(255),
      nominee_contact VARCHAR(255),
      insurance_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("other_insurance table created or already exists.");
  } catch (err) {
    console.error("Error creating other_insurance table:", err);
    throw err;
  }
};

const createMilesRewardTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS miles_reward (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      reward_type VARCHAR(255) NOT NULL,
      reward_account_number VARCHAR(255),
      company_name VARCHAR(255),
      nominee_contact VARCHAR(255) NOT NULL,
      reward_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("miles_reward table created or already exists.");
  } catch (err) {
    console.error("Error creating miles_reward table:", err);
    throw err;
  }
};

const createGovernmentBenefitTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS government_benefit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      gov_benefit_type VARCHAR(100),
      benefit_account_number VARCHAR(100),
      benefit_value DECIMAL(15, 2),
      nominee_contact VARCHAR(255),
      benefit_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("government_benefit table created or already exists.");
  } catch (err) {
    console.error("Error creating government_benefit table:", err);
    throw err;
  }
};

const createImportantDatesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS important_dates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      occasion_type VARCHAR(100),
      occasion_date DATE,
      get_reminded ENUM('Yes', 'No'),
      contact_name VARCHAR(100),
      phone_number VARCHAR(20),
      phone_number1 VARCHAR(20),
      phone_number2 VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("important_dates table created or already exists.");
  } catch (err) {
    console.error("Error creating important_dates table:", err);
    throw err;
  }
};

const createFinalArrangementTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS final_arrangement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      how_cremated VARCHAR(50),
      by_cremated VARCHAR(255),
      other_instruction TEXT,
      nominee_contact VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("final_arrangement table created or already exists.");
  } catch (err) {
    console.error("Error creating final_arrangement table:", err);
    throw err;
  }
};

const createMyLastLetterTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS my_last_letter (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      letter_type VARCHAR(50),
      digital_letter TEXT,
      nominee_contact VARCHAR(255),
      letter_file VARCHAR(255),
      filename VARCHAR(255),
      letter_share TINYINT(1) DEFAULT 0,
      letter_share1 TINYINT(1) DEFAULT 0,
      letter_share3 TINYINT(1) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("my_last_letter table created or already exists.");
  } catch (err) {
    console.error("Error creating my_last_letter table:", err);
    throw err;
  }
};

const createAboutMyLifeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS about_my_life (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      live_thought TEXT,
      nominee_contact VARCHAR(255),
      life_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("about_my_life table created or already exists.");
  } catch (err) {
    console.error("Error creating about_my_life table:", err);
    throw err;
  }
};

const createMySecretTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS my_secret (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      secret_thought TEXT,
      nominee_contact VARCHAR(255),
      secret_file VARCHAR(255),
      filename VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("my_secret table created or already exists.");
  } catch (err) {
    console.error("Error creating my_secret table:", err);
    throw err;
  }
};

const createDeathMessageTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS Death_message (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      date_of_death DATE NOT NULL,
      ambassador_approve BOOLEAN DEFAULT FALSE,
      plan_admin_approve BOOLEAN DEFAULT FALSE,
      ambassador_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `;
  try {
    await pool.query(query);
    console.log("Death_message table created or already exists.");
  } catch (err) {
    console.error("Error creating Death_message table:", err);
    throw err;
  }
};

const createAudioMessageTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS audio_message (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      audio_path VARCHAR(255) NOT NULL,
      notes TEXT,
      delivery_date DATE,
      contact1 VARCHAR(255),
      contact_name1 VARCHAR(255),
      contact2 VARCHAR(255),
      contact_name2 VARCHAR(255),
      contact3 VARCHAR(255),
      contact_name3 VARCHAR(255),
      contact4 VARCHAR(255),
      contact_name4 VARCHAR(255),
      contact5 VARCHAR(255),
      contact_name5 VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
    console.log("audio_message table created or already exists.");
  } catch (err) {
    console.error("Error creating audio_message table:", err);
    throw err;
  }
};

(async () => {
  try {
    await createUsersTable();
    await alterUsersTable();
    await createProfileTable();
    await createUserPopupResponsesTable();
    await createNomineesTable();
    await createAmbassadorsTable();
    await createVideoMessageTable();
    await createImageUploadTable();
    await createGovernmentIdTable();
    await createEmploymentTable();
    await createReligiousTable();
    await createCharitiesTable();
    await createClubsTable();
    await createDegreesTable();
    await createMilitaryTable();
    await createMiscellaneousTable();
    await createFeedbackMessagesTable();
    await createPasswordManagementTable();
    await createEmailManagementTable();
    await createDeviceManagementTable();
    await createWifiManagementTable();
    await createSocialMediaTable();
    await createShoppingTable();
    await ensureProfileTableSchema();
    await createVideoStreamingTable();
    await createMusicTable();
    await createGamingTable();
    await createCloudStorageTable();
    await createBusinessNetworkingTable();
    await createSoftwareAppLicensesTable();
    await createDomainHostingTable();
    await createOtherSubscriptionTable();
    await createPropertyHomeTable();
    await createPropertyVehicleTable();
    await createImportantPossessionTable();
    await createStorageFacilitiesTable();
    await createSafeDepositTable();
    await createHomeSafeTable();
    await createOtherRealEstateTable();
    await createVehicleInsuranceTable();
    await createHomeInsuranceTable();
    await createHealthInsuranceTable();
    await createAdvanceDirectiveTable();
    await createMedicalEquipmentTable();
    await createFitnessWellnessTable();
    await createAccountAssetsTable();
    await createCreditCardsTable();
    await createLoansTable();
    await createAdvisorAgentTable();
    await createLifeInsuranceTable();
    await createDisabilityInsuranceTable();
    await createTaxReturnsTable();
    await createOtherAnnuitiesBenefitsTable();
    await createPensionsTable();
    await createMilitaryBenefitsTable();
    await createDisabilityBenefitsTable();
    await createEmergencyContactsTable();
    await createPetsTable();
    await createPhysicalPhotosTable();
    await createFamilyRecipesTable();
    await createAttorneysTable();
    await createWillsTable();
    await createPowerOfAttorneyTable();
    await createTrustsTable();
    await createOtherLegalDocumentsTable();
    await createOtherInsuranceTable();
    await createMilesRewardTable();
    await createGovernmentBenefitTable();
    await createImportantDatesTable();
    await createFinalArrangementTable();
    await createMyLastLetterTable();
    await createAboutMyLifeTable();
    await createMySecretTable();
    await createDeathMessageTable();
    await createAudioMessageTable();
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  }
})();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const checkAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }
  next();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }

    if (!passwordSchema.validate(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-100 characters long, contain uppercase and lowercase letters, at least one digit, one symbol, and no spaces.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();

    await pool.query(
      "INSERT INTO users (email, password, otp, is_verified) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, otp, false]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Unlock Your The Plan Beyond Journey!",
      text: `Dear User,

Welcome to ThePlanBeyond — where your digital legacy is protected with care and simplicity.

To complete your registration, please use the following One-Time Password (OTP):

Your OTP: ${otp}

This OTP is valid for the next 10 minutes, ensuring your account remains secure. Enter it on the verification page to activate your account and start managing your plan with ease.

Thank you for choosing ThePlanBeyond to safeguard what matters most.

Warm regards,
ThePlanBeyond Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND otp = ?",
      [email, otp]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    await pool.query(
      "UPDATE users SET is_verified = ?, otp = NULL WHERE email = ?",
      [true, email]
    );

    req.session.userId = users[0].id;
    res.json({ success: true, message: "OTP verified successfully.", userId: users[0].id });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/register-biometric", async (req, res) => {
  const { userId } = req.session;
  const { email } = req.body;

  if (!userId || !email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ? AND email = ?", [userId, email]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const user = users[0];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user.id.toString(), 'utf-8'),
      userName: user.email,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "required",
        authenticatorAttachment: "platform",
      },
    });

    req.session.challenge = options.challenge;
    req.session.email = email;

    res.json({ success: true, options });
  } catch (err) {
    console.error("Error generating biometric registration options:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/verify-biometric-registration", async (req, res) => {
  const { userId } = req.session;
  const { response } = req.body;

  if (!userId || !req.session.challenge || !req.session.email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (!response) {
    return res.status(400).json({ success: false, message: "Missing WebAuthn response." });
  }

  try {
    console.log("Verifying biometric registration for userId:", userId);
    console.log("Expected challenge:", req.session.challenge);
    console.log("Received response:", JSON.stringify(response, null, 2));

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: req.session.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    console.log("Verification result:", JSON.stringify(verification, null, 2));

    if (!verification.verified) {
      return res.status(400).json({ success: false, message: "Biometric registration verification failed." });
    }

    // Extract credentialID and credentialPublicKey
    let credentialID, credentialPublicKey;
    if (verification.registrationInfo && verification.registrationInfo.credential) {
      // Current structure: registrationInfo.credential
      credentialID = verification.registrationInfo.credential.id;
      credentialPublicKey = verification.registrationInfo.credential.publicKey;
      // Convert credentialID to Buffer if it's a base64 string
      if (typeof credentialID === "string") {
        credentialID = Buffer.from(credentialID, "base64");
      }
    } else if (verification.credential) {
      // Alternative structure: direct credential
      credentialID = verification.credential.id;
      credentialPublicKey = verification.credential.publicKey;
      if (typeof credentialID === "string") {
        credentialID = Buffer.from(credentialID, "base64");
      }
    } else {
      console.error("Invalid verification response structure:", verification);
      return res.status(500).json({ success: false, message: "Invalid registration data structure." });
    }

    if (!credentialID || !credentialPublicKey) {
      console.error("Missing credentialID or credentialPublicKey:", { credentialID, credentialPublicKey });
      return res.status(500).json({ success: false, message: "Missing required credential fields." });
    }

    // Convert to base64 for storage
    const credentialIDBuffer = Buffer.isBuffer(credentialID)
      ? credentialID
      : Buffer.from(credentialID, 'base64'); // force decode

    const publicKeyBuffer = Buffer.isBuffer(credentialPublicKey)
      ? credentialPublicKey
      : Buffer.from(credentialPublicKey, 'base64');

    const credentialIDBase64 = credentialIDBuffer.toString("base64");
    const publicKeyBase64 = publicKeyBuffer.toString("base64");


    await pool.query(
      "UPDATE users SET biometric_credential_id = ?, biometric_public_key = ? WHERE id = ?",
      [credentialIDBase64, publicKeyBase64, userId]
    );

    delete req.session.challenge;
    delete req.session.email;

    res.json({ success: true, message: "Biometric registration successful." });
  } catch (err) {
    console.error("Error verifying biometric registration:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

app.post("/api/login-biometric", async (req, res) => {
  try {
    console.log("Generating biometric login options...");
    const options = await generateAuthenticationOptions({
      rpID: "localhost", // Matches http://localhost:5173
      allowCredentials: [], // Empty to allow any registered credential
      userVerification: "required",
      timeout: 60000,
    });

    console.log("Generated options with challenge:", options.challenge);
    req.session.challenge = options.challenge;

    res.json({ success: true, options });
  } catch (err) {
    console.error("Error in /api/login-biometric:", err);
    res.status(500).json({ success: false, message: "Biometric login failed: Server error." });
  }
});

app.post("/api/verify-biometric-login", async (req, res) => {
  const { response } = req.body;

  if (!req.session.challenge) {
    console.error("No challenge found in session.");
    return res.status(401).json({ success: false, message: "Unauthorized: No challenge." });
  }

  try {
    console.log("Received verification payload:", response);

    // Use rawId directly as base64 to avoid encoding issues
    const rawIdBuffer = Buffer.from(new Uint8Array(response.rawId.data));
    console.log(rawIdBuffer, "rawIdBuffer")
    const credentialID = rawIdBuffer.toString("base64");

    console.log(credentialID, 'CRDENTIAL ID')

    const [users] = await pool.query(
      "SELECT * FROM users WHERE biometric_credential_id = ?",
      [credentialID]
    );

    console.log("Matching users found:", users.length);

    if (users.length === 0) {
      console.error("No user found for credentialID:", credentialID);
      return res.status(400).json({ success: false, message: "No user found for this biometric credential." });
    }

    const user = users[0];
    console.log("Found user:", user.id);

    // Validate authenticatorData
    if (!response.response.authenticatorData) {
      console.error("Missing authenticatorData in response.");
      return res.status(400).json({ success: false, message: "Invalid WebAuthn response: Missing authenticatorData." });
    }

    const publicKey = Buffer.from(user.biometric_public_key, "base64");
    const expectedOrigin = "http://localhost:5173"; // Matches frontend origin

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: req.session.challenge,
      expectedOrigin,
      expectedRPID: "localhost",
      authenticator: {
        credentialID: Buffer.from(user.biometric_credential_id, "base64"),
        credentialPublicKey: publicKey,
        counter: 0, // Adjust if counter is stored
      },
    });

    if (!verification.verified) {
      console.error("WebAuthn verification failed.");
      return res.status(400).json({ success: false, message: "Biometric login failed: Verification unsuccessful." });
    }

    console.log("Verification successful for user:", user.id);
    req.session.userId = user.id;
    delete req.session.challenge;

    res.json({
      success: true,
      message: "Biometric login successful.",
      userId: user.id,
      userType: user.ambassador_accept ? "ambassador" : "user",
    });
  } catch (err) {
    console.error("Error in /api/verify-biometric-login:", err);
    res.status(500).json({ success: false, message: "Biometric login failed: Server error." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, password, is_verified, ambassador_accept, biometric_credential_id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.is_verified === 1) {
      req.session.userId = user.id;
      return res.json({
        success: true,
        message: "Login successful.",
        userId: user.id,
        userType: "user",
        hasBiometric: !!user.biometric_credential_id,
      });
    } else if (user.is_verified === 0 && user.ambassador_accept === 0) {
      return res.status(400).json({
        success: false,
        message:
          "You haven't accepted the ambassador request. Please accept and login again.",
      });
    } else if (user.is_verified === 0 && user.ambassador_accept === 1) {
      req.session.userId = user.id;
      return res.json({
        success: true,
        message: "Login successful.",
        userId: user.id,
        userType: "ambassador",
        hasBiometric: !!user.biometric_credential_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Please verify your email with OTP.",
      });
    }
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const otp = generateOtp();
    await pool.query("UPDATE users SET otp = ? WHERE email = ?", [otp, email]);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP for ThePlanBeyond",
      text: `Dear User,

Welcome back to ThePlanBeyond — where your digital legacy is safeguarded with care and simplicity.

To reset your password, please use the following One-Time Password (OTP):

Your OTP: ${otp}

This OTP is valid for the next 10 minutes, ensuring your account remains secure. Enter it on the password reset page to regain access and continue managing your plan with ease.

Thank you for trusting ThePlanBeyond to protect what matters most.

Warm regards,
ThePlanBeyond Team`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("Error sending forgot password OTP:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP, new password, and confirmation are required.",
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match.",
    });
  }

  if (!passwordSchema.validate(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be 8-100 characters long, contain uppercase and lowercase letters, at least one digit, one symbol, and no spaces.",
    });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [users] = await connection.query(
        "SELECT id, otp, password FROM users WHERE email = ?",
        [email]
      );

      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      const user = users[0];
      if (user.otp !== otp) {
        await connection.rollback();
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired OTP." });
      }
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "New password must be different from current password.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await connection.query(
        "UPDATE users SET password = ?, otp = NULL WHERE email = ?",
        [hashedPassword, email]
      );

      await connection.commit();
      connection.release();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Successful",
        text: `Dear User,\n\nYour password has been successfully reset on ${new Date().toLocaleString()}.\nIf you did not initiate this change, please contact our support immediately.\n\nBest regards,\nThePlanBeyond Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error("Failed to send password reset notification:", mailErr);
      }

      res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/user", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated." });
  }

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
    res.json({ success: true, email: user.email });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/check-session", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

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

app.get("/api/get-profile", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
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

// Update profile endpoint
app.post("/api/update-profile", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

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
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    await pool.query(
      `INSERT INTO profile (
        user_id, first_name, middle_name, last_name, email, phone_number, date_of_birth, gender,
        address_line_1, address_line_2, city, state, zip_code, country
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
        req.session.userId,
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

    res.json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Phone OTP endpoint
app.post("/api/phone-otp", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  const { phone_number } = req.body;

  if (!phone_number) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required." });
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

    // Update phone_number in profile
    await pool.query(
      `INSERT INTO profile (user_id, phone_number)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE phone_number = VALUES(phone_number)`,
      [req.session.userId, phone_number]
    );

    res.json({
      success: true,
      message: "Phone number stored, OTP sent by client.",
    });
  } catch (err) {
    console.error("Error storing phone number:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Phone OTP verification endpoint
app.post("/api/phone-verify-otp", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  const { phone_number, is_verified } = req.body;

  if (!phone_number || is_verified === undefined) {
    return res.status(400).json({
      success: false,
      message: "Phone number and verification status are required.",
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

    if (is_verified) {
      await pool.query(
        `INSERT INTO profile (user_id, phone_number, phone_verified)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE phone_number = VALUES(phone_number), phone_verified = VALUES(phone_verified)`,
        [req.session.userId, phone_number, true]
      );
    }

    res.json({ success: true, message: "Phone verification status updated." });
  } catch (err) {
    console.error("Error verifying phone number:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post(
  "/api/upload-profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    if (!req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Session timed out, login again." });
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

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      const imagePath = `images/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `INSERT INTO profile (user_id, profile_image) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE profile_image = ?`,
        [req.session.userId, imagePath, imagePath]
      );

      res.json({
        success: true,
        message: "Image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      console.error("Error uploading profile image:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

app.post("/api/change-password", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password, new password, and confirmation are required.",
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirmation do not match.",
    });
  }

  if (!passwordSchema.validate(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be 8-100 characters long, contain uppercase and lowercase letters, at least one digit, one symbol, and no spaces.",
    });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [users] = await connection.query(
        "SELECT password, email FROM users WHERE id = ?",
        [req.session.userId]
      );
      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        await connection.rollback();
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Incorrect current password." });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "New password must be different from current password.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await connection.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        req.session.userId,
      ]);

      await connection.commit();
      connection.release();

      if (user.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Changed Successfully",
          text: `Dear User,\n\nYour password has been successfully changed on ${new Date().toLocaleString()}.\nIf you did not initiate this change, please contact our support immediately.\n\nBest regards,\nThePlanBeyond Team`,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error(
            "Failed to send password change notification:",
            mailErr
          );
        }
      }

      res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/save-contacts", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  const { contacts } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or empty contacts data." });
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
    await createUserContactsTable(req.session.userId);
    await updateUserContactsTableSchema(req.session.userId);
    await updateSpecialTablesSchema();
    await createImportantDatesTable();

    const skipped = [];
    let savedCount = 0;
    let importantDatesAdded = 0;

    const [existingContacts] = await pool.query(
      `SELECT id, name, phone_number, phone_number1, phone_number2 FROM ${tableName}`
    );
    const existingNames = new Set(existingContacts.map((c) => c.name));
    const existingPhoneNumbers = new Set(
      existingContacts
        .flatMap((c) => [c.phone_number, c.phone_number1, c.phone_number2])
        .filter((num) => num)
        .map((num) => num.trim())
    );

    const [existingImportantDates] = await pool.query(
      `SELECT contact_name, occasion_type FROM important_dates WHERE user_id = ?`,
      [req.session.userId]
    );
    const existingImportantDatesSet = new Set(
      existingImportantDates.map((d) => `${d.contact_name}|${d.occasion_type}`)
    );

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const {
        id,
        name,
        phone_number,
        phone_number1,
        phone_number2,
        email,
        date_of_birth,
        anniversary,
        address,
        category,
      } = contact;

      console.log(`Processing contact ${i + 1}:`, {
        name,
        phone_number,
        phone_number1,
        phone_number2,
        email,
        date_of_birth,
        anniversary,
        address,
        category,
      });

      if (!name || (!phone_number && !phone_number1 && !phone_number2)) {
        console.warn(`Invalid contact data for contact ${i + 1}`);
        skipped.push({
          contact,
          reason: `Invalid contact data for contact ${i + 1}`,
        });
        continue;
      }

      const newPhoneNumbers = [phone_number, phone_number1, phone_number2]
        .filter((num) => num && typeof num === "string" && num.trim() !== "")
        .map((num) => num.trim());

      if (newPhoneNumbers.length === 0) {
        console.warn(`No valid phone numbers for contact ${i + 1}`);
        skipped.push({
          contact,
          reason: `No valid phone numbers for contact ${i + 1}`,
        });
        continue;
      }

      const duplicatePhone = newPhoneNumbers.find((num) =>
        existingPhoneNumbers.has(num)
      );

      // Validate address format (optional, but log if malformed)
      let formattedAddress = address || "";
      if (formattedAddress) {
        const addressParts = formattedAddress.split(",").map((part) => part.trim());
        if (addressParts.length > 6) {
          console.warn(`Address for contact ${name} has too many parts: ${formattedAddress}`);
          skipped.push({
            contact,
            reason: `Address has too many components for contact ${name}`,
          });
          continue;
        }
      }

      if (category === "Nominee" || category === "Ambassador") {
        const targetTable = category === "Nominee" ? "nominees" : "ambassadors";
        const typeField =
          category === "Nominee" ? "nominee_type" : "ambassador_type";
        const existingQuery = `
          SELECT id FROM ${targetTable} WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))
        `;
        const [existingSpecial] = await pool.query(existingQuery, [
          req.session.userId,
          email || null,
          newPhoneNumbers,
          newPhoneNumbers,
          newPhoneNumbers,
        ]);
        if (existingSpecial.length > 0) {
          skipped.push({
            contact,
            reason: `${category} with this email or phone already exists`,
          });
          continue;
        }

        await pool.query(
          `INSERT INTO ${targetTable} (user_id, first_name, email, phone_number, phone_number1, phone_number2, relationship, ${typeField}, date_of_birth, anniversary, address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            name,
            email || "",
            newPhoneNumbers[0] || "",
            newPhoneNumbers[1] || "",
            newPhoneNumbers[2] || "",
            "N/A",
            "",
            date_of_birth || "",
            anniversary || "",
            formattedAddress,
          ]
        );
        savedCount++;
      } else if (id) {
        const [existing] = await pool.query(
          `SELECT id FROM ${tableName} WHERE id = ?`,
          [id]
        );
        if (existing.length > 0) {
          await pool.query(
            `UPDATE ${tableName} SET name = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, email = ?, date_of_birth = ?, anniversary = ?, address = ?, category = ? WHERE id = ?`,
            [
              name,
              phone_number || "",
              phone_number1 || "",
              phone_number2 || "",
              email || null,
              date_of_birth || "",
              anniversary || "",
              formattedAddress,
              category || "",
              id,
            ]
          );
          savedCount++;
        } else {
          skipped.push({ contact, reason: "Contact ID not found" });
          continue;
        }
      } else {
        if (existingNames.has(name)) {
          skipped.push({
            contact,
            reason: `Contact name '${name}' already exists`,
          });
          continue;
        }
        if (duplicatePhone) {
          skipped.push({
            contact,
            reason: `Phone number '${duplicatePhone}' already exists`,
          });
          continue;
        }

        await pool.query(
          `INSERT INTO ${tableName} (user_id, name, phone_number, phone_number1, phone_number2, email, date_of_birth, anniversary, address, category)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            name,
            phone_number || "",
            phone_number1 || "",
            phone_number2 || "",
            email || null,
            date_of_birth || "",
            anniversary || "",
            formattedAddress,
            category || "",
          ]
        );
        existingNames.add(name);
        newPhoneNumbers.forEach((num) => existingPhoneNumbers.add(num));
        savedCount++;
      }

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
          await pool.query(
            `INSERT INTO important_dates (
              user_id, occasion_type, occasion_date, get_reminded, contact_name, phone_number, phone_number1, phone_number2
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.session.userId,
              occasion.type,
              occasion.date,
              "Yes",
              name,
              phone_number || null,
              phone_number1 || null,
              phone_number2 || null,
            ]
          );
          existingImportantDatesSet.add(uniqueKey);
          importantDatesAdded++;
        } else {
          console.log(
            `Skipped adding ${occasion.type} for ${name} to important_dates: already exists`
          );
        }
      }
    }

    res.json({
      success: true,
      message: `${savedCount} contacts saved/updated, ${importantDatesAdded} important dates added.`,
      skipped,
    });
  } catch (err) {
    console.error("Error saving contacts:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.post("/api/categorize-contacts", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

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
    await createUserContactsTable(req.session.userId);

    // Check Nominee and Ambassador limits
    const [nomineeContacts] = await pool.query(
      `SELECT id FROM ${tableName} WHERE isNominee = TRUE`
    );
    const [ambassadorContacts] = await pool.query(
      `SELECT id FROM ${tableName} WHERE isAmbassador = TRUE`
    );

    const newNomineeCount = contactIds.filter((id, idx) => isNominee).length;
    const newAmbassadorCount = contactIds.filter(
      (id, idx) => isAmbassador
    ).length;

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
      `SELECT id, name, phone_number, phone_number1, phone_number2, email, isAmbassador, isNominee FROM ${tableName} WHERE id IN (${contactIds
        .map(() => "?")
        .join(",")})`,
      contactIds
    );

    for (const contact of contacts) {
      const phoneNumbers = [
        contact.phone_number,
        contact.phone_number1,
        contact.phone_number2,
      ].filter((num) => num);

      // Remove from nominees/ambassadors tables if isNominee/isAmbassador is false
      if (contact.isNominee && !isNominee) {
        await pool.query(
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
      if (contact.isAmbassador && !isAmbassador) {
        await pool.query(
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
        const [existingNominee] = await pool.query(existingQuery, [
          req.session.userId,
          contact.email || null,
          phoneNumbers,
          phoneNumbers,
          phoneNumbers,
        ]);
        if (existingNominee.length === 0) {
          await pool.query(
            `INSERT INTO nominees (user_id, first_name, email, phone_number, phone_number1, phone_number2, category, relation, nominee_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.session.userId,
              contact.name,
              contact.email || "",
              phoneNumbers[0] || "",
              phoneNumbers[1] || "",
              phoneNumbers[2] || "",
              category, // Store category
              relation || "", // Store relation (empty if not provided)
              "",
            ]
          );
        }
      }
      if (isAmbassador) {
        const existingQuery = `
          SELECT id FROM ambassadors WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))
        `;
        const [existingAmbassador] = await pool.query(existingQuery, [
          req.session.userId,
          contact.email || null,
          phoneNumbers,
          phoneNumbers,
          phoneNumbers,
        ]);
        if (existingAmbassador.length === 0) {
          await pool.query(
            `INSERT INTO ambassadors (user_id, first_name, email, phone_number, phone_number1, phone_number2, category, relation, ambassador_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.session.userId,
              contact.name,
              contact.email || "",
              phoneNumbers[0] || "",
              phoneNumbers[1] || "",
              phoneNumbers[2] || "",
              category, // Store category
              relation || "", // Store relation (empty if not provided)
              "",
            ]
          );
        }
      }
    }

    // Update contacts table with new category, relation, isAmbassador, and isNominee
    await pool.query(
      `UPDATE ${tableName} SET category = ?, relation = ?, isAmbassador = ?, isNominee = ? WHERE id IN (${contactIds
        .map(() => "?")
        .join(",")})`,
      [
        category,
        relation || "", // Store relation (empty if not provided)
        isAmbassador,
        isNominee,
        ...contactIds,
      ]
    );

    res.json({
      success: true,
      message: `Successfully categorized ${contactIds.length} contacts.`,
    });
  } catch (err) {
    console.error("Error categorizing contacts:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/delete-contacts", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  const { contactIds } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or empty contact IDs." });
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
    await createUserContactsTable(req.session.userId);
    await updateUserContactsTableSchema(req.session.userId);
    await updateSpecialTablesSchema();

    const [contacts] = await pool.query(
      `SELECT id, phone_number, phone_number1, phone_number2, email, category FROM ${tableName} WHERE id IN (${contactIds
        .map(() => "?")
        .join(",")})`,
      contactIds
    );

    for (const contact of contacts) {
      const phoneNumbers = [
        contact.phone_number,
        contact.phone_number1,
        contact.phone_number2,
      ].filter((num) => num);
      if (contact.category === "Nominee") {
        await pool.query(
          `DELETE FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
          [
            req.session.userId,
            contact.email || null,
            phoneNumbers,
            phoneNumbers,
            phoneNumbers,
          ]
        );
      } else if (contact.category === "Ambassador") {
        await pool.query(
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
    }

    await pool.query(
      `DELETE FROM ${tableName} WHERE id IN (${contactIds
        .map(() => "?")
        .join(",")})`,
      [...contactIds]
    );

    res.json({
      success: true,
      message: `Successfully deleted ${contactIds.length} contacts.`,
    });
  } catch (err) {
    console.error("Error deleting contacts:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/get-contacts", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

  // Get query parameters
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);
  let offset = 0;
  const filter = req.query.filter || "ALL";
  const search = req.query.search || "";

  // Determine if full fetch (no pagination or filtering)
  const noPagination = !req.query.page && !req.query.limit && filter === "ALL" && !search;
  if (noPagination) {
    limit = null;
    offset = null;
  } else {
    page = page || 1;
    limit = limit || 10;
    offset = (page - 1) * limit;
  }

  try {
    const userId = parseInt(req.session.userId, 10);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }

    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const tableName = `contacts_user_${userId}`;
    await createUserContactsTable(userId);

    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [process.env.DB_NAME || "plan_beyond", tableName]
    );

    if (tables.length === 0) {
      return res.json({ success: true, contacts: [], total: 0, totalPages: 0 });
    }

    let whereClause = "";
    let queryParams = [];

    // Apply filter
    if (filter !== "ALL") {
      if (filter === "Ambassador") {
        whereClause += " WHERE isAmbassador = ?";
        queryParams.push(1);
      } else if (filter === "Nominee") {
        whereClause += " WHERE isNominee = ?";
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
      whereClause += " name LIKE ?";
      queryParams.push(`%${search}%`);
    }

    // Get total only if paginated
    let total = 0;
    if (!noPagination) {
      const [[result]] = await pool.query(
        `SELECT COUNT(*) AS total FROM ${tableName}${whereClause}`,
        queryParams
      );
      total = result.total;
    }

    // Build final contact query
    const contactsQuery = `
      SELECT id, user_id, name, phone_number, phone_number1, phone_number2, email, date_of_birth, anniversary, address, category, relation, isAmbassador, isNominee, created_at
      FROM ${tableName}
      ${whereClause}
      ORDER BY name ASC
      ${!noPagination ? 'LIMIT ? OFFSET ?' : ''}
    `;
    const queryValues = !noPagination ? [...queryParams, limit, offset] : queryParams;

    const [contacts] = await pool.query(contactsQuery, queryValues);

    const parsedContacts = contacts.map((contact) => {
      const categoryParts = [];
      if (contact.isAmbassador) categoryParts.push("Ambassador");
      if (contact.isNominee) categoryParts.push("Nominee");
      if (contact.category) categoryParts.push(contact.category);
      if (contact.relation) categoryParts.push(contact.relation);
      const categoryDisplay = categoryParts.join("/");

      return {
        id: contact.id,
        user_id: contact.user_id,
        name: contact.name,
        phone_number: contact.phone_number || "",
        phone_number1: contact.phone_number1 || "",
        phone_number2: contact.phone_number2 || "",
        email: contact.email || "",
        date_of_birth: contact.date_of_birth || "",
        anniversary: contact.anniversary || "",
        address: contact.address || "",
        category: categoryDisplay || "",
        relation: contact.relation || "",
        isAmbassador: contact.isAmbassador || false,
        isNominee: contact.isNominee || false,
        created_at: contact.created_at,
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
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});


app.post("/api/popup/submit", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }

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

    res.json({ success: true, message: "Popup responses saved successfully." });
  } catch (err) {
    console.error("Error saving popup responses:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/get-nominees", checkAuth, async (req, res) => {
  try {
    await updateSpecialTablesSchema();
    const [nominees] = await pool.query(
      `SELECT id, first_name, email, phone_number, contact, phone_number1, phone_number2, category, relation, nominee_type, profile_image, created_at
       FROM nominees WHERE user_id = ?`,
      [req.session.userId]
    );
    res.json({ success: true, nominees });
  } catch (err) {
    console.error("Error fetching nominees:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post(
  "/api/upload-nominee-image",
  checkAuth,
  upload.single("profileImage"),
  async (req, res) => {
    const { nomineeId } = req.body;

    if (!req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Session timed out, login again." });
    }

    if (!nomineeId) {
      return res
        .status(400)
        .json({ success: false, message: "Nominee ID is required." });
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

      const [nominees] = await pool.query(
        "SELECT id FROM nominees WHERE id = ? AND user_id = ?",
        [nomineeId, req.session.userId]
      );
      if (nominees.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Nominee not found." });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      const imagePath = `images/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `UPDATE nominees SET profile_image = ? WHERE id = ? AND user_id = ?`,
        [imagePath, nomineeId, req.session.userId]
      );

      res.json({
        success: true,
        message: "Nominee image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      console.error("Error uploading nominee image:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

app.post("/api/add-nominee", checkAuth, async (req, res) => {
  const {
    firstName,
    email,
    contact,
    phone_number,
    category,
    phone_number1 = "",
    phone_number2 = "",
    relation,
    nomineeType = "",
  } = req.body;

  if (!["Primary", "Secondary", ""].includes(nomineeType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid nominee type." });
  }

  try {
    await updateSpecialTablesSchema();

    const [existingNominee] = await pool.query(
      `SELECT id FROM nominees WHERE user_id = ? AND nominee_type = ?`,
      [req.session.userId, nomineeType]
    );
    if (existingNominee.length > 0 && nomineeType !== "") {
      return res.status(400).json({
        success: false,
        message: `A ${nomineeType} nominee already exists. Only one ${nomineeType} nominee is allowed.`,
      });
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );
    const [existing] = await pool.query(
      `SELECT id FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nominee with this email or phone number already exists.",
      });
    }

    // Start a transaction to ensure consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into nominees table
      const [result] = await connection.query(
        `INSERT INTO nominees (user_id, first_name, email, contact, category, phone_number, phone_number1, phone_number2, relation, nominee_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          firstName,
          email,
          JSON.stringify(contact),
          category,
          phone_number,
          phone_number1,
          phone_number2,
          relation,
          nomineeType,
        ]
      );

      // Ensure contacts table exists
      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);
      await updateUserContactsTableSchema(req.session.userId);

      // Use a separate variable to avoid re-declaration error
      // const category = relation === "Family" ? "Family" : relation;
      const cleanedRelation = relation === "Family" ? "" : relation;

      // Check for existing contact by name or phone numbers
      const [existingContact] = await connection.query(
        `SELECT id, relation FROM ${tableName} WHERE user_id = ? AND (name = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [
          req.session.userId,
          firstName,
          phoneNumbers,
          phoneNumbers,
          phoneNumbers,
        ]
      );

      if (existingContact.length > 0) {
        // Update existing contact
        await connection.query(
          `UPDATE ${tableName} SET 
            name = ?, 
            email = ?, 
            phone_number = ?, 
            phone_number1 = ?, 
            phone_number2 = ?, 
            category = ?, 
            relation = ?, 
            isNominee = ? 
           WHERE id = ?`,
          [
            firstName,
            email,
            phone_number,
            phone_number1,
            phone_number2,
            category,
            relation === "Family" ? existingContact[0].relation : cleanedRelation,
            1,
            existingContact[0].id,
          ]
        );
      } else {
        // Insert new contact
        await connection.query(
          `INSERT INTO ${tableName} (user_id, name, phone_number, phone_number1, phone_number2, email, category, relation, isAmbassador, isNominee)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            firstName,
            phone_number,
            phone_number1,
            phone_number2,
            email,
            category,
            cleanedRelation,
            0,
            1,
          ]
        );
      }

      await connection.commit();
      connection.release();

      const nominee = {
        id: result.insertId,
        first_name: firstName,
        email,
        contact,
        category,
        phone_number,
        phone_number1,
        phone_number2,
        relation,
        nominee_type: nomineeType,
        created_at: new Date(),
      };

      res.json({ success: true, nominee });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error("Error adding nominee:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.put("/api/update-nominee/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    email,
    category,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation,
    nomineeType = "",
    contact = "",
  } = req.body;

  if (!firstName || !email || !phone_number) {
    return res.status(400).json({
      success: false,
      message:
        "First name, email and primary phone number are required.",
    });
  }

  if (!["Primary", "Secondary", ""].includes(nomineeType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid nominee type." });
  }

  try {
    await updateSpecialTablesSchema(); // Ensure nominees table is updated

    const [existing] = await pool.query(
      `SELECT id, nominee_type FROM nominees WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nominee not found." });
    }

    if (nomineeType !== existing[0].nominee_type && nomineeType !== "") {
      const [existingNominee] = await pool.query(
        `SELECT id FROM nominees WHERE user_id = ? AND nominee_type = ?`,
        [req.session.userId, nomineeType]
      );
      if (existingNominee.length > 0) {
        return res.status(400).json({
          success: false,
          message: `A ${nomineeType} nominee already exists. Only one ${nomineeType} nominee is allowed.`,
        });
      }
    }

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );
    const [conflict] = await pool.query(
      `SELECT id FROM nominees WHERE user_id = ? AND (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND id != ?`,
      [req.session.userId, email, phoneNumbers, phoneNumbers, phoneNumbers, id]
    );
    if (conflict.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Another nominee with this email or phone number already exists.",
      });
    }

    await pool.query(
      `UPDATE nominees SET first_name = ?, email = ?, category = ?, contact = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, relation = ?, nominee_type = ?
       WHERE id = ? AND user_id = ?`,
      [
        firstName,
        email,
        category,
        JSON.stringify(contact),
        phone_number,
        phone_number1,
        phone_number2,
        relation,
        nomineeType,
        id,
        req.session.userId,
      ]
    );

    const nominee = {
      id,
      first_name: firstName,
      email,
      category,
      phone_number,
      phone_number1,
      phone_number2,
      relation,
      nominee_type: nomineeType,
      contact
    };

    res.json({ success: true, nominee });
  } catch (err) {
    console.error("Error updating nominee:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.delete("/api/remove-nominee/:id", checkAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await updateSpecialTablesSchema(); // Ensure nominees table is updated

    const [nominees] = await pool.query(
      `SELECT email, phone_number, phone_number1, phone_number2 FROM nominees WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (nominees.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nominee not found." });
    }

    const { email, phone_number, phone_number1, phone_number2 } = nominees[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );

    const [result] = await pool.query(
      `DELETE FROM nominees WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Nominee not found." });
    }

    const tableName = `contacts_user_${req.session.userId}`;
    await createUserContactsTable(req.session.userId);
    await updateUserContactsTableSchema(req.session.userId);

    await pool.query(
      `UPDATE ${tableName} SET isNominee = 0 
   WHERE (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND isNominee = 1`,
      [email, phoneNumbers, phoneNumbers, phoneNumbers]
    );

    res.json({ success: true, message: "Nominee removed successfully." });
  } catch (err) {
    console.error("Error removing nominee:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/get-ambassadors", checkAuth, async (req, res) => {
  try {
    await updateSpecialTablesSchema();
    const [ambassadors] = await pool.query(
      `SELECT id, first_name, email, phone_number, contact, phone_number1, phone_number2, category, relation, ambassador_type, profile_image, created_at
       FROM ambassadors WHERE user_id = ?`,
      [req.session.userId]
    );
    res.json({ success: true, ambassadors });
  } catch (err) {
    console.error("Error fetching ambassadors:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/add-ambassador", checkAuth, async (req, res) => {
  const {
    firstName,
    email,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation,
    ambassadorType,
    category = "",
    contact = {},
  } = req.body;

  if (!firstName || !email || !phone_number || !ambassadorType) {
    return res.status(400).json({
      success: false,
      message:
        "First name, email, primary phone number, relation, and ambassador type are required.",
    });
  }

  if (!["Primary", "Secondary", ""].includes(ambassadorType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid ambassador type." });
  }

  try {
    await updateSpecialTablesSchema(); // Ensure ambassadors table is updated

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

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );
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
        `INSERT INTO ambassadors (user_id, first_name, email, phone_number, phone_number1, phone_number2, category, relation, contact, ambassador_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          firstName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          category,
          relation,
          JSON.stringify(contact), // Store contact object as JSON
          ambassadorType,
        ]
      );

      const tableName = `contacts_user_${req.session.userId}`;
      await createUserContactsTable(req.session.userId);
      await updateUserContactsTableSchema(req.session.userId);

      const [existingContact] = await connection.query(
        `SELECT id FROM ${tableName} WHERE user_id = ? AND (name = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
        [
          req.session.userId,
          firstName,
          phoneNumbers,
          phoneNumbers,
          phoneNumbers,
        ]
      );

      if (existingContact.length > 0) {
        await connection.query(
          `UPDATE ${tableName} SET 
            name = ?, 
            email = ?, 
            phone_number = ?, 
            phone_number1 = ?, 
            phone_number2 = ?, 
            category = ?, 
            relation = ?, 
            isAmbassador = ? 
           WHERE id = ?`,
          [
            firstName,
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
          `INSERT INTO ${tableName} (user_id, name, phone_number, phone_number1, phone_number2, email, category, relation, isAmbassador, isNominee)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.session.userId,
            firstName,
            phone_number,
            phone_number1,
            phone_number2,
            email,
            category,
            relation,
            1,
            0,
          ]
        );
      }

      await connection.commit();
      connection.release();

      const ambassador = {
        id: result.insertId,
        first_name: firstName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        category,
        relation,
        ambassador_type: ambassadorType,
        contact,
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


app.put("/api/update-ambassador/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    email,
    phone_number,
    phone_number1 = "",
    phone_number2 = "",
    relation,
    ambassadorType,
    category = "",
  } = req.body;

  if (!firstName || !email || !phone_number || !relation || !ambassadorType) {
    return res.status(400).json({
      success: false,
      message:
        "First name, email, primary phone number, relation, and ambassador type are required.",
    });
  }

  if (!["Primary", "Secondary", ""].includes(ambassadorType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ambassador type.",
    });
  }

  try {
    await updateSpecialTablesSchema();

    const [existing] = await pool.query(
      `SELECT id, ambassador_type FROM ambassadors WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Ambassador not found." });
    }

    if (
      ambassadorType !== existing[0].ambassador_type &&
      ambassadorType !== ""
    ) {
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

    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );
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

    // Update ambassadors table
    await pool.query(
      `UPDATE ambassadors 
       SET first_name = ?, email = ?, phone_number = ?, phone_number1 = ?, phone_number2 = ?, relation = ?, ambassador_type = ?, category = ?
       WHERE id = ? AND user_id = ?`,
      [
        firstName,
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

    // Handle contact update or insert
    const tableName = `contacts_user_${req.session.userId}`;
    await createUserContactsTable(req.session.userId);
    await updateUserContactsTableSchema(req.session.userId);

    const [existingContact] = await pool.query(
      `SELECT id FROM ${tableName} 
       WHERE user_id = ? AND (name = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?))`,
      [
        req.session.userId,
        firstName,
        phoneNumbers,
        phoneNumbers,
        phoneNumbers,
      ]
    );

    let contact;

    if (existingContact.length > 0) {
      await pool.query(
        `UPDATE ${tableName} SET 
         name = ?, 
         email = ?, 
         phone_number = ?, 
         phone_number1 = ?, 
         phone_number2 = ?, 
         category = ?, 
         relation = ?, 
         isAmbassador = ? 
         WHERE id = ?`,
        [
          firstName,
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
      contact = {
        id: existingContact[0].id,
        name: firstName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        category,
        relation,
        isAmbassador: 1,
      };
    } else {
      const [insertResult] = await pool.query(
        `INSERT INTO ${tableName} 
         (user_id, name, phone_number, phone_number1, phone_number2, email, category, relation, isAmbassador, isNominee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          firstName,
          phone_number,
          phone_number1,
          phone_number2,
          email,
          category,
          relation,
          1,
          0,
        ]
      );
      contact = {
        id: insertResult.insertId,
        name: firstName,
        email,
        phone_number,
        phone_number1,
        phone_number2,
        category,
        relation,
        isAmbassador: 1,
        isNominee: 0,
      };
    }

    const ambassador = {
      id,
      first_name: firstName,
      email,
      phone_number,
      phone_number1,
      phone_number2,
      relation,
      ambassador_type: ambassadorType,
      category,
    };

    res.json({ success: true, ambassador, contact });
  } catch (err) {
    console.error("Error updating ambassador:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


app.delete("/api/remove-ambassador/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  // Log parameters for debugging
  console.log("Remove Ambassador - Parameters:", { ambassadorId: id, userId });

  // Validate ambassador ID
  if (!id || isNaN(parseInt(id, 10))) {
    console.error("Invalid ambassador ID:", id);
    return res.status(400).json({
      success: false,
      message: "Valid Ambassador ID is required.",
    });
  }

  const parsedAmbassadorId = parseInt(id, 10);

  try {
    await updateSpecialTablesSchema();

    // Fetch ambassador details
    const [ambassadors] = await pool.query(
      "SELECT email, phone_number, phone_number1, phone_number2 FROM ambassadors WHERE id = ? AND user_id = ?",
      [parsedAmbassadorId, userId]
    );

    if (!ambassadors.length) {
      console.error("Ambassador not found:", {
        ambassadorId: parsedAmbassadorId,
        userId,
      });
      return res.status(404).json({
        success: false,
        message: "Ambassador not found.",
      });
    }

    const { email, phone_number, phone_number1, phone_number2 } =
      ambassadors[0];
    const phoneNumbers = [phone_number, phone_number1, phone_number2].filter(
      (num) => num
    );

    // Start a transaction to ensure atomicity
    await pool.query("START TRANSACTION");

    try {
      // Check if user exists with the ambassador's email
      const [users] = await pool.query(
        "SELECT id, is_verified FROM users WHERE email = ? AND ambassador_id = ? AND ambassador_user_id = ?",
        [email, parsedAmbassadorId, userId]
      );

      if (users.length > 0) {
        const user = users[0];
        if (user.is_verified === 0) {
          // Delete user if not verified
          const [deleteUserResult] = await pool.query(
            "DELETE FROM users WHERE id = ? AND ambassador_id = ? AND ambassador_user_id = ?",
            [user.id, parsedAmbassadorId, userId]
          );

          console.log("User deletion result:", {
            userId: user.id,
            ambassadorId: parsedAmbassadorId,
            affectedRows: deleteUserResult.affectedRows,
          });
        } else {
          // Update user to remove ambassador details if verified
          const [updateUserResult] = await pool.query(
            "UPDATE users SET ambassador_id = NULL, ambassador_user_id = NULL, ambassador_accept = NULL WHERE id = ? AND ambassador_id = ? AND ambassador_user_id = ?",
            [user.id, parsedAmbassadorId, userId]
          );

          console.log("User update result:", {
            userId: user.id,
            ambassadorId: parsedAmbassadorId,
            affectedRows: updateUserResult.affectedRows,
          });
        }
      } else {
        console.warn("No user found for ambassador email:", {
          email,
          ambassadorId: parsedAmbassadorId,
          userId,
        });
      }

      // Delete from ambassadors table
      const [ambassadorResult] = await pool.query(
        "DELETE FROM ambassadors WHERE id = ? AND user_id = ?",
        [parsedAmbassadorId, userId]
      );

      if (ambassadorResult.affectedRows === 0) {
        await pool.query("ROLLBACK");
        console.error("No rows deleted from ambassadors:", {
          ambassadorId: parsedAmbassadorId,
          userId,
        });
        return res.status(404).json({
          success: false,
          message: "Ambassador not found.",
        });
      }

      // Update contacts table
      const tableName = `contacts_user_${userId}`;
      await createUserContactsTable(userId);
      await updateUserContactsTableSchema(userId);

      const [contactsResult] = await pool.query(
        `UPDATE ${tableName} SET isAmbassador = 0 
         WHERE (email = ? OR phone_number IN (?) OR phone_number1 IN (?) OR phone_number2 IN (?)) AND isAmbassador = 1`,
        [email, phoneNumbers, phoneNumbers, phoneNumbers]
      );

      console.log("Contacts table update result:", {
        tableName,
        email,
        phoneNumbers,
        affectedRows: contactsResult.affectedRows,
      });

      // Commit the transaction
      await pool.query("COMMIT");

      return res.json({
        success: true,
        message: "Ambassador removed successfully.",
      });
    } catch (err) {
      // Rollback on error
      await pool.query("ROLLBACK");
      console.error("Error during ambassador removal transaction:", err);
      return res.status(500).json({
        success: false,
        message: `Server error during removal: ${err.message || "Unknown error occurred."
          }`,
      });
    }
  } catch (err) {
    console.error("Error removing ambassador:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

app.post(
  "/api/upload-ambassador-image",
  checkAuth,
  upload.single("profileImage"),
  async (req, res) => {
    const { ambassadorId } = req.body;

    if (!req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Session timed out, login again." });
    }

    if (!ambassadorId) {
      return res
        .status(400)
        .json({ success: false, message: "Ambassador ID is required." });
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

      const [ambassadors] = await pool.query(
        "SELECT id FROM ambassadors WHERE id = ? AND user_id = ?",
        [ambassadorId, req.session.userId]
      );
      if (ambassadors.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Ambassador not found." });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      const imagePath = `images/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `UPDATE ambassadors SET profile_image = ? WHERE id = ? AND user_id = ?`,
        [imagePath, ambassadorId, req.session.userId]
      );

      res.json({
        success: true,
        message: "Ambassador image uploaded successfully.",
        imagePath,
      });
    } catch (err) {
      console.error("Error uploading ambassador image:", err);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// Generate a temporary password
const generateTempPassword = () => {
  return crypto.randomBytes(8).toString("hex");
};

// API endpoint to send ambassador invite
app.post("/api/send-ambassador-invite", checkAuth, async (req, res) => {
  const { ambassadorId } = req.body;
  const userId = req.session.userId;

  if (!ambassadorId) {
    return res.status(400).json({
      success: false,
      message: "Ambassador ID is required.",
    });
  }

  try {
    await updateSpecialTablesSchema();

    // Fetch ambassador details
    const [ambassadors] = await pool.query(
      "SELECT first_name, email, ambassador_type FROM ambassadors WHERE id = ? AND user_id = ?",
      [ambassadorId, userId]
    );

    if (!ambassadors.length) {
      console.error("Ambassador not found:", { ambassadorId, userId });
      return res.status(404).json({
        success: false,
        message: "Ambassador not found or not associated with this user.",
      });
    }

    const ambassador = ambassadors[0];
    const isInitiator = ambassador.ambassador_type === "Primary";
    const registrationLink = `${process.env.FRONTEND_URL}/register?referrer=${userId}&ambassadorId=${ambassadorId}`;
    const acceptLink = `${process.env.APP_BASE_URL}/api/accept-invite?userId=${userId}&ambassadorId=${ambassadorId}`;

    // Update ambassadors table to set ambassador_accept = 0
    const [ambassadorUpdateResult] = await pool.query(
      "UPDATE ambassadors SET ambassador_accept = 0 WHERE id = ? AND user_id = ?",
      [ambassadorId, userId]
    );

    if (ambassadorUpdateResult.affectedRows === 0) {
      console.error("Failed to update ambassador_accept in ambassadors:", {
        ambassadorId,
        userId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to update ambassador status.",
      });
    }

    let mailOptions;

    if (isInitiator) {
      // Check for existing ambassador assignment in users table
      const [existingUsers] = await pool.query(
        "SELECT id FROM users WHERE ambassador_id = ? AND ambassador_user_id = ?",
        [ambassadorId, userId]
      );

      if (existingUsers.length > 0) {
        console.warn("Invitation already sent:", { userId, ambassadorId });
        return res.status(400).json({
          success: false,
          message: "Invitation already sent for this ambassador.",
        });
      }

      // Check if email exists in users table
      const [users] = await pool.query(
        "SELECT id, email FROM users WHERE email = ?",
        [ambassador.email]
      );

      let tempPassword;
      let hashedPassword;

      if (users.length > 0) {
        // User exists in users table
        const existingUser = users[0];

        // Update users table with ambassador details
        await pool.query(
          "UPDATE users SET ambassador_id = ?, ambassador_user_id = ?, ambassador_accept = 0 WHERE id = ?",
          [ambassadorId, userId, existingUser.id]
        );

        console.log("Updated users entry for existing user:", {
          userId,
          ambassadorId,
          email: ambassador.email,
        });

        // Email for existing user (accept invite)
        mailOptions = {
          from: `"ThePlanBeyond Team" <${process.env.EMAIL_USER}>`,
          to: ambassador.email,
          subject: "You’ve been invited as an Ambassador of The Plan Beyond",
          html: `
            <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px;">
              <h2>Hi ${ambassador.first_name},</h2>
              <p>You’ve been invited to join The Plan Beyond as an Ambassador — a trusted role that gives you secure access to carry forward someone’s wishes when the time comes.</p>
              <p>Your responsibility is meaningful. As a Primary Ambassador, you may be called upon to access digital records, notify loved ones, or help finalize important affairs.</p>
              <p>Please click below to accept your invitation and activate your secure access:</p>
              <a href="${acceptLink}" style="display: inline-block; padding: 6px 35px; background-color: transparent; color: #007c6a; text-decoration: none; border-radius: 5px; font-weight: bold; border:1px solid #007c6a">Accept Invitation</a>
              <p>Need support? We’re here: <a href="mailto:support@theplanbeyond.com">support@theplanbeyond.com</a></p>
              <p>Warm regards,<br>The Plan Beyond Team</p>
              <hr style="border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #777;">This email was sent because you were added as an ambassador. If you believe this was a mistake, please contact us.</p>
            </div>
          `,
          text: `
Hi ${ambassador.first_name},

You’ve been invited to join The Plan Beyond as an Ambassador — a trusted role that gives you secure access to carry forward someone’s wishes when the time comes.

Your responsibility is meaningful. As a Primary Ambassador, you may be called upon to access digital records, notify loved ones, or help finalize important affairs.

Please click below to accept your invitation and activate your secure access: ${acceptLink}

Need support? We’re here: support@theplanbeyond.com

Warm regards,
The Plan Beyond Team
          `,
        };
      } else {
        // User does not exist
        tempPassword = generateTempPassword();
        hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Insert new user with ambassador details
        await pool.query(
          "INSERT INTO users (email, password, is_verified, ambassador_id, ambassador_user_id, ambassador_accept) VALUES (?, ?, 0, ?, ?, 0)",
          [ambassador.email, hashedPassword, ambassadorId, userId]
        );

        console.log("Inserted new user for Primary ambassador:", {
          userId,
          ambassadorId,
          email: ambassador.email,
        });

        // Email with temporary credentials
        mailOptions = {
          from: `"ThePlanBeyond Team" <${process.env.EMAIL_USER}>`,
          to: ambassador.email,
          subject: "You’ve been invited as an Ambassador of The Plan Beyond",
          html: `
            <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px;">
              <h2>Hi ${ambassador.first_name},</h2>
              <p>You’ve been invited to join The Plan Beyond as an Ambassador — a trusted role that gives you secure access to carry forward someone’s wishes when the time comes.</p>
              <p>Here’s what you need to get started:</p>
              <p><strong>Email:</strong> ${ambassador.email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p>Your responsibility is meaningful. As a Primary Ambassador, you may be called upon to access digital records, notify loved ones, or help finalize important affairs.</p>
              <p>Please click below to accept your invitation and activate your secure access:</p>
              <a href="${acceptLink}" style="display: inline-block; padding: 6px 35px; background-color: transparent; color: #007c6a; text-decoration: none; border-radius: 5px; font-weight: bold; border:1px solid #007c6a">Accept Invitation</a>
              <p>Once logged in, you can change your password anytime through your settings.</p>
              <p>Need support? We’re here: <a href="mailto:support@theplanbeyond.com">support@theplanbeyond.com</a></p>
              <p>Warm regards,<br>The Plan Beyond Team</p>
              <hr style="border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #777;">This email was sent because you were added as an ambassador. If you believe this was a mistake, please contact us.</p>
            </div>
          `,
          text: `
Hi ${ambassador.first_name},

You’ve been invited to join The Plan Beyond as an Ambassador — a trusted role that gives you secure access to carry forward someone’s wishes when the time comes.

Here’s what you need to get started:
Email: ${ambassador.email}
Temporary Password: ${tempPassword}

Your responsibility is meaningful. As a Primary Ambassador, you may be called upon to access digital records, notify loved ones, or help finalize important affairs.

Please click below to accept your invitation and activate your secure access: ${acceptLink}

Once logged in, you can change your password anytime through your settings.

Need support? We’re here: support@theplanbeyond.com

Warm regards,
The Plan Beyond Team
          `,
        };
      }
    } else {
      // Secondary ambassador: only send accept email, no users table update
      console.log("Processing Secondary ambassador invitation:", {
        userId,
        ambassadorId,
        email: ambassador.email,
      });

      mailOptions = {
        from: `"ThePlanBeyond Team" <${process.env.EMAIL_USER}>`,
        to: ambassador.email,
        subject: "You’ve been invited to support someone’s plan",
        html: `
          <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px;">
            <h2>Hi ${ambassador.first_name},</h2>
            <p>You’ve been invited to join The Plan Beyond as an Ambassador — a support role with purpose.</p>
            <p>As a Secondary Ambassador, you’ll be able to review key parts of a trusted person’s digital plan. This could include confirming wishes, accessing shared documents, or simply being there when needed.</p>
            <p>Your presence matters, and your role ensures no detail gets missed when it matters most.</p>
            <p><a href="${acceptLink}" style="display: inline-block; padding: 6px 35px; background-color: transparent; color: #007c6a; text-decoration: none; border-radius: 5px; font-weight: bold; border:1px solid #007c6a">Accept Invitation</a></p>
            <p>Accepting your invitation takes less than a minute and gives you secure access to fulfill your role when the time is right.</p>
            <p>Questions? Reach us at <a href="mailto:support@theplanbeyond.com">support@theplanbeyond.com</a></p>
            <p>Sincerely,<br>The Plan Beyond Team</p>
            <hr style="border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777;">This email was sent because you were added as an ambassador. If you believe this was a mistake, please contact us.</p>
          </div>
        `,
        text: `
Hi ${ambassador.first_name},

You’ve been invited to join The Plan Beyond as an Ambassador — a support role with purpose.

As a Secondary Ambassador, you’ll be able to review key parts of a trusted person’s digital plan. This could include confirming wishes, accessing shared documents, or simply being there when needed.

Your presence matters, and your role ensures no detail gets missed when it matters most.

Accept Invitation: ${acceptLink}

Accepting your invitation takes less than a minute and gives you secure access to fulfill your role when the time is right.

Questions? Reach us at support@theplanbeyond.com

Sincerely,
The Plan Beyond Team
        `,
      };
    }

    // Send email
    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Ambassador invitation sent successfully.",
    });
  } catch (err) {
    console.error("Error processing ambassador invite:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

// API endpoint to accept ambassador invite
app.get("/api/accept-invite", async (req, res) => {
  const { userId, ambassadorId } = req.query;

  console.log("Accept Invite - Query Parameters:", { userId, ambassadorId });

  if (!userId || !ambassadorId) {
    console.error("Missing userId or ambassadorId");
    return res.status(400).json({
      success: false,
      message: "User ID and Ambassador ID are required.",
    });
  }

  const parsedUserId = parseInt(userId, 10);
  const parsedAmbassadorId = parseInt(ambassadorId, 10);

  if (isNaN(parsedUserId) || isNaN(parsedAmbassadorId)) {
    console.error("Invalid userId or ambassadorId format:", {
      userId,
      ambassadorId,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid User ID or Ambassador ID format.",
    });
  }

  try {
    await pool.query("START TRANSACTION");

    try {
      const [ambassadors] = await pool.query(
        "SELECT email, ambassador_type FROM ambassadors WHERE id = ? AND user_id = ?",
        [parsedAmbassadorId, parsedUserId]
      );

      if (!ambassadors.length) {
        console.error("Ambassador not found or not associated with user:", {
          ambassadorId: parsedAmbassadorId,
          userId: parsedUserId,
        });
        await pool.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Invalid invitation link.",
        });
      }

      const [ambassadorStatus] = await pool.query(
        "SELECT ambassador_accept FROM ambassadors WHERE id = ? AND user_id = ?",
        [parsedAmbassadorId, parsedUserId]
      );

      if (
        ambassadorStatus.length &&
        ambassadorStatus[0].ambassador_accept === 1
      ) {
        console.warn("Invitation already accepted in ambassadors table:", {
          userId: parsedUserId,
          ambassadorId: parsedAmbassadorId,
        });
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Invitation already accepted.",
        });
      }

      const [ambassadorUpdateResult] = await pool.query(
        "UPDATE ambassadors SET ambassador_accept = 1 WHERE id = ? AND user_id = ? AND ambassador_accept = 0",
        [parsedAmbassadorId, parsedUserId]
      );

      if (ambassadorUpdateResult.affectedRows === 0) {
        console.error("No rows updated in ambassadors:", {
          userId: parsedUserId,
          ambassadorId: parsedAmbassadorId,
        });
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message:
            "Failed to accept invitation in ambassadors table. It may have already been accepted or does not exist.",
        });
      }

      // For Primary ambassadors, update users table if user exists
      if (ambassadors[0].ambassador_type === "Primary") {
        const [users] = await pool.query(
          "SELECT id, ambassador_accept FROM users WHERE ambassador_id = ? AND ambassador_user_id = ?",
          [parsedAmbassadorId, parsedUserId]
        );

        if (!users.length) {
          console.warn("No user entry found for Primary ambassador:", {
            userId: parsedUserId,
            ambassadorId: parsedAmbassadorId,
          });
        } else {
          if (users[0].ambassador_accept === 1) {
            console.warn("Invitation already accepted in users table:", {
              userId: parsedUserId,
              ambassadorId: parsedAmbassadorId,
            });
            await pool.query("ROLLBACK");
            return res.status(400).json({
              success: false,
              message: "Invitation already accepted.",
            });
          }

          const [userUpdateResult] = await pool.query(
            "UPDATE users SET ambassador_accept = 1 WHERE ambassador_id = ? AND ambassador_user_id = ? AND ambassador_accept = 0",
            [parsedAmbassadorId, parsedUserId]
          );

          if (userUpdateResult.affectedRows === 0) {
            console.error("No rows updated in users:", {
              userId: parsedUserId,
              ambassadorId: parsedAmbassadorId,
            });
            await pool.query("ROLLBACK");
            return res.status(400).json({
              success: false,
              message:
                "Failed to accept invitation in users table. It may have already been accepted or does not exist.",
            });
          }
        }
      }

      await pool.query("COMMIT");
      console.log("Invitation accepted successfully:", {
        userId: parsedUserId,
        ambassadorId: parsedAmbassadorId,
      });

      if (
        req.headers["accept"] &&
        req.headers["accept"].includes("text/html")
      ) {
        const redirectUrl = `${process.env.FRONTEND_URL
          }/confirmation?message=${encodeURIComponent(
            "Invitation accepted successfully"
          )}`;
        console.log("Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      } else {
        return res.json({
          success: true,
          message: "Invitation accepted successfully.",
        });
      }
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error("Error during invitation acceptance transaction:", err);
      return res.status(500).json({
        success: false,
        message: `Server error during acceptance: ${err.message || "Unknown error occurred."
          }`,
      });
    }
  } catch (err) {
    console.error("Error accepting invite:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

app.get("/api/get-ambassador-data", async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated.",
    });
  }

  try {
    // Step 1: Fetch user data from users table
    const [users] = await pool.query(
      "SELECT ambassador_id, ambassador_user_id FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = users[0];
    let ambassador;

    // Step 2: Determine if user is an ambassador or main user
    if (user.ambassador_id) {
      // User is an ambassador, fetch their own details
      const [ambassadors] = await pool.query(
        "SELECT first_name, relationship, email FROM ambassadors WHERE id = ?",
        [user.ambassador_id]
      );
      if (ambassadors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ambassador not found.",
        });
      }
      ambassador = ambassadors[0];
    } else if (user.ambassador_user_id) {
      // User is a main user, fetch Secondary ambassador
      const [ambassadors] = await pool.query(
        "SELECT first_name, relationship, email FROM ambassadors WHERE user_id = ? AND ambassador_type = 'Secondary'",
        [user.ambassador_user_id]
      );
      if (ambassadors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Secondary ambassador found.",
        });
      }
      ambassador = ambassadors[0];
    } else {
      return res.status(404).json({
        success: false,
        message: "No ambassador associated with this user.",
      });
    }

    return res.json({
      success: true,
      ambassador: {
        first_name: ambassador.first_name,
        relationship: ambassador.relationship || "Friend",
        email: ambassador.email,
      },
    });
  } catch (err) {
    console.error("Error fetching ambassador data:", err);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});
app.post(
  "/api/upload-video",
  checkAuth,
  videoUpload.single("file"),
  async (req, res) => {
    try {
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
        req.session.userId,
      ]);
      if (users.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No video file uploaded." });
      }

      const { contacts, notes, delivery_date } = req.body;
      if (!contacts) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      let parsedContacts;
      try {
        parsedContacts = JSON.parse(contacts);
        if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid contacts data." });
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid contacts format." });
      }

      const contactFields = {
        contact1: parsedContacts[0]?.phone_number || null,
        contact_name1: parsedContacts[0]?.name || null,
        contact2: parsedContacts[1]?.phone_number || null,
        contact_name2: parsedContacts[1]?.name || null,
        contact3: parsedContacts[2]?.phone_number || null,
        contact_name3: parsedContacts[2]?.name || null,
        contact4: parsedContacts[3]?.phone_number || null,
        contact_name4: parsedContacts[3]?.name || null,
        contact5: parsedContacts[4]?.phone_number || null,
        contact_name5: parsedContacts[4]?.name || null,
      };

      if (!contactFields.contact1) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      if (!delivery_date) {
        return res.status(400).json({
          success: false,
          message: "Delivery date is required.",
        });
      }

      const videoPath = `videos/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `INSERT INTO video_message (
          user_id, video_path, notes, delivery_date,
          contact1, contact_name1,
          contact2, contact_name2,
          contact3, contact_name3,
          contact4, contact_name4,
          contact5, contact_name5
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          videoPath,
          notes || null,
          delivery_date || null,
          contactFields.contact1,
          contactFields.contact_name1,
          contactFields.contact2,
          contactFields.contact_name2,
          contactFields.contact3,
          contactFields.contact_name3,
          contactFields.contact4,
          contactFields.contact_name4,
          contactFields.contact5,
          contactFields.contact_name5,
        ]
      );

      res.json({ success: true, message: "Video uploaded successfully." });
    } catch (err) {
      console.error("Error uploading video:", err);
      if (req.file) {
        const filePath = path.join(__dirname, req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res
        .status(500)
        .json({ success: false, message: `Server error: ${err.message}` });
    }
  }
);

app.get("/api/videos", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const [videos] = await pool.query(
      `SELECT id, video_path, notes, delivery_date,
              contact1, contact_name1,
              contact2, contact_name2,
              contact3, contact_name3,
              contact4, contact_name4,
              contact5, contact_name5,
              created_at
       FROM video_message
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const formattedVideos = videos.map((video) => {
      const contacts = [
        { phone_number: video.contact1, name: video.contact_name1 },
        { phone_number: video.contact2, name: video.contact_name2 },
        { phone_number: video.contact3, name: video.contact_name3 },
        { phone_number: video.contact4, name: video.contact_name4 },
        { phone_number: video.contact5, name: video.contact_name5 },
      ].filter((contact) => contact.phone_number && contact.name);

      return {
        id: video.id,
        video_path: video.video_path,
        notes: video.notes || "",
        delivery_date: video.delivery_date || null,
        contacts: contacts,
        created_at: video.created_at,
      };
    });

    res.json({ success: true, videos: formattedVideos });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.put(
  "/api/videos/:id",
  checkAuth,
  videoUpload.single("file"),
  async (req, res) => {
    try {
      const videoId = req.params.id;
      const userId = req.session.userId;
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
        userId,
      ]);
      if (users.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      const [videos] = await pool.query(
        "SELECT video_path FROM video_message WHERE id = ? AND user_id = ?",
        [videoId, userId]
      );
      if (videos.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Video not found." });
      }

      const existingVideo = videos[0];
      let videoPath = existingVideo.video_path;

      if (req.file) {
        const oldFilePath = path.join(__dirname, existingVideo.video_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        videoPath = `videos/${userId}/${req.file.filename}`;
      }

      const { contacts, notes, delivery_date } = req.body;
      let parsedContacts = [];
      if (contacts) {
        try {
          parsedContacts = JSON.parse(contacts);
          if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid contacts data." });
          }
        } catch (err) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid contacts format." });
        }
      }

      const contactFields = {
        contact1: parsedContacts[0]?.phone_number || null,
        contact_name1: parsedContacts[0]?.name || null,
        contact2: parsedContacts[1]?.phone_number || null,
        contact_name2: parsedContacts[1]?.name || null,
        contact3: parsedContacts[2]?.phone_number || null,
        contact_name3: parsedContacts[2]?.name || null,
        contact4: parsedContacts[3]?.phone_number || null,
        contact_name4: parsedContacts[3]?.name || null,
        contact5: parsedContacts[4]?.phone_number || null,
        contact_name5: parsedContacts[4]?.name || null,
      };
      if (contacts && !contactFields.contact1) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      if (!delivery_date) {
        return res.status(400).json({
          success: false,
          message: "Delivery date is required.",
        });
      }

      await pool.query(
        `UPDATE video_message
         SET video_path = ?, notes = ?, delivery_date = ?,
             contact1 = ?, contact_name1 = ?,
             contact2 = ?, contact_name2 = ?,
             contact3 = ?, contact_name3 = ?,
             contact4 = ?, contact_name4 = ?,
             contact5 = ?, contact_name5 = ?
         WHERE id = ? AND user_id = ?`,
        [
          videoPath,
          notes || null,
          delivery_date || null,
          contactFields.contact1,
          contactFields.contact_name1,
          contactFields.contact2,
          contactFields.contact_name2,
          contactFields.contact3,
          contactFields.contact_name3,
          contactFields.contact4,
          contactFields.contact_name4,
          contactFields.contact5,
          contactFields.contact_name5,
          videoId,
          userId,
        ]
      );

      res.json({ success: true, message: "Video updated successfully." });
    } catch (err) {
      console.error("Error updating video:", err);
      if (req.file) {
        const filePath = path.join(__dirname, req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res
        .status(500)
        .json({ success: false, message: `Server error: ${err.message}` });
    }
  }
);

app.delete("/api/videos/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.session.userId;

    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    const [videos] = await pool.query(
      "SELECT video_path FROM video_message WHERE id = ? AND user_id = ?",
      [videoId, userId]
    );
    if (videos.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found." });
    }

    const videoPath = path.join(__dirname, videos[0].video_path);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    await pool.query("DELETE FROM video_message WHERE id = ? AND user_id = ?", [
      videoId,
      userId,
    ]);

    res.json({ success: true, message: "Video deleted successfully." });
  } catch (err) {
    console.error("Error deleting video:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.post(
  "/api/upload-image",
  checkAuth,
  imageUpload.single("file"),
  async (req, res) => {
    try {
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
        req.session.userId,
      ]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file uploaded." });
      }

      const { contacts, notes, delivery_date } = req.body;
      if (!contacts) {
        return res.status(400).json({ success: false, message: "At least one contact is required." });
      }

      let parsedContacts;
      try {
        parsedContacts = JSON.parse(contacts);
        if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
          return res.status(400).json({ success: false, message: "Invalid contacts data." });
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid contacts format." });
      }

      const contactFields = {
        contact1: parsedContacts[0]?.phone_number || null,
        contact_name1: parsedContacts[0]?.name || null,
        contact2: parsedContacts[1]?.phone_number || null,
        contact_name2: parsedContacts[1]?.name || null,
        contact3: parsedContacts[2]?.phone_number || null,
        contact_name3: parsedContacts[2]?.name || null,
        contact4: parsedContacts[3]?.phone_number || null,
        contact_name4: parsedContacts[3]?.name || null,
        contact5: parsedContacts[4]?.phone_number || null,
        contact_name5: parsedContacts[4]?.name || null,
      };

      if (!contactFields.contact1) {
        return res.status(400).json({ success: false, message: "At least one contact is required." });
      }

      if (!delivery_date) {
        return res.status(400).json({ success: false, message: "Delivery date is required." });
      }

      const imagePath = `images/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `INSERT INTO image_message (
          user_id, image_path, notes, delivery_date,
          contact1, contact_name1,
          contact2, contact_name2,
          contact3, contact_name3,
          contact4, contact_name4,
          contact5, contact_name5
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          imagePath,
          notes || null,
          delivery_date || null,
          contactFields.contact1,
          contactFields.contact_name1,
          contactFields.contact2,
          contactFields.contact_name2,
          contactFields.contact3,
          contactFields.contact_name3,
          contactFields.contact4,
          contactFields.contact_name4,
          contactFields.contact5,
          contactFields.contact_name5,
        ]
      );

      res.json({ success: true, message: "Image uploaded successfully." });
    } catch (err) {
      console.error("Error uploading image:", err);
      if (req.file) {
        const filePath = path.join(__dirname, req.file.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      res.status(500).json({ success: false, message: `Server error: ${err.message}` });
    }
  }
);

app.get("/api/images", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [images] = await pool.query(
      `SELECT id, image_path, notes, delivery_date,
              contact1, contact_name1,
              contact2, contact_name2,
              contact3, contact_name3,
              contact4, contact_name4,
              contact5, contact_name5,
              created_at
       FROM image_message
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const formattedImages = images.map((img) => {
      const contacts = [
        { phone_number: img.contact1, name: img.contact_name1 },
        { phone_number: img.contact2, name: img.contact_name2 },
        { phone_number: img.contact3, name: img.contact_name3 },
        { phone_number: img.contact4, name: img.contact_name4 },
        { phone_number: img.contact5, name: img.contact_name5 },
      ].filter((c) => c.phone_number && c.name);

      return {
        id: img.id,
        image_path: img.image_path,
        notes: img.notes || "",
        delivery_date: img.delivery_date || null,
        contacts,
        created_at: img.created_at,
      };
    });

    res.json({ success: true, images: formattedImages });
  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.get("/api/images", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [images] = await pool.query(
      `SELECT id, image_path, notes, delivery_date,
              contact1, contact_name1,
              contact2, contact_name2,
              contact3, contact_name3,
              contact4, contact_name4,
              contact5, contact_name5,
              created_at
       FROM image_message
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const formattedImages = images.map((img) => {
      const contacts = [
        { phone_number: img.contact1, name: img.contact_name1 },
        { phone_number: img.contact2, name: img.contact_name2 },
        { phone_number: img.contact3, name: img.contact_name3 },
        { phone_number: img.contact4, name: img.contact_name4 },
        { phone_number: img.contact5, name: img.contact_name5 },
      ].filter((c) => c.phone_number && c.name);

      return {
        id: img.id,
        image_path: img.image_path,
        notes: img.notes || "",
        delivery_date: img.delivery_date || null,
        contacts,
        created_at: img.created_at,
      };
    });

    res.json({ success: true, images: formattedImages });
  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.delete("/api/images/:id", checkAuth, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.session.userId;

    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const [images] = await pool.query("SELECT image_path FROM image_message WHERE id = ? AND user_id = ?", [imageId, userId]);
    if (images.length === 0) {
      return res.status(404).json({ success: false, message: "Image not found." });
    }

    const imagePath = path.join(__dirname, images[0].image_path);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await pool.query("DELETE FROM image_message WHERE id = ? AND user_id = ?", [imageId, userId]);

    res.json({ success: true, message: "Image deleted successfully." });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
});


app.post(
  "/api/add-user-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { category, details } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (category !== "ids") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    }

    try {
      const parsedDetails = JSON.parse(details);
      const { type, number, location, notes, nomineeContact } = parsedDetails;

      if (!type) {
        return res
          .status(400)
          .json({ success: false, message: "ID type is required" });
      }

      // Validate allowed ID types
      const allowedTypes = [
        "Aadhaar Card",
        "Voter ID",
        "Passport",
        "Driver’s License",
        "PAN Card",
        "Other ID",
      ];
      if (!allowedTypes.includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid ID type" });
      }

      // Check for existing ID of the same type
      const [existing] = await pool.query(
        "SELECT id FROM government_id WHERE user_id = ? AND type = ?",
        [userId, type]
      );
      if (existing.length > 0) {
        if (file) {
          fs.unlinkSync(path.join(__dirname, file.path));
        }
        return res.status(400).json({
          success: false,
          message: `An ${type} already exists for this user`,
        });
      }

      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO government_id (user_id, type, number, location, file_path, filename, notes, nominee_contact)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          type,
          number || null,
          location || null,
          filePath,
          filename,
          notes || null,
          nomineeContact || null,
        ]
      );

      res.json({ success: true, message: "Government ID added successfully" });
    } catch (err) {
      console.error("Error adding government ID:", err);
      if (file) {
        fs.unlinkSync(path.join(__dirname, file.path)); // Clean up on error
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-user-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { category, details } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const recordId = req.params.id;

    if (category !== "ids") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    }

    try {
      const parsedDetails = JSON.parse(details);
      const { type, number, location, notes, nomineeContact } = parsedDetails;

      if (!type) {
        return res
          .status(400)
          .json({ success: false, message: "ID type is required" });
      }

      const allowedTypes = [
        "Aadhaar Card",
        "Voter ID",
        "Passport",
        "Driver’s License",
        "PAN Card",
        "Other ID",
      ];
      if (!allowedTypes.includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid ID type" });
      }

      // Fetch the existing record
      const [existing] = await pool.query(
        "SELECT * FROM government_id WHERE id = ? AND user_id = ?",
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (file) {
          fs.unlinkSync(path.join(__dirname, file.path)); // Clean up uploaded file
        }
        return res.status(404).json({
          success: false,
          message: "Government ID not found for this user",
        });
      }

      const oldRecord = existing[0];

      // If the type is changed, ensure no other record with the new type exists
      if (oldRecord.type !== type) {
        const [typeExists] = await pool.query(
          "SELECT id FROM government_id WHERE user_id = ? AND type = ? AND id != ?",
          [userId, type, recordId]
        );
        if (typeExists.length > 0) {
          if (file) {
            fs.unlinkSync(path.join(__dirname, file.path));
          }
          return res.status(400).json({
            success: false,
            message: `Another ${type} already exists for this user`,
          });
        }
      }

      let filePath = oldRecord.file_path;
      let filename = oldRecord.filename;

      // Handle file replacement
      if (file) {
        // Delete old file
        if (oldRecord.file_path) {
          const oldFilePath = path.join(__dirname, oldRecord.file_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      // Update record
      await pool.query(
        `UPDATE government_id 
         SET type = ?, number = ?, location = ?, file_path = ?, filename = ?, notes = ?, nominee_contact = ?
         WHERE id = ? AND user_id = ?`,
        [
          type,
          number || null,
          location || null,
          filePath,
          filename,
          notes || null,
          nomineeContact || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Government ID updated successfully",
      });
    } catch (err) {
      console.error("Error editing government ID:", err);
      if (file) {
        fs.unlinkSync(path.join(__dirname, file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// NEW: Endpoint to get all government IDs for a user
app.get("/api/get-government-ids", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [ids] = await pool.query(
      `SELECT id, type, number, location, file_path, filename, notes, nominee_contact, created_at
       FROM government_id WHERE user_id = ?`,
      [userId]
    );

    const formattedIds = ids.map((id) => ({
      id: id.id,
      type: id.type,
      number: id.number || "",
      location: id.location || "",
      file_path: id.file_path || "",
      filename: id.filename || "",
      notes: id.notes || "",
      nomineeContact: id.nominee_contact || "",
      created_at: id.created_at,
    }));

    res.json({ success: true, ids: formattedIds });
  } catch (err) {
    console.error("Error fetching government IDs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-employment-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      type,
      organisation,
      joiningDate,
      leavingDate,
      supervisorContact,
      employmentType,
      jobTitle,
      employmentId,
      benefitsType,
      benefitsDetails,
      nomineeContact,
      notes,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (!type) {
      if (file) fs.unlinkSync(file.path); // Use file.path directly
      return res
        .status(400)
        .json({ success: false, message: "Employment type is required" });
    }

    try {
      const allowedTypes = [
        "Work for a company",
        "Self-employed",
        "Retired",
        "Other",
      ];
      if (!allowedTypes.includes(type)) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ success: false, message: "Invalid employment type" });
      }

      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO employment (
        user_id, employment_type, organisation_name, joining_date, leaving_date,
        hr_contact, job_type, full_part, employee_id, employment_benefit,
        benefit_number, employment_file, filename, nominee_contact, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          type,
          organisation,
          joiningDate,
          leavingDate,
          supervisorContact,
          jobTitle,
          employmentType,
          employmentId,
          benefitsType,
          benefitsDetails,
          filePath,
          filename,
          nomineeContact,
          notes,
        ]
      );
      res.json({
        success: true,
        message: "Employment detail added successfully",
      });
    } catch (err) {
      console.error("Error adding employment detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-employment-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      type,
      organisation,
      joiningDate,
      leavingDate,
      supervisorContact,
      employmentType,
      jobTitle,
      employmentId,
      benefitsType,
      benefitsDetails,
      nomineeContact,
      notes,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const recordId = req.params.id;

    if (!type) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Employment type is required" });
    }

    try {
      const allowedTypes = [
        "Work for a company",
        "Self-employed",
        "Retired",
        "Other",
      ];
      if (!allowedTypes.includes(type)) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ success: false, message: "Invalid employment type" });
      }

      // Fetch existing record
      const [existing] = await pool.query(
        "SELECT * FROM employment WHERE id = ? AND user_id = ?",
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(404)
          .json({ success: false, message: "Employment record not found" });
      }

      const oldRecord = existing[0];
      let filePath = oldRecord.employment_file;
      let filename = oldRecord.filename;

      // If a new file is uploaded, replace the old one
      if (file) {
        if (oldRecord.employment_file) {
          const oldFilePath = path.join(__dirname, oldRecord.employment_file);
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE employment SET
          employment_type = ?, organisation_name = ?, joining_date = ?, leaving_date = ?,
          hr_contact = ?, job_type = ?, full_part = ?, employee_id = ?, employment_benefit = ?,
          benefit_number = ?, employment_file = ?, filename = ?, nominee_contact = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          type,
          organisation,
          joiningDate,
          leavingDate,
          supervisorContact,
          jobTitle,
          employmentType,
          employmentId,
          benefitsType,
          benefitsDetails,
          filePath,
          filename,
          nomineeContact,
          notes,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Employment detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing employment detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Endpoint to fetch employment details (unchanged)
app.get("/api/employment-detail", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, employment_type, organisation_name, joining_date, leaving_date,
              hr_contact, job_type, full_part, employee_id, employment_benefit,
              benefit_number, employment_file, filename, notes, nominee_contact, created_at
       FROM employment WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      type: record.employment_type,
      organisation_name: record.organisation_name || "",
      joining_date: record.joining_date || "",
      leaving_date: record.leaving_date || "",
      hr_contact: record.hr_contact || "",
      job_type: record.job_type || "",
      full_part: record.full_part || "",
      employee_id: record.employee_id || "",
      employment_benefit: record.employment_benefit || "",
      benefit_number: record.benefit_number || "",
      file_path: record.employment_file || "",
      filename: record.filename || "",
      nomineeContact: record.nominee_contact || "",
      notes: record.notes || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching employment details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/add-religion-detail", checkAuth, async (req, res) => {
  const { religion, religion1, nomineeContact } = req.body;
  const userId = req.session.userId;

  if (!religion) {
    return res
      .status(400)
      .json({ success: false, message: "Religion is required" });
  }

  try {
    const allowedReligions = [
      "Hindu",
      "Muslim",
      "Sikh",
      "Christian",
      "Jain",
      "Buddhist",
      "Others",
    ];
    if (!allowedReligions.includes(religion)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid religion selected" });
    }

    if (religion === "Others" && !religion1) {
      return res.status(400).json({
        success: false,
        message: "Please specify the religion for 'Others'",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM religious WHERE user_id = ?",
      [userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A religion is already exists.",
      });
    }

    await pool.query(
      `INSERT INTO religious (user_id, religion, religion1, nominee_contact)
       VALUES (?, ?, ?, ?)`,
      [userId, religion, religion1 || null, nomineeContact || null]
    );

    res.json({ success: true, message: "Religion detail added successfully" });
  } catch (err) {
    console.error("Error adding religion detail:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/edit-religion-detail/:id", checkAuth, async (req, res) => {
  const { religion, religion1, nomineeContact } = req.body;
  const userId = req.session.userId;
  const recordId = req.params.id;

  if (!religion) {
    return res
      .status(400)
      .json({ success: false, message: "Religion is required" });
  }

  try {
    const allowedReligions = [
      "Hindu",
      "Muslim",
      "Sikh",
      "Christian",
      "Jain",
      "Buddhist",
      "Others",
    ];

    if (!allowedReligions.includes(religion)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid religion selected" });
    }

    if (religion === "Others" && !religion1) {
      return res.status(400).json({
        success: false,
        message: "Please specify the religion for 'Others'",
      });
    }

    // Check if record exists for the user and id
    const [existing] = await pool.query(
      "SELECT id FROM religious WHERE id = ? AND user_id = ?",
      [recordId, userId]
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Religion record not found" });
    }

    await pool.query(
      `UPDATE religious
       SET religion = ?, religion1 = ?, nominee_contact = ?
       WHERE id = ? AND user_id = ?`,
      [religion, religion1 || null, nomineeContact || null, recordId, userId]
    );

    res.json({
      success: true,
      message: "Religion detail updated successfully",
    });
  } catch (err) {
    console.error("Error editing religion detail:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Endpoint to fetch religion details
app.get("/api/get-religion-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, religion, religion1, nominee_contact, created_at
       FROM religious WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      religion: record.religion,
      religion1: record.religion1 || "",
      nomineeContact: record.nominee_contact || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching religion details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-charity-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const {
      charity_name,
      charity_website,
      payment_method,
      amount,
      frequency,
      nomineeContact,
      enrolled,
      notes,
    } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    if (!charity_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Charity name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO charities (
        user_id, charity_name, charity_website, payment_method, amount, frequency,
        enrolled, charity_file, filename, nominee_contact, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          charity_name,
          charity_website || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "true" ? 1 : 0,
          filePath,
          filename,
          nomineeContact,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Charity detail added successfully" });
    } catch (err) {
      console.error("Error adding charity detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-charity-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const {
      charity_name,
      charity_website,
      payment_method,
      amount,
      frequency,
      nomineeContact,
      enrolled,
      notes,
    } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const charityId = req.params.id;

    if (!charity_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Charity name is required" });
    }

    try {
      // Check if charity entry exists and belongs to the user
      const [existing] = await pool.query(
        "SELECT charity_file FROM charities WHERE id = ? AND user_id = ?",
        [charityId, userId]
      );

      if (existing.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Charity record not found" });
      }

      let filePath = existing[0].charity_file;
      let filename = null;

      // Replace old file with new one (if uploaded)
      const file = files.length > 0 ? files[0] : null;
      if (file) {
        if (filePath && fs.existsSync(path.join(__dirname, filePath))) {
          fs.unlinkSync(path.join(__dirname, filePath));
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE charities SET
          charity_name = ?, charity_website = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, charity_file = ?, filename = ?, nominee_contact = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          charity_name,
          charity_website || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "true" ? 1 : 0,
          filePath,
          filename,
          nomineeContact || null,
          notes || null,
          charityId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Charity detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing charity detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Endpoint to fetch charity details
app.get("/api/get-charity-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, charity_name, charity_website, payment_method, amount, frequency,
              enrolled, charity_file, filename, notes, nominee_contact, created_at
       FROM charities WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      charity_name: record.charity_name,
      charity_website: record.charity_website || "",
      payment_method: record.payment_method || "",
      amount: record.amount || "",
      frequency: record.frequency || "",
      enrolled: record.enrolled === 1,
      charity_file: record.charity_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      nomineeContact: record.nominee_contact || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching charity details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-club-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { club, club_name, club_contact, notes, nomineeContact } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (!club) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Club is required" });
    }

    try {
      const allowedClubs = [
        "Gymkhana Clubs",
        "Rotary Club of India",
        "Lions Club International – India Chapters",
        "Round Table India",
        "Inner Wheel Club (women’s wing of Rotary)",
        "Toastmasters India",
        "Jaycees India (JCI)",
        "Others",
      ];
      if (!allowedClubs.includes(club)) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ success: false, message: "Invalid club selected" });
      }

      if (club === "Others" && !club_name) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: "Please specify the club name for 'Others'",
        });
      }

      // Check for existing club record
      const [existing] = await pool.query(
        "SELECT id FROM clubs WHERE user_id = ?",
        [userId]
      );
      if (existing.length > 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: "A club record already exists for this user",
        });
      }

      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO clubs (
        user_id, club, club_name, club_contact, club_file, filename, nominee_contact, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          club,
          club_name || null,
          club_contact || null,
          filePath,
          filename,
          nomineeContact || null,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Club detail added successfully" });
    } catch (err) {
      console.error("Error adding club detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-club-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { club, club_name, club_contact, notes, nomineeContact } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const recordId = req.params.id; // ID of the club record to update

    if (!club) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Club is required" });
    }

    try {
      const allowedClubs = [
        "Gymkhana Clubs",
        "Rotary Club of India",
        "Lions Club International – India Chapters",
        "Round Table India",
        "Inner Wheel Club (women’s wing of Rotary)",
        "Toastmasters India",
        "Jaycees India (JCI)",
        "Others",
      ];

      if (!allowedClubs.includes(club)) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(400)
          .json({ success: false, message: "Invalid club selected" });
      }

      if (club === "Others" && !club_name) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: "Please specify the club name for 'Others'",
        });
      }

      // Check if the club record exists and belongs to this user
      const [existing] = await pool.query(
        "SELECT club_file FROM clubs WHERE id = ? AND user_id = ?",
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(404)
          .json({ success: false, message: "Club record not found" });
      }

      let filePath = existing[0].club_file;
      let filename = null;

      // If a new file is uploaded, replace the old one
      if (file) {
        // Remove old file
        if (filePath && fs.existsSync(path.join(__dirname, filePath))) {
          fs.unlinkSync(path.join(__dirname, filePath));
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE clubs SET
          club = ?, club_name = ?, club_contact = ?, club_file = ?, filename = ?,
          nominee_contact = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          club,
          club_name || null,
          club_contact || null,
          filePath,
          filename,
          nomineeContact || null,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({ success: true, message: "Club detail updated successfully" });
    } catch (err) {
      console.error("Error editing club detail:", err);
      if (file) fs.unlinkSync(file.path); // Clean up uploaded file on error
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-club-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, club, club_name, club_contact, club_file, filename, notes, nominee_contact, created_at
       FROM clubs WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      club: record.club,
      club_name: record.club_name || "",
      club_contact: record.club_contact || "",
      club_file: record.club_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      nomineeContact: record.nominee_contact || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching club details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-degree-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      university_name,
      degree,
      degree_field,
      degree_start,
      degree_end,
      grade,
      activities,
      notes,
      nomineeContact,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (!university_name || !degree) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "University name and degree are required",
      });
    }

    try {
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO degrees (
        user_id, university_name, degree, degree_field, degree_start, degree_end,
        grade, activities, degree_file, filename, notes, nominee_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          university_name,
          degree,
          degree_field || null,
          degree_start || null,
          degree_end || null,
          grade || null,
          activities || null,
          filePath,
          filename,
          notes || null,
          nomineeContact || null,
        ]
      );

      res.json({ success: true, message: "Degree detail added successfully" });
    } catch (err) {
      console.error("Error adding degree detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-degree-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      university_name,
      degree,
      degree_field,
      degree_start,
      degree_end,
      grade,
      activities,
      notes,
      nomineeContact,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const degreeId = req.params.id;

    if (!university_name || !degree) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "University name and degree are required",
      });
    }

    try {
      // Check if record exists and belongs to user
      const [existing] = await pool.query(
        "SELECT degree_file FROM degrees WHERE id = ? AND user_id = ?",
        [degreeId, userId]
      );

      if (existing.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({
          success: false,
          message: "Degree record not found",
        });
      }

      let filePath = existing[0].degree_file;
      let filename = null;

      // Replace file if new one is uploaded
      if (file) {
        if (filePath && fs.existsSync(path.join(__dirname, filePath))) {
          fs.unlinkSync(path.join(__dirname, filePath));
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE degrees SET
          university_name = ?, degree = ?, degree_field = ?, degree_start = ?, degree_end = ?,
          grade = ?, activities = ?, degree_file = ?, filename = ?, notes = ?, nominee_contact = ?
         WHERE id = ? AND user_id = ?`,
        [
          university_name,
          degree,
          degree_field || null,
          degree_start || null,
          degree_end || null,
          grade || null,
          activities || null,
          filePath,
          filename,
          notes || null,
          nomineeContact || null,
          degreeId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Degree detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing degree detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-degree-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, university_name, degree, degree_field, degree_start, degree_end,
              grade, activities, degree_file, filename, notes, nominee_contact, created_at
       FROM degrees WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      university_name: record.university_name,
      degree: record.degree,
      degree_field: record.degree_field || "",
      degree_start: record.degree_start
        ? record.degree_start.toISOString().split("T")[0]
        : "",
      degree_end: record.degree_end
        ? record.degree_end.toISOString().split("T")[0]
        : "",
      grade: record.grade || "",
      activities: record.activities || "",
      degree_file: record.degree_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      nomineeContact: record.nominee_contact || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching degree details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-military-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      military_branch,
      military_name,
      military_rank,
      military_serve,
      military_location,
      notes,
      nomineeContact,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (!military_branch) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Military branch is required" });
    }
    if (military_branch === "Others" && !military_name) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "Branch name is required for 'Others'",
      });
    }

    try {
      // Check if a military record already exists for the user
      const [existing] = await pool.query(
        `SELECT id FROM military WHERE user_id = ?`,
        [userId]
      );
      if (existing.length > 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: "Military record already exists for this user",
        });
      }

      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO military (
        user_id, military_branch, military_name, military_rank, military_serve, military_location, military_file, filename, nominee_contact, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          military_branch,
          military_branch === "Others" ? military_name : null,
          military_rank || null,
          military_serve || null,
          military_location || null,
          filePath,
          filename,
          nomineeContact,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Military detail added successfully",
      });
    } catch (err) {
      console.error("Error adding military detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-military-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const {
      military_branch,
      military_name,
      military_rank,
      military_serve,
      military_location,
      notes,
      nomineeContact,
    } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const recordId = req.params.id;

    if (!military_branch) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Military branch is required" });
    }

    if (military_branch === "Others" && !military_name) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: "Branch name is required for 'Others'",
      });
    }

    try {
      const [existing] = await pool.query(
        `SELECT military_file FROM military WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({
          success: false,
          message: "Military record not found",
        });
      }

      let filePath = existing[0].military_file;
      let filename = null;

      if (file) {
        // Delete old file if exists
        if (filePath && fs.existsSync(path.join(__dirname, filePath))) {
          fs.unlinkSync(path.join(__dirname, filePath));
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE military SET
          military_branch = ?, military_name = ?, military_rank = ?, military_serve = ?,
          military_location = ?, military_file = ?, filename = ?, nominee_contact = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          military_branch,
          military_branch === "Others" ? military_name : null,
          military_rank || null,
          military_serve || null,
          military_location || null,
          filePath,
          filename,
          nomineeContact || null,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Military detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing military detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-military-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, military_branch, military_name, military_rank, military_serve, military_location, military_file, filename, notes, created_at, nominee_contact
       FROM military WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      military_branch: record.military_branch || "",
      military_name: record.military_name || "",
      military_rank: record.military_rank || "",
      military_serve: record.military_serve || "",
      military_location: record.military_location || "",
      military_file: record.military_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      created_at: record.created_at,
      nomineeContact: record.nominee_contact,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching military details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-miscellaneous-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { item, description, notes, nomineeContact } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    if (!item) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Item name is required" });
    }

    try {
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO miscellaneous (
        user_id, item, description, miscellaneous_file, filename, notes, nominee_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          item,
          description || null,
          filePath,
          filename,
          notes || null,
          nomineeContact,
        ]
      );

      res.json({
        success: true,
        message: "Miscellaneous detail added successfully",
      });
    } catch (err) {
      console.error("Error adding miscellaneous detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-miscellaneous-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { item, description, notes, nomineeContact } = req.body;
    const file = req.file;
    const userId = req.session.userId;
    const recordId = req.params.id;

    if (!item) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Item name is required" });
    }

    try {
      const [existing] = await pool.query(
        `SELECT miscellaneous_file FROM miscellaneous WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (file) fs.unlinkSync(file.path);
        return res.status(404).json({
          success: false,
          message: "Miscellaneous record not found",
        });
      }

      let filePath = existing[0].miscellaneous_file;
      let filename = null;

      if (file) {
        // Delete old file if it exists
        if (filePath && fs.existsSync(path.join(__dirname, filePath))) {
          fs.unlinkSync(path.join(__dirname, filePath));
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE miscellaneous SET
          item = ?, description = ?, miscellaneous_file = ?, filename = ?, notes = ?, nominee_contact = ?
        WHERE id = ? AND user_id = ?`,
        [
          item,
          description || null,
          filePath,
          filename,
          notes || null,
          nomineeContact || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Miscellaneous detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing miscellaneous detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-miscellaneous-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, item, description, miscellaneous_file, filename, notes, created_at, nominee_contact
       FROM miscellaneous WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      item: record.item,
      description: record.description || "",
      miscellaneous_file: record.miscellaneous_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      created_at: record.created_at,
      nomineeContact: record.nominee_contact,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching miscellaneous details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/delete-personal-detail", checkAuth, async (req, res) => {
  const { category, id } = req.body;
  const userId = req.session.userId;

  if (!category || !id) {
    return res
      .status(400)
      .json({ success: false, message: "Category and ID are required" });
  }

  try {
    let tableName;
    let filePathField;
    let allowedCategories = [
      "ids",
      "employment",
      "religion",
      "charities",
      "clubs",
      "degrees",
      "military",
      "miscellaneous",
    ];

    // Map category to table name and file path field
    switch (category) {
      case "ids":
        tableName = "government_id";
        filePathField = "file_path";
        break;
      case "employment":
        tableName = "employment";
        filePathField = "employment_file";
        break;
      case "religion":
        tableName = "religious";
        filePathField = null; // No file associated
        break;
      case "charities":
        tableName = "charities";
        filePathField = "charity_file";
        break;
      case "clubs":
        tableName = "clubs";
        filePathField = "club_file";
        break;
      case "degrees":
        tableName = "degrees";
        filePathField = "degree_file";
        break;
      case "military":
        tableName = "military";
        filePathField = "military_file";
        break;
      case "miscellaneous":
        tableName = "miscellaneous";
        filePathField = "miscellaneous_file";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid category" });
    }

    // Fetch the record to get the file path (if any)
    let filePath = null;
    if (filePathField) {
      const [records] = await pool.query(
        `SELECT ${filePathField} FROM ${tableName} WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      if (records.length > 0) {
        filePath = records[0][filePathField];
      }
    }

    // Delete the record
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found or not authorized",
      });
    }

    // Delete the file if it exists
    if (filePath) {
      const fullPath = path.join(__dirname, filePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`Error deleting file ${fullPath}:`, err);
        // Continue with success response even if file deletion fails
      }
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/feedback - Fetch user's feedback messages
app.get("/api/feedback", checkAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, message, created_at FROM feedback_messages WHERE user_id = ? ORDER BY created_at ASC",
      [req.session.userId]
    );
    // Return messages as plain text, one per line
    const messages = rows
      .map((row) => `${row.id}|${row.message}|${row.created_at.toISOString()}`)
      .join("\n");
    res.set("Content-Type", "text/plain");
    res.send(messages || "No messages");
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).send("Server error");
  }
});

// POST /api/feedback - Send a new feedback message
app.post("/api/feedback", checkAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).send("Message required");
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO feedback_messages (user_id, message) VALUES (?, ?)",
      [req.session.userId, message.trim()]
    );
    res.set("Content-Type", "text/plain");
    res.send(
      `${result.insertId}|${message.trim()}|${new Date().toISOString()}`
    );
  } catch (err) {
    console.error("Error sending feedback:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/feedback/all", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, message, created_at FROM feedback_messages ORDER BY created_at ASC"
    );
    const messages = rows
      .map((row) => `${row.id}|${row.message}|${row.created_at.toISOString()}`)
      .join("\n");
    res.set("Content-Type", "text/plain");
    res.send(messages || "No messages");
  } catch (err) {
    console.error("Error fetching all feedback:", err);
    res.status(500).send("Server error");
  }
});

app.post(
  "/api/add-password-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      storageType: store_password,
      serviceName: service_name,
      masterPassword: master_password,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      fileName: password_file,
      storageLocation: password_location,
      notes,
    } = parsedDetails;

    if (!store_password) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Storage type is required" });
    }

    try {
      const allowedTypes = [
        "Password manager",
        "A file on my computer",
        "Other",
      ];
      if (!allowedTypes.includes(store_password)) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(400)
          .json({ success: false, message: "Invalid storage type" });
      }

      if (store_password === "Password manager" && !service_name) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(400).json({
          success: false,
          message: "Service name is required for Password manager",
        });
      }

      if (store_password === "A file on my computer" && !password_file) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(400).json({
          success: false,
          message: "File name is required for A file on my computer",
        });
      }

      if (store_password === "Other" && !password_location) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(400).json({
          success: false,
          message: "Storage location is required for Other",
        });
      }

      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO password_management (
        user_id, store_password, service_name, master_password, payment_method, amount, frequency,
        enrolled, nominee_contact, password_file, password_location, pass_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          store_password,
          store_password === "Password manager" ? service_name : null,
          store_password === "Password manager" ? master_password : null,
          store_password === "Password manager" ? payment_method : null,
          store_password === "Password manager" ? amount : null,
          store_password === "Password manager" ? frequency : null,
          store_password === "Password manager"
            ? enrolled === "true"
              ? 1
              : 0
            : 0,
          nominee_contact || null,
          store_password === "A file on my computer" ? password_file : null,
          store_password === "Other" ? password_location : null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Password management detail added successfully",
      });
    } catch (err) {
      console.error("Error adding password management detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-password-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      storageType: store_password,
      serviceName: service_name,
      masterPassword: master_password,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      fileName: password_file,
      storageLocation: password_location,
      notes,
    } = parsedDetails;

    if (!store_password) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Storage type is required" });
    }

    try {
      const allowedTypes = [
        "Password manager",
        "A file on my computer",
        "Other",
      ];
      if (!allowedTypes.includes(store_password)) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(400)
          .json({ success: false, message: "Invalid storage type" });
      }

      if (store_password === "Password manager" && !service_name) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({
          success: false,
          message: "Service name is required for Password manager",
        });
      }

      if (store_password === "A file on my computer" && !password_file) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({
          success: false,
          message: "File name is required for A file on my computer",
        });
      }

      if (store_password === "Other" && !password_location) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({
          success: false,
          message: "Storage location is required for Other",
        });
      }

      const [existing] = await pool.query(
        `SELECT pass_file FROM password_management WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (existing.length === 0) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(404).json({
          success: false,
          message: "Password management record not found",
        });
      }

      // Delete old file if new file uploaded
      const oldFilePath = existing[0].pass_file;
      if (
        files?.length &&
        oldFilePath &&
        fs.existsSync(path.join(__dirname, oldFilePath))
      ) {
        fs.unlinkSync(path.join(__dirname, oldFilePath));
      }

      const file = files.length > 0 ? files[0] : null;
      let filePath = oldFilePath;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE password_management SET
          store_password = ?, 
          service_name = ?, 
          master_password = ?, 
          payment_method = ?, 
          amount = ?, 
          frequency = ?, 
          enrolled = ?, 
          nominee_contact = ?, 
          password_file = ?, 
          password_location = ?, 
          pass_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          store_password,
          store_password === "Password manager" ? service_name : null,
          store_password === "Password manager" ? master_password : null,
          store_password === "Password manager" ? payment_method : null,
          store_password === "Password manager" ? amount : null,
          store_password === "Password manager" ? frequency : null,
          store_password === "Password manager"
            ? enrolled === "true"
              ? 1
              : 0
            : 0,
          nominee_contact || null,
          store_password === "A file on my computer" ? password_file : null,
          store_password === "Other" ? password_location : null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Password management detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing password management detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-password-details", checkAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [records] = await pool.query(
      `SELECT id, store_password, service_name, master_password, payment_method, amount, frequency,
              enrolled, nominee_contact, password_file, password_location, pass_file, filename, notes, created_at
       FROM password_management WHERE user_id = ?`,
      [userId]
    );

    const formattedRecords = records.map((record) => ({
      id: record.id,
      store_password: record.store_password,
      service_name: record.service_name || "",
      master_password: record.master_password || "",
      payment_method: record.payment_method || "",
      amount: record.amount || "",
      frequency: record.frequency || "",
      enrolled: record.enrolled === true,
      nominee_contact: record.nominee_contact || "",
      password_file: record.password_file || "",
      password_location: record.password_location || "",
      pass_file: record.pass_file || "",
      filename: record.filename || "",
      notes: record.notes || "",
      created_at: record.created_at,
    }));

    res.json({ success: true, records: formattedRecords });
  } catch (err) {
    console.error("Error fetching password management details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-email-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: email_service,
      emailAddress: email_address,
      isPrimary: email_primary,
      isPaid: email_paid,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!email_service || !email_address) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Service name and email address are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO email_management (
        user_id, email_service, email_address, email_primary, email_paid, payment_method, amount, frequency,
        enrolled, nominee_contact, email_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email_service,
          email_address,
          email_primary === "yes" ? 1 : 0,
          email_paid === "yes" ? 1 : 0,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Email account detail added successfully",
      });
    } catch (err) {
      console.error("Error adding email account detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-email-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const emailId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: email_service,
      emailAddress: email_address,
      isPrimary: email_primary,
      isPaid: email_paid,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
      existingFilePath,
    } = parsedDetails;

    if (!email_service || !email_address) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Service name and email address are required",
      });
    }

    try {
      // Fetch old file info if exists
      const [rows] = await pool.query(
        "SELECT email_file, filename FROM email_management WHERE id = ? AND user_id = ?",
        [emailId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Email detail not found" });
      }

      const oldFilePath = rows[0].email_file
        ? path.join(__dirname, rows[0].email_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = oldFilePath ? rows[0].email_file : null;
      let filename = oldFilename;

      // Replace file if new one uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE email_management
         SET email_service = ?, email_address = ?, email_primary = ?, email_paid = ?, payment_method = ?, amount = ?, frequency = ?,
             enrolled = ?, nominee_contact = ?, email_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          email_service,
          email_address,
          email_primary === "yes" ? 1 : 0,
          email_paid === "yes" ? 1 : 0,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          emailId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Email account detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing email detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get email details endpoint
app.get("/api/get-email-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, email_service AS service_name, email_address, email_primary, email_paid, payment_method, amount, frequency,
       enrolled, nominee_contact, email_file AS pass_file, filename, notes, created_at
       FROM email_management WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching email details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-device-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      deviceName: device_name,
      accessCode: device_code,
      deviceType: device_type,
      ownOrRent: own_or_rent,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!device_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Device name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO device_management (
        user_id, device_name, device_code, device_type, payment_method, amount, frequency,
        enrolled, nominee_contact, device_file, filename, notes, own_or_rent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          device_name,
          device_code || null,
          device_type || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          own_or_rent || null
        ]
      );

      res.json({ success: true, message: "Device detail added successfully" });
    } catch (err) {
      console.error("Error adding device detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-device-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const deviceId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      deviceName: device_name,
      accessCode: device_code,
      ownOrRent: own_or_rent,
      deviceType: device_type,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
      existingFilePath, // Optional: for validation if sent from frontend
    } = parsedDetails;

    if (!device_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Device name is required" });
    }

    try {
      // Get old file path and filename (if exists)
      const [rows] = await pool.query(
        "SELECT device_file, filename FROM device_management WHERE id = ? AND user_id = ?",
        [deviceId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Device detail not found",
        });
      }

      const oldFilePath = rows[0].device_file
        ? path.join(__dirname, rows[0].device_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = rows[0].device_file || null; // Preserve existing file path
      let filename = oldFilename; // Preserve existing filename

      // Replace file if new one uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE device_management SET
         device_name = ?, device_code = ?, device_type = ?, payment_method = ?, amount = ?, frequency = ?,
         enrolled = ?, nominee_contact = ?, device_file = ?, filename = ?, notes = ?, own_or_rent = ?
         WHERE id = ? AND user_id = ?`,
        [
          device_name,
          device_code || null,
          device_type || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          own_or_rent || null,
          deviceId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Device detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing device detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get device details endpoint
app.get("/api/get-device-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, device_name, device_code, device_type, payment_method, amount, frequency,
       enrolled, nominee_contact, device_file AS pass_file, filename, notes, own_or_rent, created_at
       FROM device_management WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching device details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-wifi-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      networkName: wifi_network,
      wifiPassword: wifi_code,
      routerType: wifi_system,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      wifiSubscription: wifi_subscription,
      routerPassword: router_code,
      accessMethod: wifi_access,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!wifi_network) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Network name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO wifi_management (
        user_id, wifi_network, wifi_code, wifi_subscription, wifi_system, router_code, wifi_access,
        nominee_contact, wifi_file, filename, notes, payment_method, amount, frequency, enrolled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          wifi_network,
          wifi_code || null,
          wifi_subscription === "yes" ? 1 : 0,
          wifi_system || null,
          router_code || null,
          wifi_access || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
        ]
      );

      res.json({ success: true, message: "WiFi detail added successfully" });
    } catch (err) {
      console.error("Error adding WiFi detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-wifi-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const wifiId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      networkName: wifi_network,
      wifiPassword: wifi_code,
      wifiSubscription: wifi_subscription,
      routerType: wifi_system,
      routerPassword: router_code,
      accessMethod: wifi_access,
      contact: nominee_contact,
      notes,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      existingFilePath, // Optional: for validation if sent from frontend
    } = parsedDetails;

    if (!wifi_network) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Network name is required" });
    }

    try {
      // Fetch existing file path and filename
      const [rows] = await pool.query(
        "SELECT wifi_file, filename FROM wifi_management WHERE id = ? AND user_id = ?",
        [wifiId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "WiFi detail not found",
        });
      }

      const oldFilePath = rows[0].wifi_file
        ? path.join(__dirname, rows[0].wifi_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = rows[0].wifi_file || null; // Preserve existing file path
      let filename = oldFilename; // Preserve existing filename

      // If a new file is uploaded, use it and delete old one
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE wifi_management SET
         wifi_network = ?, wifi_code = ?, wifi_subscription = ?, wifi_system = ?, router_code = ?, wifi_access = ?,
         nominee_contact = ?, wifi_file = ?, filename = ?, notes = ?, payment_method = ?, amount = ?, frequency = ?,
         enrolled = ?
         WHERE id = ? AND user_id = ?`,
        [
          wifi_network,
          wifi_code || null,
          wifi_subscription === "yes" ? 1 : 0,
          wifi_system || null,
          router_code || null,
          wifi_access || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          payment_method || null,
          amount || null,
          frequency || null,
          enrolled === "yes" ? 1 : 0,
          wifiId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "WiFi detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing WiFi detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get WiFi details endpoint
app.get("/api/get-wifi-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, wifi_network AS network_name, wifi_code, wifi_system, router_code, wifi_access,
       nominee_contact, wifi_file AS pass_file, payment_method, amount, frequency,
       enrolled, wifi_subscription AS wifiSubscription, filename, notes, created_at
       FROM wifi_management WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching WiFi details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-social-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: social_name,
      usernameEmail: social_email,
      premOrPaid: prem_or_paid,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!social_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO social_media (
        user_id, social_name, social_email, prem_or_paid, payment_method, amount, frequency,
        enrolled, nominee_contact, social_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          social_name,
          social_email || null,
          prem_or_paid === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Social media detail added successfully",
      });
    } catch (err) {
      console.error("Error adding social media detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-social-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const socialId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: social_name,
      usernameEmail: social_email,
      premOrPaid: prem_or_paid,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
      existingFilePath, // Optional: for validation if sent from frontend
    } = parsedDetails;

    if (!social_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Fetch existing file path and filename
      const [rows] = await pool.query(
        "SELECT social_file, filename FROM social_media WHERE id = ? AND user_id = ?",
        [socialId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Social media detail not found",
        });
      }

      const oldFilePath = rows[0].social_file
        ? path.join(__dirname, rows[0].social_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = rows[0].social_file || null; // Preserve existing file path
      let filename = oldFilename; // Preserve existing filename

      // If new file uploaded, update file path and delete the old one
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE social_media SET
         social_name = ?, social_email = ?, prem_or_paid = ?, payment_method = ?, amount = ?, frequency = ?,
         enrolled = ?, nominee_contact = ?, social_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          social_name,
          social_email || null,
          prem_or_paid === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          socialId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Social media detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing social media detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Social Media details endpoint
app.get("/api/get-social-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, social_name AS service_name, social_email AS username_email, prem_or_paid AS premOrPaid, payment_method,
       amount, frequency, enrolled, nominee_contact, social_file AS pass_file, filename, notes, created_at
       FROM social_media WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching social media details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-shopping-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: shoping_name,
      associated,
      phoneNumber: phone_number,
      password,
      usernameEmail: shoping_email,
      paymentMethod: payment_method,
      shoppingSubscription: shopping_subscription,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!shoping_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO shopping (
        user_id, shoping_name, shopping_subscription, associated, shoping_email, payment_method, amount, frequency,
        enrolled, nominee_contact, shoping_file, filename, notes, phone_number, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          shoping_name,
          shopping_subscription === "yes" ? 1 : 0,
          associated,
          shoping_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          phone_number || null,
          password || null
        ]
      );

      res.json({
        success: true,
        message: "Shopping detail added successfully",
      });
    } catch (err) {
      console.error("Error adding shopping detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-shopping-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const shoppingId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: shoping_name,
      usernameEmail: shoping_email,
      paymentMethod: payment_method,
      shoppingSubscription: shopping_subscription,
      amount,
      frequency,
      phoneNumber: phone_number,
      password,
      associated,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!shoping_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const [rows] = await pool.query(
        "SELECT shoping_file, filename FROM shopping WHERE id = ? AND user_id = ?",
        [shoppingId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Shopping detail not found" });
      }

      const oldFilePath = rows[0].shoping_file
        ? path.join(__dirname, rows[0].shoping_file)
        : null;

      let filePath = rows[0].shoping_file; // Default to old file
      let filename = rows[0].filename; // Default to old filename

      // If new file uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Only delete old file if new one uploaded
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE shopping SET
          shoping_name = ?, shoping_email = ?, associated = ?, shopping_subscription = ?, payment_method = ?, amount = ?, frequency = ?, phone_number = ?, password = ?,
          enrolled = ?, nominee_contact = ?, shoping_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          shoping_name,
          shoping_email || null,
          associated || null,
          shopping_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          phone_number || null,
          password || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          shoppingId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Shopping detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing shopping detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Shopping details endpoint
app.get("/api/get-shopping-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, shoping_name AS service_name, associated, shoping_email AS username_email, payment_method, password, phone_number,
       amount, frequency, enrolled, shopping_subscription AS shoppingSubscription, nominee_contact, shoping_file AS pass_file, filename, notes, created_at
       FROM shopping WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching shopping details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-video-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: video_name,
      usernameEmail: video_email,
      paymentMethod: payment_method,
      videoSubscription: video_subscription,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!video_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO video_streaming (
        user_id, video_name, video_email, video_subscription, payment_method, amount, frequency,
        enrolled, nominee_contact, streaming_file, filename, notes, associated, password, phone_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          video_name,
          video_email || null,
          video_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          associated || null,
          password || null,
          phone_number || null
        ]
      );

      res.json({
        success: true,
        message: "Video streaming detail added successfully",
      });
    } catch (err) {
      console.error("Error adding video streaming detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-video-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const videoId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: video_name,
      usernameEmail: video_email,
      paymentMethod: payment_method,
      videoSubscription: video_subscription,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
      existingFilePath, // Optional: for validation if sent from frontend
    } = parsedDetails;

    if (!video_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlink(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    try {
      // Fetch existing file path and filename
      const [rows] = await pool.query(
        "SELECT streaming_file, filename FROM video_streaming WHERE id = ? AND user_id = ?",
        [videoId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlink(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Video streaming detail not found",
        });
      }

      const oldFilePath = rows[0].streaming_file
        ? path.join(__dirname, rows[0].streaming_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = rows[0].streaming_file || null; // Preserve existing file path
      let filename = oldFilename; // Preserve existing filename

      // Handle new file upload
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update record
      await pool.query(
        `UPDATE video_streaming SET
          video_name = ?, video_email = ?, video_subscription = ?, payment_method = ?, amount = ?, frequency = ?, associated = ?, phone_number = ?, password = ?,
          enrolled = ?, nominee_contact = ?, streaming_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          video_name,
          video_email || null,
          video_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          associated || null,
          phone_number || null,
          password || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          videoId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Video streaming detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing video streaming detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlink(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Video Streaming details endpoint
app.get("/api/get-video-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, video_name AS service_name, video_email AS username_email, video_subscription AS videoSubscription, payment_method, password, phone_number, associated,
       amount, frequency, enrolled, nominee_contact, streaming_file AS pass_file, filename, notes, created_at
       FROM video_streaming WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching video streaming details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-music-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: music_name,
      usernameEmail: music_email,
      paymentMethod: payment_method,
      musicSubscription: music_subscription,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!music_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO music (
        user_id, music_name, music_email, music_subscription, associated, phone_number, password, payment_method, amount, frequency,
        enrolled, nominee_contact, music_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          music_name,
          music_email || null,
          music_subscription === "yes" ? 1 : 0,
          associated || null,
          phone_number || null,
          password || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Music detail added successfully" });
    } catch (err) {
      console.error("Error adding music detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-music-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const musicId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlink(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: music_name,
      usernameEmail: music_email,
      musicSubscription: music_subscription,
      paymentMethod: payment_method,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
      existingFilePath, // Optional: for validation if sent from frontend
    } = parsedDetails;

    if (!music_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlink(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Fetch existing file path and filename
      const [rows] = await pool.query(
        "SELECT music_file, filename FROM music WHERE id = ? AND user_id = ?",
        [musicId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlink(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Music detail not found",
        });
      }

      const oldFilePath = rows[0].music_file
        ? path.join(__dirname, rows[0].music_file)
        : null;
      const oldFilename = rows[0].filename || null;

      let filePath = rows[0].music_file || null; // Preserve existing file path
      let filename = oldFilename; // Preserve existing filename

      // Handle new file upload
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update record
      await pool.query(
        `UPDATE music SET
          music_name = ?, music_email = ?, music_subscription = ?, payment_method = ?, amount = ?, frequency = ?, associated = ?, associated = ?, phone_number = ?,
          enrolled = ?, nominee_contact = ?, music_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          music_name,
          music_email || null,
          music_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          associated || null,
          phone_number || null,
          password || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          musicId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Music detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing music detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlink(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Music details endpoint
app.get("/api/get-music-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, music_name AS service_name, music_email AS username_email, music_subscription AS musicSubscription, payment_method, password, phone_number, associated,
       amount, frequency, enrolled, nominee_contact, music_file AS pass_file, filename, notes, created_at
       FROM music WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching music details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-gaming-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: gaming_name,
      usernameEmail: gaming_email,
      paymentMethod: payment_method,
      gamingSubscription: gaming_subscription,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!gaming_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO gaming (
        user_id, gaming_name, gaming_email, gaming_subscription, payment_method, amount, frequency,
        enrolled, nominee_contact, gaming_file, filename, notes, associated, phone_number, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          gaming_name,
          gaming_email || null,
          gaming_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          associated || null,
          phone_number || null,
          password || null,
        ]
      );

      res.json({ success: true, message: "Gaming detail added successfully" });
    } catch (err) {
      console.error("Error adding gaming detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-gaming-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const gamingId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: gaming_name,
      usernameEmail: gaming_email,
      paymentMethod: payment_method,
      gamingSubscription: gaming_subscription,
      associated,
      phoneNumber: phone_number,
      password,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!gaming_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Get existing record to handle file replacement
      const [rows] = await pool.query(
        "SELECT gaming_file FROM gaming WHERE id = ? AND user_id = ?",
        [gamingId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Gaming detail not found" });
      }

      const oldFilePath = rows[0].gaming_file
        ? path.join(__dirname, rows[0].gaming_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Remove old file if it exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // If no new file uploaded, keep old file path & filename
        filePath = rows[0].gaming_file;
        filename = null; // or fetch filename too if you stored it in DB and want to keep it
      }

      // Update the record
      await pool.query(
        `UPDATE gaming SET
          gaming_name = ?, gaming_email = ?, gaming_subscription = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, gaming_file = ?, filename = ?, notes = ?, associated = ?, phone_number = ?, password = ?
         WHERE id = ? AND user_id = ?`,
        [
          gaming_name,
          gaming_email || null,
          gaming_subscription === "yes" ? 1 : 0,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          associated || null,
          phone_number || null,
          password || null,
          gamingId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Gaming detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing gaming detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Gaming details endpoint
app.get("/api/get-gaming-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, gaming_name AS service_name, gaming_email AS username_email, payment_method, password, phone_number, associated, 
       amount, frequency, enrolled, nominee_contact, gaming_subscription AS gamingSubscription, gaming_file AS pass_file, filename, notes, created_at
       FROM gaming WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching gaming details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-cloud-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: cloud_name,
      usernameEmail: cloud_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!cloud_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO cloud_storage (
        user_id, cloud_name, cloud_email, payment_method, amount, frequency,
        enrolled, nominee_contact, cloud_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          cloud_name,
          cloud_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Cloud storage detail added successfully",
      });
    } catch (err) {
      console.error("Error adding cloud storage detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-cloud-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const cloudId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: cloud_name,
      usernameEmail: cloud_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!cloud_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Fetch existing record to handle old file removal
      const [rows] = await pool.query(
        "SELECT cloud_file FROM cloud_storage WHERE id = ? AND user_id = ?",
        [cloudId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Cloud storage detail not found" });
      }

      const oldFilePath = rows[0].cloud_file
        ? path.join(__dirname, rows[0].cloud_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // Keep old file path & filename if no new file uploaded
        filePath = rows[0].cloud_file;
        filename = null; // Or fetch from DB if needed
      }

      // Update DB record
      await pool.query(
        `UPDATE cloud_storage SET
          cloud_name = ?, cloud_email = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, cloud_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          cloud_name,
          cloud_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          cloudId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Cloud storage detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing cloud storage detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Cloud Storage details endpoint
app.get("/api/get-cloud-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, cloud_name AS service_name, cloud_email AS username_email, payment_method,
       amount, frequency, enrolled, nominee_contact, cloud_file AS pass_file, filename, notes, created_at
       FROM cloud_storage WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching cloud storage details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-business-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: business_name,
      usernameEmail: business_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!business_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO business_networking (
        user_id, business_name, business_email, payment_method, amount, frequency,
        enrolled, nominee_contact, business_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          business_name,
          business_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Business networking detail added successfully",
      });
    } catch (err) {
      console.error("Error adding business networking detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-business-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const businessId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: business_name,
      usernameEmail: business_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!business_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Fetch existing record to get old file path
      const [rows] = await pool.query(
        "SELECT business_file FROM business_networking WHERE id = ? AND user_id = ?",
        [businessId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({
            success: false,
            message: "Business networking detail not found",
          });
      }

      const oldFilePath = rows[0].business_file
        ? path.join(__dirname, rows[0].business_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Remove old file from disk if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // If no new file uploaded, retain old file info
        filePath = rows[0].business_file;
        filename = null; // optionally fetch old filename if you store it and want to keep
      }

      // Update record
      await pool.query(
        `UPDATE business_networking SET
          business_name = ?, business_email = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, business_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          business_name,
          business_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          businessId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Business networking detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing business networking detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Business Networking details endpoint
app.get("/api/get-business-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, business_name AS service_name, business_email AS username_email, payment_method,
       amount, frequency, enrolled, nominee_contact, business_file AS pass_file, filename, notes, created_at
       FROM business_networking WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching business networking details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-software-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: software_name,
      licenseKey: software_key,
      usernameEmail: software_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!software_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO software_app_licenses (
        user_id, software_name, software_key, software_email, payment_method, amount, frequency,
        enrolled, nominee_contact, software_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          software_name,
          software_key || null,
          software_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Software license detail added successfully",
      });
    } catch (err) {
      console.error("Error adding software license detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-software-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const softwareId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: software_name,
      licenseKey: software_key,
      usernameEmail: software_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!software_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Fetch current record to get old file info
      const [rows] = await pool.query(
        "SELECT software_file FROM software_app_licenses WHERE id = ? AND user_id = ?",
        [softwareId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({
            success: false,
            message: "Software license detail not found",
          });
      }

      const oldFilePath = rows[0].software_file
        ? path.join(__dirname, rows[0].software_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Remove old file from disk if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // Keep existing file if no new file uploaded
        filePath = rows[0].software_file;
        filename = null; // or fetch old filename if stored and desired to keep
      }

      // Update database record
      await pool.query(
        `UPDATE software_app_licenses SET
          software_name = ?, software_key = ?, software_email = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, software_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          software_name,
          software_key || null,
          software_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          softwareId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Software license detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating software license detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Software & App Licenses details endpoint
app.get("/api/get-software-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, software_name AS service_name, software_key AS license_key, software_email AS username_email,
       payment_method, amount, frequency, enrolled, nominee_contact, software_file AS pass_file, filename, notes, created_at
       FROM software_app_licenses WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching software license details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-domain-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: domain_name,
      usernameEmail: domain_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!domain_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO domain_hosting (
        user_id, domain_name, domain_email, payment_method, amount, frequency,
        enrolled, nominee_contact, domain_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          domain_name,
          domain_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Domain hosting detail added successfully",
      });
    } catch (err) {
      console.error("Error adding domain hosting detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-domain-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const domainId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: domain_name,
      usernameEmail: domain_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!domain_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service name is required" });
    }

    try {
      // Get existing record to delete old file if replaced
      const [rows] = await pool.query(
        "SELECT domain_file FROM domain_hosting WHERE id = ? AND user_id = ?",
        [domainId, userId]
      );

      // if (rows.length === 0) {
      //   if (files && files.length > 0) {
      //     files.forEach((file) => fs.unlinkSync(file.path));
      //   }
      //   return res.status(404).json({ success: false, message: "Domain hosting detail not found" });
      // }

      const oldFilePath = rows[0].domain_file
        ? path.join(__dirname, rows[0].domain_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file from disk if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // Keep existing file if no new file uploaded
        filePath = rows[0].domain_file;
        filename = null; // Or keep old filename if stored and desired
      }

      await pool.query(
        `UPDATE domain_hosting SET
          domain_name = ?, domain_email = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, domain_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          domain_name,
          domain_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          domainId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Domain hosting detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating domain hosting detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Domains & Web Hosting details endpoint
app.get("/api/get-domain-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, domain_name AS service_name, domain_email AS username_email,
       payment_method, amount, frequency, enrolled, nominee_contact, domain_file AS pass_file,
       filename, notes, created_at
       FROM domain_hosting WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching domain hosting details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-other-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: subscription_name,
      subscriptionType: subscription_type,
      usernameEmail: subs_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!subscription_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Subscription name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO other_subscription (
        user_id, subscription_name, subscription_type, subs_email, payment_method, amount, frequency,
        enrolled, nominee_contact, subs_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          subscription_name || null,
          subscription_type || null,
          subs_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Other subscription detail added successfully",
      });
    } catch (err) {
      console.error("Error adding other subscription detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-other-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const subsId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceName: subscription_name,
      subscriptionType: subscription_type,
      usernameEmail: subs_email,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!subscription_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Subscription name is required" });
    }

    try {
      // Fetch current record to get old file info
      const [rows] = await pool.query(
        "SELECT subs_file FROM other_subscription WHERE id = ? AND user_id = ?",
        [subsId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Subscription detail not found" });
      }

      const oldFilePath = rows[0].subs_file
        ? path.join(__dirname, rows[0].subs_file)
        : null;

      let filePath = null;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file if exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } else {
        // Keep existing file if no new file uploaded
        filePath = rows[0].subs_file;
        filename = null; // Optionally keep old filename if stored somewhere
      }

      await pool.query(
        `UPDATE other_subscription SET
          subscription_name = ?, subscription_type = ?, subs_email = ?, payment_method = ?, amount = ?, frequency = ?,
          enrolled = ?, nominee_contact = ?, subs_file = ?, filename = ?, notes = ?
          WHERE id = ? AND user_id = ?`,
        [
          subscription_name || null,
          subscription_type || null,
          subs_email || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          autoPay === "yes" ? 1 : 0,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          subsId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Other subscription detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating other subscription detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Other Subscription details endpoint
app.get("/api/get-other-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT id, subscription_name AS service_name, subscription_type, subs_email AS username_email,
       payment_method, amount, frequency, enrolled, nominee_contact, subs_file AS pass_file,
       filename, notes, created_at
       FROM other_subscription WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching other subscription details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/delete-personal-detail", checkAuth, async (req, res) => {
  const { category, id } = req.body;
  const userId = req.session.userId;

  if (!category || !id) {
    return res
      .status(400)
      .json({ success: false, message: "Category and ID are required" });
  }

  try {
    let tableName;
    let filePathField;

    // Map category to table name and file path field
    switch (category) {
      // Personal Info Categories
      case "ids":
        tableName = "government_id";
        filePathField = "file_path";
        break;
      case "employment":
        tableName = "employment";
        filePathField = "employment_file";
        break;
      case "religion":
        tableName = "religious";
        filePathField = null; // No file associated
        break;
      case "charities":
        tableName = "charities";
        filePathField = "charity_file";
        break;
      case "clubs":
        tableName = "clubs";
        filePathField = "club_file";
        break;
      case "degrees":
        tableName = "degrees";
        filePathField = "degree_file";
        break;
      case "military":
        tableName = "military";
        filePathField = "military_file";
        break;
      case "miscellaneous":
        tableName = "miscellaneous";
        filePathField = "miscellaneous_file";
        break;
      // Digital Categories
      case "password":
        tableName = "password_management";
        filePathField = "pass_file";
        break;
      case "email":
        tableName = "email_management";
        filePathField = "email_file";
        break;
      case "devices":
        tableName = "device_management";
        filePathField = "device_file";
        break;
      case "wifi":
        tableName = "wifi_management";
        filePathField = "wifi_file";
        break;
      case "social":
        tableName = "social_media";
        filePathField = "social_file";
        break;
      case "shopping":
        tableName = "shopping";
        filePathField = "shoping_file";
        break;
      case "video":
        tableName = "video_streaming";
        filePathField = "streaming_file";
        break;
      case "music":
        tableName = "music";
        filePathField = "music_file";
        break;
      case "gaming":
        tableName = "gaming";
        filePathField = "gaming_file";
        break;
      case "cloud":
        tableName = "cloud_storage";
        filePathField = "cloud_file";
        break;
      case "business":
        tableName = "business_networking";
        filePathField = "business_file";
        break;
      case "software":
        tableName = "software_app_licenses";
        filePathField = "software_file";
        break;
      case "domains":
        tableName = "domain_hosting";
        filePathField = "domain_file";
        break;
      case "other":
        tableName = "other_subscription";
        filePathField = "subs_file";
        break;
      // Property Categories
      case "homes":
        tableName = "property_home";
        filePathField = "home_file";
        break;
      case "vehicles":
        tableName = "property_vehicle";
        filePathField = "vehicle_file";
        break;
      case "otherPossessions":
        tableName = "important_possession";
        filePathField = "possession_file";
        break;
      case "storageFacilities":
        tableName = "storage_facilities";
        filePathField = "storage_file";
        break;
      case "safeDepositBoxes":
        tableName = "safe_deposit";
        filePathField = "safe_file";
        break;
      case "homeSafes":
        tableName = "home_safe";
        filePathField = "home_safe_file";
        break;
      case "otherRealEstate":
        tableName = "other_real_estate";
        filePathField = "other_estate_file";
        break;
      case "vehicleInsurance":
        tableName = "vehicle_insurance";
        filePathField = "vehicle_insurance_file";
        break;
      case "homeInsurance":
        tableName = "home_insurance";
        filePathField = "home_insurance_file";
        break;

      case "otherInsurance":
        tableName = "other_insurance";
        filePathField = "insurance_file";
        break;

      //health category
      case "healthInsurance":
        tableName = "health_insurance";
        filePathField = "insurance_file";
        break;

      case "advanceDirective":
        tableName = "advance_directive";
        filePathField = "advance_file";
        break;

      case "medicalEquipment":
        tableName = "medical_equipment";
        filePathField = "equipment_file";
        break;

      case "fitnessWellness":
        tableName = "fitness_wellness";
        filePathField = "fitness_file";
        break;

      //financial category
      case "accountAssets":
        tableName = "account_assets";
        filePathField = "account_file";
        break;

      case "creditCards":
        tableName = "credit_cards";
        filePathField = "credit_file";
        break;

      case "loans":
        tableName = "loans";
        filePathField = "loan_file";
        break;

      case "advisorAgents":
        tableName = "advisor_agent";
        filePathField = null;
        break;

      case "lifeInsurance":
        tableName = "life_insurance";
        filePathField = "life_file";
        break;

      case "disabilityInsurance":
        tableName = "disability_insurance";
        filePathField = "disability_file";
        break;

      case "taxReturns":
        tableName = "tax_returns";
        filePathField = "tax_return_file";
        break;

      case "otherAnnuities":
        tableName = "other_annuities_benefits";
        filePathField = "annuity_file";
        break;

      case "pensions":
        tableName = "pensions";
        filePathField = "pension_file";
        break;

      case "militaryBenefits":
        tableName = "military_benefits";
        filePathField = "military_benefit_file";
        break;

      case "disabilityBenefits":
        tableName = "disability_benefits";
        filePathField = "disability_file";
        break;

      case "milesReward":
        tableName = "miles_reward";
        filePathField = "reward_file";
        break;

      case "governmentBenefit":
        tableName = "government_benefit";
        filePathField = "benefit_file";
        break;

      // Family Contacts
      case "emergencyContacts":
        tableName = "emergency_contacts";
        filePathField = "emergency_file";
        break;

      case "pets":
        tableName = "pets";
        filePathField = "pet_file";
        break;

      case "physicalPhotos":
        tableName = "physical_photos";
        filePathField = "physical_file";
        break;

      case "familyRecipes":
        tableName = "family_recipes";
        filePathField = "recipe_file";
        break;

      case "importantDates":
        tableName = "important_dates";
        filePathField = null;
        break;

      // Legal category
      case "attorneys":
        tableName = "attorneys";
        filePathField = "attorney_file";
        break;

      case "will":
        tableName = "wills";
        filePathField = "will_file";
        break;

      case "powerOfAttorney":
        tableName = "power_of_attorney";
        filePathField = "attorney_file";
        break;

      case "trusts":
        tableName = "trusts";
        filePathField = "trusts_file";
        break;

      case "otherLegalDocuments":
        tableName = "other_legal_documents";
        filePathField = "legal_file";
        break;

      // End Of Life Wishes
      case "finalArrangements":
        tableName = "final_arrangement";
        filePathField = null;
        break;

      case "myLastLetter":
        tableName = "my_last_letter";
        filePathField = "letter_file";
        break;

      case "ethicalWill":
        tableName = "about_my_life";
        filePathField = "life_file";
        break;

      case "mySecret":
        tableName = "my_secret";
        filePathField = "secret_file";
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid category" });
    }

    // Fetch the record to get the file path (if any)
    let filePath = null;
    if (filePathField) {
      const [records] = await pool.query(
        `SELECT ${filePathField} FROM ${tableName} WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      if (records.length > 0) {
        filePath = records[0][filePathField];
      }
    }

    // Delete the record
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found or not authorized",
      });
    }

    // Delete the file if it exists
    if (filePath) {
      const fullPath = path.join(__dirname, filePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Successfully deleted file: ${fullPath}`);
        } else {
          console.warn(`File not found for deletion: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Error deleting file ${fullPath}:`, err);
        // Continue with success response even if file deletion fails
      }
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-homes-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      ownership: home_own,
      plotNumber: plot_number,
      deedLocation: deed_location,
      taxLocation: home_taxes,
      ownershipStructure: ownership,
      mortgageCompany: mortgage_name,
      mortgageAccountNumber: mortgage_number,
      mortgageAgentContact: agent,
      landlord: landlord_name,
      rentAmount: home_rent,
      leaseEndDate: lease_end,
      otherArrangement: other_ownership,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!home_own) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Ownership type is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO property_home (
        user_id, home_own, plot_number, deed_location, home_taxes, ownership,
        mortgage_name, mortgage_number, agent, landlord_name, home_rent,
        lease_end, other_ownership, nominee_contact, home_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          home_own,
          plot_number || null,
          deed_location || null,
          home_taxes || null,
          ownership || null,
          mortgage_name || null,
          mortgage_number || null,
          agent || null,
          landlord_name || null,
          home_rent ? parseFloat(home_rent) : null,
          lease_end || null,
          other_ownership || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Home detail added successfully" });
    } catch (err) {
      console.error("Error adding home detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-homes-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const homeId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      ownership: home_own,
      plotNumber: plot_number,
      deedLocation: deed_location,
      taxLocation: home_taxes,
      ownershipStructure: ownership,
      mortgageCompany: mortgage_name,
      mortgageAccountNumber: mortgage_number,
      mortgageAgentContact: agent,
      landlord: landlord_name,
      rentAmount: home_rent,
      leaseEndDate: lease_end,
      otherArrangement: other_ownership,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!home_own) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Ownership type is required" });
    }

    try {
      // Fetch existing file path
      const [rows] = await pool.query(
        "SELECT home_file, filename FROM property_home WHERE id = ? AND user_id = ?",
        [homeId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Home detail not found" });
      }

      const oldFilePath = rows[0].home_file
        ? path.join(__dirname, rows[0].home_file)
        : null;

      let filePath = rows[0].home_file; // Keep existing if no new file
      let filename = rows[0].filename;

      // If new file is uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE property_home SET
          home_own = ?, plot_number = ?, deed_location = ?, home_taxes = ?, ownership = ?,
          mortgage_name = ?, mortgage_number = ?, agent = ?, landlord_name = ?, home_rent = ?,
          lease_end = ?, other_ownership = ?, nominee_contact = ?, home_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          home_own,
          plot_number || null,
          deed_location || null,
          home_taxes || null,
          ownership || null,
          mortgage_name || null,
          mortgage_number || null,
          agent || null,
          landlord_name || null,
          home_rent ? parseFloat(home_rent) : null,
          lease_end || null,
          other_ownership || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          homeId,
          userId,
        ]
      );

      res.json({ success: true, message: "Home detail updated successfully" });
    } catch (err) {
      console.error("Error editing home detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Homes details endpoint
app.get("/api/get-homes-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        home_own AS ownership,
        plot_number AS plotNumber,
        deed_location AS deedLocation,
        home_taxes AS taxLocation,
        ownership AS ownershipStructure,
        mortgage_name AS mortgageCompany,
        mortgage_number AS mortgageAccountNumber,
        agent AS mortgageAgentContact,
        landlord_name AS landlord,
        home_rent AS rentAmount,
        lease_end AS leaseEndDate,
        other_ownership AS otherArrangement,
        nominee_contact AS nomineeContact,
        home_file AS pass_file,
        filename,
        notes,
        created_at
      FROM property_home
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching home details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-vehicles-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      ownership: vehicle_own,
      titleLocation: vehicle_location,
      financeCompany: vehicle_company,
      accountNumber: vehicle_account_number,
      monthlyPayment: vehicle_amount,
      lastPaymentDate: payment_date,
      otherArrangement: vehicle_ownership,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!vehicle_own) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Ownership type is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO property_vehicle (
        user_id, vehicle_own, vehicle_location, vehicle_company, vehicle_account_number,
        vehicle_amount, payment_date, vehicle_ownership, nominee_contact, vehicle_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          vehicle_own,
          vehicle_location || null,
          vehicle_company || null,
          vehicle_account_number || null,
          vehicle_amount ? parseFloat(vehicle_amount) : null,
          payment_date || null,
          vehicle_ownership || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Vehicle detail added successfully" });
    } catch (err) {
      console.error("Error adding vehicle detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-vehicles-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const vehicleId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      ownership: vehicle_own,
      titleLocation: vehicle_location,
      financeCompany: vehicle_company,
      accountNumber: vehicle_account_number,
      monthlyPayment: vehicle_amount,
      lastPaymentDate: payment_date,
      otherArrangement: vehicle_ownership,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!vehicle_own) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Ownership type is required" });
    }

    try {
      // Fetch old file info
      const [rows] = await pool.query(
        "SELECT vehicle_file, filename FROM property_vehicle WHERE id = ? AND user_id = ?",
        [vehicleId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Vehicle detail not found" });
      }

      const oldFilePath = rows[0].vehicle_file
        ? path.join(__dirname, rows[0].vehicle_file)
        : null;
      let filePath = rows[0].vehicle_file;
      let filename = rows[0].filename;

      // If a new file is uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        // Delete old file if it exists
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update DB record
      await pool.query(
        `UPDATE property_vehicle SET
          vehicle_own = ?, vehicle_location = ?, vehicle_company = ?, vehicle_account_number = ?,
          vehicle_amount = ?, payment_date = ?, vehicle_ownership = ?, nominee_contact = ?,
          vehicle_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          vehicle_own,
          vehicle_location || null,
          vehicle_company || null,
          vehicle_account_number || null,
          vehicle_amount ? parseFloat(vehicle_amount) : null,
          payment_date || null,
          vehicle_ownership || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          vehicleId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Vehicle detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing vehicle detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Vehicles details endpoint
app.get("/api/get-vehicles-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        vehicle_own AS ownership,
        vehicle_location AS titleLocation,
        vehicle_company AS financeCompany,
        vehicle_account_number AS accountNumber,
        vehicle_amount AS monthlyPayment,
        DATE_FORMAT(payment_date, '%Y-%m-%d') AS lastPaymentDate,
        vehicle_ownership AS otherArrangement,
        nominee_contact AS nomineeContact,
        vehicle_file AS pass_file,
        filename,
        notes,
        created_at
      FROM property_vehicle
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching vehicle details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-possessions-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      itemName: possession_name,
      thoughts: possession_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!possession_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Item name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO important_possession (
        user_id, possession_name, possession_thought, nominee_contact, possession_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          possession_name,
          possession_thought || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Possession detail added successfully",
      });
    } catch (err) {
      console.error("Error adding possession detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-possessions-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      itemName: possession_name,
      thoughts: possession_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!possession_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Item name is required" });
    }

    try {
      // Get existing file info
      const [rows] = await pool.query(
        `SELECT possession_file, filename FROM important_possession WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].possession_file
        ? path.join(__dirname, rows[0].possession_file)
        : null;
      let filePath = rows[0].possession_file;
      let filename = rows[0].filename;

      // Replace old file if new one uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update record
      await pool.query(
        `UPDATE important_possession SET
          possession_name = ?, possession_thought = ?, nominee_contact = ?,
          possession_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          possession_name,
          possession_thought || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Possession detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating possession detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Possessions details endpoint
app.get("/api/get-possessions-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        possession_name AS itemName,
        possession_thought AS thoughts,
        nominee_contact AS nomineeContact,
        possession_file AS pass_file,
        filename,
        notes,
        created_at
      FROM important_possession
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching possession details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-storage-facilities-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      facilityName: storage_name,
      unitNumber: storage_unit,
      country,
      addressLine1: address1,
      addressLine2: address2,
      city,
      state,
      postalCode: postal_code,
      phoneNumber: phone_number,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!storage_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Facility name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO storage_facilities (
        user_id, storage_name, storage_unit, country, address1, address2, city, state, postal_code,
        phone_number, payment_method, amount, frequency, enrolled, nominee_contact, storage_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          storage_name,
          storage_unit || null,
          country || null,
          address1 || null,
          address2 || null,
          city || null,
          state || null,
          postal_code || null,
          phone_number || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          enrolled || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Storage facility detail added successfully",
      });
    } catch (err) {
      console.error("Error adding storage facility detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-storage-facilities-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const facilityId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      facilityName: storage_name,
      unitNumber: storage_unit,
      country,
      addressLine1: address1,
      addressLine2: address2,
      city,
      state,
      postalCode: postal_code,
      phoneNumber: phone_number,
      paymentMethod: payment_method,
      amount,
      frequency,
      autoPay: enrolled,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!storage_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Facility name is required" });
    }

    try {
      // Fetch old file data
      const [rows] = await pool.query(
        `SELECT storage_file, filename FROM storage_facilities WHERE id = ? AND user_id = ?`,
        [facilityId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Storage facility not found" });
      }

      const oldFilePath = rows[0].storage_file
        ? path.join(__dirname, rows[0].storage_file)
        : null;
      let filePath = rows[0].storage_file;
      let filename = rows[0].filename;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE storage_facilities SET
          storage_name = ?, storage_unit = ?, country = ?, address1 = ?, address2 = ?,
          city = ?, state = ?, postal_code = ?, phone_number = ?, payment_method = ?,
          amount = ?, frequency = ?, enrolled = ?, nominee_contact = ?, storage_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          storage_name,
          storage_unit || null,
          country || null,
          address1 || null,
          address2 || null,
          city || null,
          state || null,
          postal_code || null,
          phone_number || null,
          payment_method || null,
          amount ? parseFloat(amount) : null,
          frequency || null,
          enrolled || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          facilityId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Storage facility detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating storage facility detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Storage Facilities details endpoint
app.get("/api/get-storage-facilities-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        storage_name AS facilityName,
        storage_unit AS unitNumber,
        country,
        address1 AS addressLine1,
        address2 AS addressLine2,
        city,
        state,
        postal_code AS postalCode,
        phone_number AS phoneNumber,
        payment_method AS paymentMethod,
        amount,
        frequency,
        enrolled AS autoPay,
        nominee_contact AS nomineeContact,
        storage_file AS pass_file,
        filename,
        notes,
        created_at
      FROM storage_facilities
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching storage facility details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-safe-deposit-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      bankName: bank_name,
      branch: bank_branch,
      accountNumber: bank_account,
      boxNumber: safe_box,
      keyLocation: safe_key,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!bank_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Bank name is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO safe_deposit (
        user_id, bank_name, bank_branch, bank_account, safe_box, safe_key, nominee_contact, safe_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          bank_name,
          bank_branch || null,
          bank_account || null,
          safe_box || null,
          safe_key || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Safe deposit box detail added successfully",
      });
    } catch (err) {
      console.error("Error adding safe deposit box detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-safe-deposit-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      bankName: bank_name,
      branch: bank_branch,
      accountNumber: bank_account,
      boxNumber: safe_box,
      keyLocation: safe_key,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!bank_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Bank name is required" });
    }

    try {
      // Fetch old file details
      const [rows] = await pool.query(
        `SELECT safe_file, filename FROM safe_deposit WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].safe_file
        ? path.join(__dirname, rows[0].safe_file)
        : null;
      let filePath = rows[0].safe_file;
      let filename = rows[0].filename;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE safe_deposit SET
          bank_name = ?, bank_branch = ?, bank_account = ?, safe_box = ?, safe_key = ?,
          nominee_contact = ?, safe_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          bank_name,
          bank_branch || null,
          bank_account || null,
          safe_box || null,
          safe_key || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Safe deposit box detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating safe deposit box detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Safe Deposit details endpoint
app.get("/api/get-safe-deposit-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        bank_name AS bankName,
        bank_branch AS branch,
        bank_account AS accountNumber,
        safe_box AS boxNumber,
        safe_key AS keyLocation,
        nominee_contact AS nomineeContact,
        safe_file AS pass_file,
        filename,
        notes,
        created_at
      FROM safe_deposit
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching safe deposit box details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-home-safes-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      safeLocation: safe_where,
      whoKnowsLocation: who_knows_location,
      howToOpen: open_safe,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!safe_where) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Safe location is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO home_safe (
        user_id, safe_where, who_knows_location, open_safe, nominee_contact, home_safe_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          safe_where,
          who_knows_location || null,
          open_safe || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Home safe detail added successfully",
      });
    } catch (err) {
      console.error("Error adding home safe detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-home-safes-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      safeLocation: safe_where,
      whoKnowsLocation: who_knows_location,
      howToOpen: open_safe,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!safe_where) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Safe location is required" });
    }

    try {
      // Get existing file info
      const [rows] = await pool.query(
        `SELECT home_safe_file, filename FROM home_safe WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].home_safe_file
        ? path.join(__dirname, rows[0].home_safe_file)
        : null;
      let filePath = rows[0].home_safe_file;
      let filename = rows[0].filename;

      // If a new file is uploaded, update it
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update the record
      await pool.query(
        `UPDATE home_safe SET
          safe_where = ?, who_knows_location = ?, open_safe = ?, nominee_contact = ?,
          home_safe_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          safe_where,
          who_knows_location || null,
          open_safe || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Home safe detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating home safe detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Home Safes details endpoint
app.get("/api/get-home-safes-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        safe_where AS safeLocation,
        who_knows_location AS whoKnowsLocation,
        open_safe AS howToOpen,
        nominee_contact AS nomineeContact,
        home_safe_file AS pass_file,
        filename,
        notes,
        created_at
      FROM home_safe
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching home safe details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-other-real-estate-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      propertyLabel: estate_name,
      propertyType: estate_type,
      country,
      addressLine1: address1,
      addressLine2: address2,
      city,
      state,
      postalCode: postal_code,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!estate_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Property label is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO other_real_estate (
        user_id, estate_name, estate_type, country, address1, address2, city, state, postal_code, nominee_contact, other_estate_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          estate_name,
          estate_type || null,
          country || null,
          address1 || null,
          address2 || null,
          city || null,
          state || null,
          postal_code || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Other real estate detail added successfully",
      });
    } catch (err) {
      console.error("Error adding other real estate detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-other-real-estate-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      propertyLabel: estate_name,
      propertyType: estate_type,
      country,
      addressLine1: address1,
      addressLine2: address2,
      city,
      state,
      postalCode: postal_code,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!estate_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Property label is required" });
    }

    try {
      // Fetch current file data
      const [rows] = await pool.query(
        `SELECT other_estate_file, filename FROM other_real_estate WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].other_estate_file
        ? path.join(__dirname, rows[0].other_estate_file)
        : null;
      let filePath = rows[0].other_estate_file;
      let filename = rows[0].filename;

      // Replace file if a new one was uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update the DB record
      await pool.query(
        `UPDATE other_real_estate SET
          estate_name = ?, estate_type = ?, country = ?, address1 = ?, address2 = ?,
          city = ?, state = ?, postal_code = ?, nominee_contact = ?,
          other_estate_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          estate_name,
          estate_type || null,
          country || null,
          address1 || null,
          address2 || null,
          city || null,
          state || null,
          postal_code || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Other real estate detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating other real estate detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Other Real Estate details endpoint
app.get("/api/get-other-real-estate-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        estate_name AS propertyLabel,
        estate_type AS propertyType,
        country,
        address1 AS addressLine1,
        address2 AS addressLine2,
        city,
        state,
        postal_code AS postalCode,
        nominee_contact AS nomineeContact,
        other_estate_file AS pass_file,
        filename,
        notes,
        created_at
      FROM other_real_estate
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching other real estate details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-vehicle-insurance-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_name,
      accountNumber: insurance_account,
      insuranceAgentContact: account_agent,
      policyPaperworkLocation: insurance_location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Insurance company name is required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO vehicle_insurance (
        user_id, insurance_name, insurance_account, account_agent, insurance_location, nominee_contact, vehicle_insurance_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_name,
          insurance_account || null,
          account_agent || null,
          insurance_location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Vehicle insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding vehicle insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-vehicle-insurance-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const insuranceId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      insuranceCompany: insurance_name,
      accountNumber: insurance_account,
      insuranceAgentContact: account_agent,
      policyPaperworkLocation: insurance_location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Insurance company name is required",
      });
    }

    try {
      // Get old file path and name from DB
      const [rows] = await pool.query(
        "SELECT vehicle_insurance_file, filename FROM vehicle_insurance WHERE id = ? AND user_id = ?",
        [insuranceId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({
            success: false,
            message: "Vehicle insurance detail not found",
          });
      }

      const oldFilePath = rows[0].vehicle_insurance_file
        ? path.join(__dirname, rows[0].vehicle_insurance_file)
        : null;
      let filePath = rows[0].vehicle_insurance_file;
      let filename = rows[0].filename;

      // If a new file is uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update record
      await pool.query(
        `UPDATE vehicle_insurance SET
          insurance_name = ?, insurance_account = ?, account_agent = ?, insurance_location = ?,
          nominee_contact = ?, vehicle_insurance_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          insurance_name,
          insurance_account || null,
          account_agent || null,
          insurance_location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          insuranceId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Vehicle insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing vehicle insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Vehicle Insurance details endpoint
app.get("/api/get-vehicle-insurance-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        insurance_name AS insuranceCompany,
        insurance_account AS accountNumber,
        account_agent AS insuranceAgentContact,
        insurance_location AS policyPaperworkLocation,
        nominee_contact AS nomineeContact,
        vehicle_insurance_file AS pass_file,
        filename,
        notes,
        created_at
      FROM vehicle_insurance
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching vehicle insurance details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-home-insurance-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_name,
      homeowners: insurance_type1,
      renters: insurance_type2,
      mortgage: insurance_type3,
      flood: insurance_type4,
      earthquake: insurance_type5,
      tornado: insurance_type6,
      otherInsurance: insurance_type7,
      insuranceAgentContact: insurance_agent,
      policyNumber: insurance_account,
      policyDocumentsLocation: insurance_location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Insurance company name is required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO home_insurance (
        user_id, insurance_name, insurance_type1, insurance_type2, insurance_type3, 
        insurance_type4, insurance_type5, insurance_type6, insurance_type7, 
        insurance_agent, insurance_account, insurance_location, nominee_contact, 
        home_insurance_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_name,
          insurance_type1 ? 1 : 0,
          insurance_type2 ? 1 : 0,
          insurance_type3 ? 1 : 0,
          insurance_type4 ? 1 : 0,
          insurance_type5 ? 1 : 0,
          insurance_type6 ? 1 : 0,
          insurance_type7 ? 1 : 0,
          insurance_agent || null,
          insurance_account || null,
          insurance_location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Home insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding home insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-home-insurance-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const insuranceId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      insuranceCompany: insurance_name,
      homeowners: insurance_type1,
      renters: insurance_type2,
      mortgage: insurance_type3,
      flood: insurance_type4,
      earthquake: insurance_type5,
      tornado: insurance_type6,
      otherInsurance: insurance_type7,
      insuranceAgentContact: insurance_agent,
      policyNumber: insurance_account,
      policyDocumentsLocation: insurance_location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Insurance company name is required",
      });
    }

    try {
      // Get old file path from DB
      const [rows] = await pool.query(
        "SELECT home_insurance_file, filename FROM home_insurance WHERE id = ? AND user_id = ?",
        [insuranceId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Home insurance detail not found" });
      }

      const oldFilePath = rows[0].home_insurance_file
        ? path.join(__dirname, rows[0].home_insurance_file)
        : null;
      let filePath = rows[0].home_insurance_file;
      let filename = rows[0].filename;

      // Replace file if a new one is uploaded
      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update database
      await pool.query(
        `UPDATE home_insurance SET 
          insurance_name = ?, insurance_type1 = ?, insurance_type2 = ?, insurance_type3 = ?, 
          insurance_type4 = ?, insurance_type5 = ?, insurance_type6 = ?, insurance_type7 = ?, 
          insurance_agent = ?, insurance_account = ?, insurance_location = ?, 
          nominee_contact = ?, home_insurance_file = ?, filename = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          insurance_name,
          insurance_type1 ? 1 : 0,
          insurance_type2 ? 1 : 0,
          insurance_type3 ? 1 : 0,
          insurance_type4 ? 1 : 0,
          insurance_type5 ? 1 : 0,
          insurance_type6 ? 1 : 0,
          insurance_type7 ? 1 : 0,
          insurance_agent || null,
          insurance_account || null,
          insurance_location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          insuranceId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Home insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing home insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Home Insurance details endpoint
app.get("/api/get-home-insurance-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        insurance_name AS insuranceCompany,
        insurance_type1 AS homeowners,
        insurance_type2 AS renters,
        insurance_type3 AS mortgage,
        insurance_type4 AS flood,
        insurance_type5 AS earthquake,
        insurance_type6 AS tornado,
        insurance_type7 AS otherInsurance,
        insurance_agent AS insuranceAgentContact,
        insurance_account AS policyNumber,
        insurance_location AS policyDocumentsLocation,
        nominee_contact AS nomineeContact,
        home_insurance_file AS pass_file,
        filename,
        notes,
        created_at
      FROM home_insurance
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching home insurance details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-health-insurance-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      planType: insurance_type,
      insuranceProvider: carrier, // Map insuranceProvider to carrier
      policyNumber: policy_number,
      insuranceAmount: insurance_amount,
      startDate: start_date,
      endDate: end_date,
      renewalDate: renewal_date,
      dependents,
      otherCoverage: other_coverage,
      cardLocation: card_location,
      portalInfo: online_portal,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Insurance type is required" });
    }

    if (
      (insurance_type === "employer_sponsored" ||
        insurance_type === "individual") &&
      !carrier
    ) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message:
          "Insurance provider is required for employer-sponsored or individual plans",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO health_insurance (
        user_id, insurance_type, carrier, policy_number, insurance_amount, 
        start_date, end_date, renewal_date, dependents, other_coverage, 
        card_location, online_portal, nominee_contact, insurance_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_type,
          carrier || null,
          policy_number || null,
          insurance_amount || null,
          start_date || null,
          end_date || null,
          renewal_date || null,
          dependents || null,
          other_coverage || null,
          card_location || null,
          online_portal || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Health insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding health insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-health-insurance-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      planType: insurance_type,
      insuranceProvider: carrier,
      policyNumber: policy_number,
      insuranceAmount: insurance_amount,
      startDate: start_date,
      endDate: end_date,
      renewalDate: renewal_date,
      dependents,
      otherCoverage: other_coverage,
      cardLocation: card_location,
      portalInfo: online_portal,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Insurance type is required" });
    }

    if (
      (insurance_type === "employer_sponsored" ||
        insurance_type === "individual") &&
      !carrier
    ) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message:
          "Insurance provider is required for employer-sponsored or individual plans",
      });
    }

    try {
      // Fetch current file path
      const [rows] = await pool.query(
        `SELECT insurance_file FROM health_insurance WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].insurance_file
        ? path.join(__dirname, rows[0].insurance_file)
        : null;

      let filePath = rows[0].insurance_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE health_insurance SET
          insurance_type = ?, carrier = ?, policy_number = ?, insurance_amount = ?,
          start_date = ?, end_date = ?, renewal_date = ?, dependents = ?, 
          other_coverage = ?, card_location = ?, online_portal = ?, 
          nominee_contact = ?, insurance_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          insurance_type,
          carrier || null,
          policy_number || null,
          insurance_amount || null,
          start_date || null,
          end_date || null,
          renewal_date || null,
          dependents || null,
          other_coverage || null,
          card_location || null,
          online_portal || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Health insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating health insurance detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// GET /api/get-health-insurance-details
app.get("/api/get-health-insurance-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        insurance_type AS planType,
        carrier AS insuranceProvider, -- Map carrier to insuranceProvider
        policy_number AS policyNumber,
        insurance_amount AS insuranceAmount,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate,
        DATE_FORMAT(renewal_date, '%Y-%m-%d') AS renewalDate,
        dependents,
        other_coverage AS otherCoverage,
        card_location AS cardLocation,
        online_portal AS portalInfo,
        nominee_contact AS nomineeContact,
        insurance_file AS pass_file,
        filename,
        notes,
        created_at
      FROM health_insurance
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching health insurance details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-advance-directive-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      proxyValidLocation: valid_care_proxy,
      proxyDocumentLocation: location,
      lastUpdated: last_updated,
      creationMethod: create_it,
      serviceName: service_name,
      serviceUrl: online_url,
      otherCreationMethod: health_proxy_create,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!create_it) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Creation method is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO advance_directive (
        user_id, valid_care_proxy, location, last_updated, create_it, 
        service_name, online_url, health_proxy_create, nominee_contact, 
        advance_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          valid_care_proxy || null,
          location || null,
          last_updated || null,
          create_it,
          service_name || null,
          online_url || null,
          health_proxy_create || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Advance directive detail added successfully",
      });
    } catch (err) {
      console.error("Error adding advance directive detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Advance Directive details endpoint
app.get("/api/get-advance-directive-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        valid_care_proxy AS proxyValidLocation,
        location AS proxyDocumentLocation,
        last_updated AS lastUpdated,
        create_it AS creationMethod,
        service_name AS serviceName,
        online_url AS serviceUrl,
        health_proxy_create AS otherCreationMethod,
        nominee_contact AS nomineeContact,
        advance_file AS pass_file,
        filename,
        notes,
        created_at
      FROM advance_directive
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching advance directive details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-medical-equipment-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      equipmentType: equipment_type,
      equipmentMakeModel: equipment_model,
      equipmentProvider: provider_contact,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!equipment_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Equipment type is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO medical_equipment (
        user_id, equipment_type, equipment_model, provider_contact, 
        nominee_contact, equipment_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          equipment_type,
          equipment_model || null,
          provider_contact || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Medical equipment detail added successfully",
      });
    } catch (err) {
      console.error("Error adding medical equipment detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-medical-equipment-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      equipmentType: equipment_type,
      equipmentMakeModel: equipment_model,
      equipmentProvider: provider_contact,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!equipment_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Equipment type is required" });
    }

    try {
      // Get existing file path
      const [rows] = await pool.query(
        `SELECT equipment_file FROM medical_equipment WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].equipment_file
        ? path.join(__dirname, rows[0].equipment_file)
        : null;

      let filePath = rows[0].equipment_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE medical_equipment SET
          equipment_type = ?, equipment_model = ?, provider_contact = ?, 
          nominee_contact = ?, equipment_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          equipment_type,
          equipment_model || null,
          provider_contact || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Medical equipment detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating medical equipment detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Medical Equipment details endpoint
app.get("/api/get-medical-equipment-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        equipment_type AS equipmentType,
        equipment_model AS equipmentMakeModel,
        provider_contact AS equipmentProvider,
        nominee_contact AS contact,
        equipment_file AS pass_file,
        filename,
        notes,
        created_at
      FROM medical_equipment
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching medical equipment details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-fitness-wellness-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceType: service_type,
      serviceName: service_name,
      paymentMethod: payment_method,
      amount: payment_amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!service_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Service type is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO fitness_wellness (
        user_id, service_type, service_name, payment_method, payment_amount, 
        frequency, enrolled, nominee_contact, fitness_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          service_type,
          service_name || null,
          payment_method || null,
          payment_amount ? parseFloat(payment_amount) : null,
          frequency || null,
          enrolled || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Fitness and wellness detail added successfully",
      });
    } catch (err) {
      console.error("Error adding fitness and wellness detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-fitness-wellness-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      serviceType: service_type,
      serviceName: service_name,
      paymentMethod: payment_method,
      amount: payment_amount,
      frequency,
      autoPay: enrolled,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!service_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Service type is required" });
    }

    try {
      // Fetch existing file info to delete old file if needed
      const [rows] = await pool.query(
        `SELECT fitness_file FROM fitness_wellness WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].fitness_file
        ? path.join(__dirname, rows[0].fitness_file)
        : null;

      let filePath = rows[0].fitness_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE fitness_wellness SET
          service_type = ?, service_name = ?, payment_method = ?, payment_amount = ?, 
          frequency = ?, enrolled = ?, nominee_contact = ?, fitness_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          service_type,
          service_name || null,
          payment_method || null,
          payment_amount ? parseFloat(payment_amount) : null,
          frequency || null,
          enrolled || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Fitness and wellness detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating fitness and wellness detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Fitness Wellness details endpoint
app.get("/api/get-fitness-wellness-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        service_type AS serviceType,
        service_name AS serviceName,
        payment_method AS paymentMethod,
        payment_amount AS amount,
        frequency,
        enrolled AS autoPay,
        nominee_contact AS contact,
        fitness_file AS pass_file,
        filename,
        notes,
        created_at
      FROM fitness_wellness
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching fitness and wellness details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-account-assets-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      accountName: account_name,
      accountType: account_type,
      institutionName: financial_institution,
      accountNumber: account_number,
      personalContact: personal_contact,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_name || !account_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Account name and type are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO account_assets (
        user_id, account_name, account_type, financial_institution, account_number, 
        personal_contact, nominee_contact, account_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          account_name,
          account_type,
          financial_institution || null,
          account_number || null,
          personal_contact || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Account and assets detail added successfully",
      });
    } catch (err) {
      console.error("Error adding account and assets detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-account-assets-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      accountName: account_name,
      accountType: account_type,
      institutionName: financial_institution,
      accountNumber: account_number,
      personalContact: personal_contact,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_name || !account_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Account name and type are required",
      });
    }

    try {
      // Get existing record to delete old file if replaced
      const [rows] = await pool.query(
        `SELECT account_file FROM account_assets WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].account_file
        ? path.join(__dirname, rows[0].account_file)
        : null;

      let filePath = rows[0].account_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE account_assets SET
          account_name = ?, account_type = ?, financial_institution = ?, account_number = ?,
          personal_contact = ?, nominee_contact = ?, account_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          account_name,
          account_type,
          financial_institution || null,
          account_number || null,
          personal_contact || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Account and assets detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating account and assets detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Account Assets details endpoint
app.get("/api/get-account-assets-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        account_name AS accountName,
        account_type AS accountType,
        financial_institution AS institutionName,
        account_number AS accountNumber,
        personal_contact AS personalContact,
        nominee_contact AS contact,
        account_file AS pass_file,
        filename,
        notes,
        created_at
      FROM account_assets
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching account and assets details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-credit-cards-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      cardName: card_name,
      cardType: card_type,
      issuer: card_issuer,
      accountNumber: card_number,
      expirationDate: card_expiry,
      contact: nominee_contact,
      agentNumber: agent_number,
      renewalFee: renewal_fee,
      whereItKept: where_it_kept,
      reminder,
      notes,
    } = parsedDetails;

    if (!card_name || !card_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Card name and type are required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO credit_cards (
        user_id, card_name, card_type, card_issuer, card_number, renewal_fee, reminder,
        card_expiry, nominee_contact, credit_file, filename, notes, agent_number, where_it_kept
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          card_name,
          card_type,
          card_issuer || null,
          card_number || null,
          renewal_fee || null,
          reminder,
          card_expiry || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          agent_number || null,
          where_it_kept || null
        ]
      );

      res.json({
        success: true,
        message: "Credit card detail added successfully",
      });
    } catch (err) {
      console.error("Error adding credit card detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-credit-cards-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      cardName: card_name,
      cardType: card_type,
      issuer: card_issuer,
      accountNumber: card_number,
      expirationDate: card_expiry,
      renewalFee: renewal_fee,
      contact: nominee_contact,
      agentNumber: agent_number,
      whereItKept: where_it_kept,
      reminder,
      notes,
    } = parsedDetails;

    if (!card_name || !card_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Card name and type are required",
      });
    }

    try {
      // Get existing record to delete old file if replaced
      const [rows] = await pool.query(
        `SELECT credit_file FROM credit_cards WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].credit_file
        ? path.join(__dirname, rows[0].credit_file)
        : null;

      let filePath = rows[0].credit_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE credit_cards SET
          card_name = ?, card_type = ?, renewal_fee = ?, reminder = ?, card_issuer = ?, card_number = ?, agent_number = ?, where_it_kept = ?,
          card_expiry = ?, nominee_contact = ?, credit_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          card_name,
          card_type,
          renewal_fee,
          reminder,
          card_issuer || null,
          card_number || null,
          agent_number || null,
          where_it_kept || null,
          card_expiry || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Credit card detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating credit card detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Credit Cards details endpoint
app.get("/api/get-credit-cards-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        card_name AS cardName,
        card_type AS cardType,
        card_issuer AS issuer,
        card_number AS accountNumber,
        agent_number AS agentNumber,
        reminder,
        renewal_fee AS renewalFee,
        where_it_kept AS whereItKept,
        card_expiry AS expirationDate,
        nominee_contact AS contact,
        credit_file AS pass_file,
        filename,
        notes,
        created_at
      FROM credit_cards
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching credit card details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-loans-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      loanName: loan_name,
      loanType: loan_type,
      institutionName: financial_institution,
      accountNumber: account_number,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!loan_name || !loan_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Loan name and type are required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO loans (
        user_id, loan_name, loan_type, financial_institution, account_number, 
        nominee_contact, loan_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          loan_name,
          loan_type,
          financial_institution || null,
          account_number || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Loan detail added successfully" });
    } catch (err) {
      console.error("Error adding loan detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-loans-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      loanName: loan_name,
      loanType: loan_type,
      institutionName: financial_institution,
      accountNumber: account_number,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!loan_name || !loan_type) {
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Loan name and type are required",
      });
    }

    try {
      // Fetch existing record to check ownership and get old file path
      const [rows] = await pool.query(
        `SELECT loan_file FROM loans WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].loan_file
        ? path.join(__dirname, rows[0].loan_file)
        : null;

      let filePath = rows[0].loan_file;
      let filename = null;

      if (files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE loans SET
          loan_name = ?, loan_type = ?, financial_institution = ?, account_number = ?,
          nominee_contact = ?, loan_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          loan_name,
          loan_type,
          financial_institution || null,
          account_number || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Loan detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating loan detail:", err);
      if (files.length > 0) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Loans details endpoint
app.get("/api/get-loans-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        loan_name AS loanName,
        loan_type AS loanType,
        financial_institution AS institutionName,
        account_number AS accountNumber,
        nominee_contact AS contact,
        loan_file AS pass_file,
        filename,
        notes,
        created_at
      FROM loans
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching loan details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/add-advisor-agent-detail", checkAuth, async (req, res) => {
  const { details } = req.body;
  const userId = req.session.userId;

  if (!details) {
    console.error("Missing details in request body:", req.body);
    return res
      .status(400)
      .json({ success: false, message: "Details are required" });
  }

  const {
    advisorType: advisor_type,
    advisorContactInfo: advisor_contact,
    contact: nominee_contact,
    notes,
  } = details;

  if (!advisor_type || !advisor_contact) {
    return res.status(400).json({
      success: false,
      message: "Advisor type and contact are required",
    });
  }

  try {
    await pool.query(
      `INSERT INTO advisor_agent (
        user_id, advisor_type, advisor_contact, nominee_contact, notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        advisor_type,
        advisor_contact,
        nominee_contact || null,
        notes || null,
      ]
    );

    res.json({
      success: true,
      message: "Advisor agent detail added successfully",
    });
  } catch (err) {
    console.error("Error adding advisor agent detail:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/edit-advisor-agent-detail/:id", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  const advisorAgentId = req.params.id;
  let parsedDetails;

  if (!req.body.details) {
    return res
      .status(400)
      .json({ success: false, message: "Details are required" });
  }

  try {
    parsedDetails =
      typeof req.body.details === "string"
        ? JSON.parse(req.body.details)
        : req.body.details;
  } catch (err) {
    console.error("Invalid details format:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid details format" });
  }

  const {
    advisorType: advisor_type,
    advisorContactInfo: advisor_contact,
    contact: nominee_contact,
    notes,
  } = parsedDetails;

  if (!advisor_type || !advisor_contact) {
    return res.status(400).json({
      success: false,
      message: "Advisor type and contact are required",
    });
  }

  try {
    // Optional: Check if the record exists and belongs to userId
    const [existing] = await pool.query(
      `SELECT id FROM advisor_agent WHERE id = ? AND user_id = ?`,
      [advisorAgentId, userId]
    );

    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Advisor agent detail not found" });
    }

    // Update record
    await pool.query(
      `UPDATE advisor_agent SET
        advisor_type = ?, 
        advisor_contact = ?, 
        nominee_contact = ?, 
        notes = ?
      WHERE id = ? AND user_id = ?`,
      [
        advisor_type,
        advisor_contact,
        nominee_contact || null,
        notes || null,
        advisorAgentId,
        userId,
      ]
    );

    res.json({
      success: true,
      message: "Advisor agent detail updated successfully",
    });
  } catch (err) {
    console.error("Error updating advisor agent detail:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Advisor Agent details endpoint
app.get("/api/get-advisor-agent-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        advisor_type AS advisorType,
        advisor_contact AS advisorContactInfo,
        nominee_contact AS contact,
        notes,
        created_at
      FROM advisor_agent
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching advisor agent details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-life-insurance-detail",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const { details } = req.body;
    const file = req.file;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (file) {
        fs.unlinkSync(file.path);
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_company,
      policyLocation: location,
      policyType: policy_type,
      otherPolicyType: other_policy_type,
      policyNumber: policy_number,
      insuredName: insured_name,
      policyStartDate: policy_start,
      policyExpirationDate: policy_end,
      deathBenefitValue: death_value,
      ltcRider: ltc,
      insuranceAgentContact: insurance_agent,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_company || !policy_type || !insured_name) {
      if (file) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        message:
          "Insurance company, policy type, and insured name are required",
      });
    }

    try {
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO life_insurance (
        user_id, insurance_company, location, policy_type, policy_number, insured_name,
        policy_start, policy_end, death_value, ltc, insurance_agent, nominee_contact,
        life_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_company || null,
          location || null,
          other_policy_type || policy_type,
          policy_number || null,
          insured_name,
          policy_start || null,
          policy_end || null,
          death_value || null,
          ltc || null,
          insurance_agent || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Life insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding life insurance detail:", err);
      if (file) {
        fs.unlinkSync(file.path);
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);
app.put(
  "/api/edit-life-insurance-detail/:id",
  checkAuth,
  documentUpload.single("files"),
  async (req, res) => {
    const userId = req.session.userId;
    const lifeInsuranceId = req.params.id;
    const file = req.file;
    let parsedDetails;

    if (!req.body.details) {
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Details are required" });
    }

    try {
      parsedDetails =
        typeof req.body.details === "string"
          ? JSON.parse(req.body.details)
          : req.body.details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (file) fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_company,
      policyLocation: location,
      policyType: policy_type,
      otherPolicyType: other_policy_type,
      policyNumber: policy_number,
      insuredName: insured_name,
      policyStartDate: policy_start,
      policyExpirationDate: policy_end,
      deathBenefitValue: death_value,
      ltcRider: ltc,
      insuranceAgentContact: insurance_agent,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_company || !policy_type || !insured_name) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message:
          "Insurance company, policy type, and insured name are required",
      });
    }

    try {
      // Get existing file info for this record and verify ownership
      const [rows] = await pool.query(
        "SELECT life_file, filename FROM life_insurance WHERE id = ? AND user_id = ?",
        [lifeInsuranceId, userId]
      );

      if (!rows.length) {
        if (file) fs.unlinkSync(file.path);
        return res
          .status(404)
          .json({ success: false, message: "Life insurance detail not found" });
      }

      const existingFilePath = rows[0].life_file;
      const existingFilename = rows[0].filename;

      let filePath = existingFilePath;
      let filename = existingFilename;

      if (file) {
        // Delete old file if exists
        if (existingFilePath) {
          try {
            fs.unlinkSync(`./${existingFilePath}`);
          } catch (err) {
            console.warn("Failed to delete old file:", err);
          }
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE life_insurance SET
          insurance_company = ?, 
          location = ?, 
          policy_type = ?, 
          policy_number = ?, 
          insured_name = ?, 
          policy_start = ?, 
          policy_end = ?, 
          death_value = ?, 
          ltc = ?, 
          insurance_agent = ?, 
          nominee_contact = ?, 
          life_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          insurance_company || null,
          location || null,
          other_policy_type || policy_type,
          policy_number || null,
          insured_name,
          policy_start || null,
          policy_end || null,
          death_value || null,
          ltc || null,
          insurance_agent || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          lifeInsuranceId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Life insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating life insurance detail:", err);
      if (file) fs.unlinkSync(file.path);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Life Insurance details endpoint
app.get("/api/get-life-insurance-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        insurance_company AS insuranceCompany,
        location AS policyLocation,
        policy_type AS policyType,
        policy_number AS policyNumber,
        insured_name AS insuredName,
        policy_start AS policyStartDate,
        policy_end AS policyExpirationDate,
        death_value AS deathBenefitValue,
        ltc AS ltcRider,
        insurance_agent AS insuranceAgentContact,
        nominee_contact AS nomineeContact,
        life_file AS pass_file,
        filename,
        notes,
        created_at
      FROM life_insurance
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching life insurance details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-disability-insurance-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_company,
      policyLocation: policy_location,
      policyType: policy_type,
      otherPolicyType: other_policy_type,
      policyNumber: policy_number,
      policyStartDate: policy_start,
      policyExpirationDate: policy_end,
      benefitAmount: benefit_amount,
      benefitPeriod: benefit_period,
      information,
      insuranceAgentContact: insurance_agent,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_company || !policy_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Insurance company and policy type are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO disability_insurance (
        user_id, insurance_company, policy_location, policy_type, policy_number, 
        policy_start, policy_end, benefit_amount, benefit_period, information, 
        insurance_agent, nominee_contact, disability_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_company || null,
          policy_location || null,
          policy_type === "other" && other_policy_type
            ? other_policy_type
            : policy_type,
          policy_number || null,
          policy_start || null,
          policy_end || null,
          benefit_amount || null,
          benefit_period || null,
          information || null,
          insurance_agent || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Disability insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding disability insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-disability-insurance-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const insuranceId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceCompany: insurance_company,
      policyLocation: policy_location,
      policyType: policy_type,
      otherPolicyType: other_policy_type,
      policyNumber: policy_number,
      policyStartDate: policy_start,
      policyExpirationDate: policy_end,
      benefitAmount: benefit_amount,
      benefitPeriod: benefit_period,
      information,
      insuranceAgentContact: insurance_agent,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_company || !policy_type) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Insurance company and policy type are required",
      });
    }

    try {
      // Fetch existing record and file info
      const [rows] = await pool.query(
        "SELECT disability_file, filename FROM disability_insurance WHERE id = ? AND user_id = ?",
        [insuranceId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].disability_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete old file
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Failed to delete old file:", err);
          }
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE disability_insurance SET 
          insurance_company = ?, 
          policy_location = ?, 
          policy_type = ?, 
          policy_number = ?, 
          policy_start = ?, 
          policy_end = ?, 
          benefit_amount = ?, 
          benefit_period = ?, 
          information = ?, 
          insurance_agent = ?, 
          nominee_contact = ?, 
          disability_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          insurance_company || null,
          policy_location || null,
          policy_type === "other" && other_policy_type
            ? other_policy_type
            : policy_type,
          policy_number || null,
          policy_start || null,
          policy_end || null,
          benefit_amount || null,
          benefit_period || null,
          information || null,
          insurance_agent || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          insuranceId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Disability insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating disability insurance detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Disability Insurance details endpoint
app.get(
  "/api/get-disability-insurance-details",
  checkAuth,
  async (req, res) => {
    const userId = req.session.userId;

    try {
      const [rows] = await pool.query(
        `SELECT
        id,
        insurance_company AS insuranceCompany,
        policy_location AS policyLocation,
        policy_type AS policyType,
        policy_number AS policyNumber,
        policy_start AS policyStartDate,
        policy_end AS policyExpirationDate,
        benefit_amount AS benefitAmount,
        benefit_period AS benefitPeriod,
        information,
        insurance_agent AS insuranceAgentContact,
        nominee_contact AS nomineeContact,
        disability_file AS pass_file,
        filename,
        notes,
        created_at
      FROM disability_insurance
      WHERE user_id = ?`,
        [userId]
      );

      res.json({ success: true, records: rows });
    } catch (err) {
      console.error("Error fetching disability insurance details:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.post(
  "/api/add-tax-returns-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      taxYear: tax_year,
      prepareTaxes: prepare_taxes,
      paymentMethod: payment_method,
      amount: amount,
      frequency: frequency,
      autoPay: autoPay,
      prepareContact: prepare_contact,
      serviceName: service_name,
      otherPrepareTaxes: other_prepare_taxes,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!tax_year || !prepare_taxes) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Tax year and preparation method are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO tax_returns (
        user_id, tax_year, prepare_taxes, prepare_contact, service_name, payment_method, amount, frequency,
        other_prepare_taxes, autoPay, nominee_contact, tax_return_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          tax_year || null,
          prepare_taxes || null,
          prepare_contact || null,
          service_name || null,
          payment_method || null,
          amount || null,
          frequency || null,
          autoPay || null,
          other_prepare_taxes || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Tax returns detail added successfully",
      });
    } catch (err) {
      console.error("Error adding tax returns detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-tax-returns-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const taxReturnId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      taxYear: tax_year,
      prepareTaxes: prepare_taxes,
      prepareContact: prepare_contact,
      paymentMethod: payment_method,
      amount: amount,
      frequency: frequency,
      autoPay: autoPay,
      serviceName: service_name,
      otherPrepareTaxes: other_prepare_taxes,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!tax_year || !prepare_taxes) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Tax year and preparation method are required",
      });
    }

    try {
      // Fetch existing file info
      const [rows] = await pool.query(
        "SELECT tax_return_file FROM tax_returns WHERE id = ? AND user_id = ?",
        [taxReturnId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].tax_return_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete old file if a new one is uploaded
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Failed to delete old file:", err);
          }
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE tax_returns SET
          tax_year = ?, 
          prepare_taxes = ?, 
          prepare_contact = ?, 
          service_name = ?, 
          payment_method = ?,
          amount = ?,
          frequency = ?,
          autoPay = ?,
          other_prepare_taxes = ?, 
          nominee_contact = ?, 
          tax_return_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          tax_year || null,
          prepare_taxes || null,
          prepare_contact || null,
          service_name || null,
          payment_method || null,
          amount || null,
          frequency || null,
          autoPay || null,
          other_prepare_taxes || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          taxReturnId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Tax returns detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating tax returns detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Tax Returns details endpoint
app.get("/api/get-tax-returns-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        tax_year AS taxYear,
        prepare_taxes AS prepareTaxes,
        prepare_contact AS prepareContact,
        service_name AS serviceName,
        other_prepare_taxes AS otherPrepareTaxes,
        payment_method AS paymentMethod,
        amount,
        frequency,
        autoPay,
        nominee_contact AS nomineeContact,
        tax_return_file AS pass_file,
        filename,
        notes,
        created_at
      FROM tax_returns
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching tax returns details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-other-annuities-benefits-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      annuityType: annuity_type,
      payerContact: payer_contact,
      insuranceCompany: insurance_company,
      insuranceAmount: insurance_amount,
      adminContact: admin_contact,
      otherAnnuity: other_annuity,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!annuity_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Annuity or benefit type is required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO other_annuities_benefits (
        user_id, annuity_type, payer_contact, insurance_company, insurance_amount, 
        admin_contact, other_annuity, nominee_contact, annuity_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          annuity_type || null,
          payer_contact || null,
          insurance_company || null,
          insurance_amount || null,
          admin_contact || null,
          other_annuity || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Other annuities or benefits detail added successfully",
      });
    } catch (err) {
      console.error("Error adding other annuities or benefits detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-other-annuities-benefits-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const annuityId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      annuityType: annuity_type,
      payerContact: payer_contact,
      insuranceCompany: insurance_company,
      insuranceAmount: insurance_amount,
      adminContact: admin_contact,
      otherAnnuity: other_annuity,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!annuity_type) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({
          success: false,
          message: "Annuity or benefit type is required",
        });
    }

    try {
      // Fetch old file if exists
      const [rows] = await pool.query(
        "SELECT annuity_file FROM other_annuities_benefits WHERE id = ? AND user_id = ?",
        [annuityId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].annuity_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete old file if replacing
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Old file deletion warning:", err.message);
          }
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE other_annuities_benefits SET
          annuity_type = ?, payer_contact = ?, insurance_company = ?, insurance_amount = ?,
          admin_contact = ?, other_annuity = ?, nominee_contact = ?, annuity_file = ?,
          filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          annuity_type || null,
          payer_contact || null,
          insurance_company || null,
          insurance_amount || null,
          admin_contact || null,
          other_annuity || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          annuityId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Other annuities or benefits detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating other annuities or benefits detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Other Annuities or Benefits details endpoint
app.get(
  "/api/get-other-annuities-benefits-details",
  checkAuth,
  async (req, res) => {
    const userId = req.session.userId;

    try {
      const [rows] = await pool.query(
        `SELECT
        id,
        annuity_type AS annuityType,
        payer_contact AS payerContact,
        insurance_company AS insuranceCompany,
        insurance_amount AS insuranceAmount,
        admin_contact AS adminContact,
        other_annuity AS otherAnnuity,
        nominee_contact AS nomineeContact,
        annuity_file AS pass_file,
        filename,
        notes,
        created_at
      FROM other_annuities_benefits
      WHERE user_id = ?`,
        [userId]
      );

      res.json({ success: true, records: rows });
    } catch (err) {
      console.error("Error fetching other annuities or benefits details:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.post(
  "/api/add-pensions-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      adminPension: admin_pension,
      accountNumber: account_number,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_number) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Account number is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO pensions (
        user_id, admin_pension, account_number, nominee_contact, pension_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          admin_pension || null,
          account_number,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Pension detail added successfully" });
    } catch (err) {
      console.error("Error adding pension detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-pensions-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const pensionId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      adminPension: admin_pension,
      accountNumber: account_number,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_number) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Account number is required" });
    }

    try {
      // Fetch current file info
      const [rows] = await pool.query(
        "SELECT pension_file FROM pensions WHERE id = ? AND user_id = ?",
        [pensionId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].pension_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete previous file if exists
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Failed to delete old file:", err.message);
          }
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE pensions SET
          admin_pension = ?, account_number = ?, nominee_contact = ?,
          pension_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          admin_pension || null,
          account_number,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          pensionId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Pension detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating pension detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Pension details endpoint
app.get("/api/get-pensions-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        admin_pension AS adminPension,
        account_number AS accountNumber,
        nominee_contact AS nomineeContact,
        pension_file AS pass_file,
        filename,
        notes,
        created_at
      FROM pensions
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching pension details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-military-benefits-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      adminContact: admin_contact,
      accountNumber: account_number,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_number) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Account or DoD ID number is required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO military_benefits (
        user_id, admin_contact, account_number, nominee_contact, military_benefit_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          admin_contact || null,
          account_number,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Military benefits detail added successfully",
      });
    } catch (err) {
      console.error("Error adding military benefits detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-military-benefits-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const benefitId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      adminContact: admin_contact,
      accountNumber: account_number,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!account_number) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({
          success: false,
          message: "Account or DoD ID number is required",
        });
    }

    try {
      // Fetch current file info
      const [rows] = await pool.query(
        "SELECT military_benefit_file, filename FROM military_benefits WHERE id = ? AND user_id = ?",
        [benefitId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].military_benefit_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete old file
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Old file deletion warning:", err.message);
          }
        }

        // Set new file
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE military_benefits SET 
          admin_contact = ?, 
          account_number = ?, 
          nominee_contact = ?, 
          military_benefit_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          admin_contact || null,
          account_number,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          benefitId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Military benefits detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating military benefits detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Military Benefits details endpoint
app.get("/api/get-military-benefits-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        admin_contact AS adminContact,
        account_number AS accountNumber,
        nominee_contact AS nomineeContact,
        military_benefit_file AS pass_file,
        filename,
        notes,
        created_at
      FROM military_benefits
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching military benefits details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-disability-benefits-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      disabilitySource: disability_source,
      adminContact: admin_contact,
      insuranceCompany: insurance_company,
      accountNumber: account_number,
      otherBenefit: other_benefit,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!disability_source) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Source of disability payment is required",
      });
    }

    if (disability_source === "insurance" && !account_number) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Account number is required for insurance source",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO disability_benefits (
        user_id, disability_source, admin_contact, insurance_company, account_number, other_benefit, disability_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          disability_source || null,
          admin_contact || null,
          insurance_company || null,
          account_number || null,
          other_benefit || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Disability benefits detail added successfully",
      });
    } catch (err) {
      console.error("Error adding disability benefits detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-disability-benefits-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const benefitId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      disabilitySource: disability_source,
      adminContact: admin_contact,
      insuranceCompany: insurance_company,
      accountNumber: account_number,
      otherBenefit: other_benefit,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!disability_source) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Source of disability payment is required",
      });
    }

    if (disability_source === "insurance" && !account_number) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Account number is required for insurance source",
      });
    }

    try {
      // Get existing file info
      const [rows] = await pool.query(
        "SELECT disability_file FROM disability_benefits WHERE id = ? AND user_id = ?",
        [benefitId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].disability_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        // Delete old file
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Old file deletion warning:", err.message);
          }
        }

        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE disability_benefits SET 
          disability_source = ?, 
          admin_contact = ?, 
          insurance_company = ?, 
          account_number = ?, 
          other_benefit = ?, 
          disability_file = ?, 
          filename = ?, 
          notes = ? 
        WHERE id = ? AND user_id = ?`,
        [
          disability_source || null,
          admin_contact || null,
          insurance_company || null,
          account_number || null,
          other_benefit || null,
          filePath,
          filename,
          notes || null,
          benefitId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Disability benefits detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating disability benefits detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Disability Benefits details endpoint
app.get("/api/get-disability-benefits-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        disability_source AS disabilitySource,
        admin_contact AS adminContact,
        insurance_company AS insuranceCompany,
        account_number AS accountNumber,
        other_benefit AS otherBenefit,
        disability_file AS pass_file,
        filename,
        notes,
        created_at
      FROM disability_benefits
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching disability benefits details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-emergency-contacts-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const { contact_name, relationship, phone_number, notes } = parsedDetails;

    if (!contact_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Contact name is required" });
    }

    if (!phone_number) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO emergency_contacts (
          user_id, contact_name, relationship, phone_number, emergency_file, filename, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          contact_name || null,
          relationship || null,
          phone_number || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Emergency contact detail added successfully",
      });
    } catch (err) {
      console.error("Error adding emergency contact detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-emergency-contact-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const contactId = req.params.id;
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const { contact_name, relationship, phone_number, notes } = parsedDetails;

    if (!contact_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Contact name is required" });
    }

    if (!phone_number) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    try {
      // 1. Fetch existing record for this user and contactId
      const [rows] = await pool.query(
        "SELECT emergency_file, filename FROM emergency_contacts WHERE id = ? AND user_id = ?",
        [contactId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Emergency contact not found" });
      }

      const existing = rows[0];

      let filePath = existing.emergency_file;
      let filename = existing.filename;

      // 2. If a new file is uploaded, delete old file and update filePath and filename
      if (files.length > 0) {
        // Delete old file from disk if it exists
        if (existing.emergency_file) {
          const oldFilePath = path.join(
            __dirname,
            "uploads",
            existing.emergency_file
          );
          // Adjust path if your files are stored elsewhere
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        const newFile = files[0];
        filePath = `documents/${userId}/${newFile.filename}`;
        filename = newFile.originalname;
      }

      // 3. Update the record
      await pool.query(
        `UPDATE emergency_contacts SET 
          contact_name = ?, 
          relationship = ?, 
          phone_number = ?, 
          emergency_file = ?, 
          filename = ?, 
          notes = ? 
        WHERE id = ? AND user_id = ?`,
        [
          contact_name || null,
          relationship || null,
          phone_number || null,
          filePath,
          filename,
          notes || null,
          contactId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Emergency contact detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating emergency contact detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-emergency-contacts-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        contact_name AS contactName,
        relationship,
        phone_number AS phoneNumber,
        emergency_file AS pass_file,
        filename,
        notes,
        created_at
      FROM emergency_contacts
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching emergency contacts details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-pets-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      petName: pet_name,
      petType: pet_type,
      otherPetType,
      breed: pet_breed,
      sex: pet_sex,
      color,
      weight,
      birthday,
      microchipInfo: microchip,
      petsitterInstructions: petsitter,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!pet_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet name is required" });
    }

    if (!pet_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet type is required" });
    }

    if (!pet_sex) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet sex is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO pets (
        user_id, pet_name, pet_type, pet_breed, pet_sex, color, weight, birthday,
        microchip, petsitter, nominee_contact, pet_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          pet_name || null,
          pet_type === "other" ? otherPetType || null : pet_type || null,
          pet_breed || null,
          pet_sex || null,
          color || null,
          weight || null,
          birthday || null,
          microchip || null,
          petsitter || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Pet detail added successfully" });
    } catch (err) {
      console.error("Error adding pet detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-pet-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const petId = req.params.id;
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      petName: pet_name,
      petType: pet_type,
      otherPetType,
      breed: pet_breed,
      sex: pet_sex,
      color,
      weight,
      birthday,
      microchipInfo: microchip,
      petsitterInstructions: petsitter,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!pet_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet name is required" });
    }

    if (!pet_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet type is required" });
    }

    if (!pet_sex) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Pet sex is required" });
    }

    try {
      // 1. Fetch existing pet record to get current file info
      const [rows] = await pool.query(
        "SELECT pet_file, filename FROM pets WHERE id = ? AND user_id = ?",
        [petId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Pet detail not found",
        });
      }

      const existing = rows[0];

      let filePath = existing.pet_file;
      let filename = existing.filename;

      // 2. If a new file is uploaded, delete the old file and update file info
      if (files.length > 0) {
        if (existing.pet_file) {
          const oldFilePath = path.join(
            __dirname,
            "uploads",
            existing.pet_file
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        const newFile = files[0];
        filePath = `documents/${userId}/${newFile.filename}`;
        filename = newFile.originalname;
      }

      // 3. Update the pet record
      await pool.query(
        `UPDATE pets SET 
          pet_name = ?, 
          pet_type = ?, 
          pet_breed = ?, 
          pet_sex = ?, 
          color = ?, 
          weight = ?, 
          birthday = ?, 
          microchip = ?, 
          petsitter = ?, 
          nominee_contact = ?, 
          pet_file = ?, 
          filename = ?, 
          notes = ? 
        WHERE id = ? AND user_id = ?`,
        [
          pet_name || null,
          pet_type === "other" ? otherPetType || null : pet_type || null,
          pet_breed || null,
          pet_sex || null,
          color || null,
          weight || null,
          birthday || null,
          microchip || null,
          petsitter || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          petId,
          userId,
        ]
      );

      res.json({ success: true, message: "Pet detail updated successfully" });
    } catch (err) {
      console.error("Error updating pet detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Pets details endpoint
app.get("/api/get-pets-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        pet_name AS petName,
        pet_type AS petType,
        pet_breed AS breed,
        pet_sex AS sex,
        color,
        weight,
        DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday,
        microchip AS microchipInfo,
        petsitter AS petsitterInstructions,
        nominee_contact AS nomineeContact,
        pet_file AS pass_file,
        filename,
        notes,
        created_at
      FROM pets
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching pets details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-physical-photos-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      photoLocation: location,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!location) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Photo location is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO physical_photos (
        user_id, location, nominee_contact, physical_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Physical photos detail added successfully",
      });
    } catch (err) {
      console.error("Error adding physical photos detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-physical-photo-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const photoId = req.params.id;
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      photoLocation: location,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!location) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Photo location is required",
      });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Nominee contact is required",
      });
    }

    try {
      // 1. Fetch existing record for this photo
      const [rows] = await pool.query(
        "SELECT physical_file, filename FROM physical_photos WHERE id = ? AND user_id = ?",
        [photoId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Physical photo detail not found",
        });
      }

      const existing = rows[0];

      let filePath = existing.physical_file;
      let filename = existing.filename;

      // 2. If a new file is uploaded, delete the old file and update file info
      if (files.length > 0) {
        if (existing.physical_file) {
          const oldFilePath = path.join(
            __dirname,
            "uploads",
            existing.physical_file
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        const newFile = files[0];
        filePath = `documents/${userId}/${newFile.filename}`;
        filename = newFile.originalname;
      }

      // 3. Update the record
      await pool.query(
        `UPDATE physical_photos SET 
          location = ?, 
          nominee_contact = ?, 
          physical_file = ?, 
          filename = ?, 
          notes = ? 
        WHERE id = ? AND user_id = ?`,
        [
          location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          photoId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Physical photo detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating physical photo detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Physical Photos details endpoint
app.get("/api/get-physical-photos-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        location AS photoLocation,
        nominee_contact AS contact,
        physical_file AS pass_file,
        filename,
        notes,
        created_at
      FROM physical_photos
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching physical photos details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-family-recipes-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      recipeName: recipe_name,
      ingredients,
      cookingInstructions: cooking_instruction,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!recipe_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Recipe name is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO family_recipes (
        user_id, recipe_name, ingredients, cooking_instruction, nominee_contact, recipe_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          recipe_name || null,
          ingredients || null,
          cooking_instruction || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Family recipe detail added successfully",
      });
    } catch (err) {
      console.error("Error adding family recipe detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-family-recipe-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const recipeId = req.params.id;
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      recipeName: recipe_name,
      ingredients,
      cookingInstructions: cooking_instruction,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!recipe_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Recipe name is required",
      });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Nominee contact is required",
      });
    }

    try {
      // 1. Fetch existing recipe record to get current file info
      const [rows] = await pool.query(
        "SELECT recipe_file, filename FROM family_recipes WHERE id = ? AND user_id = ?",
        [recipeId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res.status(404).json({
          success: false,
          message: "Family recipe detail not found",
        });
      }

      const existing = rows[0];

      let filePath = existing.recipe_file;
      let filename = existing.filename;

      // 2. If a new file is uploaded, delete old file and update file info
      if (files.length > 0) {
        if (existing.recipe_file) {
          const oldFilePath = path.join(
            __dirname,
            "uploads",
            existing.recipe_file
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        const newFile = files[0];
        filePath = `documents/${userId}/${newFile.filename}`;
        filename = newFile.originalname;
      }

      // 3. Update the recipe record
      await pool.query(
        `UPDATE family_recipes SET 
          recipe_name = ?, 
          ingredients = ?, 
          cooking_instruction = ?, 
          nominee_contact = ?, 
          recipe_file = ?, 
          filename = ?, 
          notes = ? 
        WHERE id = ? AND user_id = ?`,
        [
          recipe_name || null,
          ingredients || null,
          cooking_instruction || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recipeId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Family recipe detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating family recipe detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Family Recipes details endpoint
app.get("/api/get-family-recipes-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        recipe_name AS recipeName,
        ingredients,
        cooking_instruction AS cookingInstructions,
        nominee_contact AS contact,
        recipe_file AS pass_file,
        filename,
        notes,
        created_at
      FROM family_recipes
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching family recipes details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-attorneys-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      attorneyType: attorney_type,
      attorneyContactInfo: attorney_contact,
      contact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!attorney_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Attorney type is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO attorneys (
        user_id, attorney_type, attorney_contact, nominee_contact, attorney_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          attorney_type || null,
          attorney_contact || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Attorney detail added successfully",
      });
    } catch (err) {
      console.error("Error adding attorney detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Attorneys details endpoint
app.get("/api/get-attorneys-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        attorney_type AS attorneyType,
        attorney_contact AS attorneyContactInfo,
        nominee_contact AS contact,
        attorney_file AS pass_file,
        filename,
        notes,
        created_at
      FROM attorneys
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching attorneys details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-wills-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      willDocumentLocation: document_location,
      willLastUpdated: last_updated,
      willCreationMethod: create_will,
      willAttorneyContact: attorney_agent,
      willServiceName: service_name,
      willServiceUrl: service_url,
      willOtherCreationMethod: will_create,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!document_location) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Document location is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO wills (
        user_id, document_location, last_updated, create_will, attorney_agent, 
        service_name, service_url, will_create, nominee_contact, will_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          document_location || null,
          last_updated || null,
          create_will || null,
          attorney_agent || null,
          service_name || null,
          service_url || null,
          will_create || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Will detail added successfully" });
    } catch (err) {
      console.error("Error adding will detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Wills details endpoint
app.get("/api/get-wills-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        document_location AS willDocumentLocation,
        DATE_FORMAT(last_updated, '%Y-%m-%d') AS willLastUpdated,
        create_will AS willCreationMethod,
        attorney_agent AS willAttorneyContact,
        service_name AS willServiceName,
        service_url AS willServiceUrl,
        will_create AS willOtherCreationMethod,
        nominee_contact AS nomineeContact,
        will_file AS pass_file,
        filename,
        notes,
        created_at
      FROM wills
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching wills details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-power-of-attorney-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      poaName: poa_name,
      alternatePoaName: poa_alternate,
      documentLocation: poa_location,
      lastUpdated: last_updated,
      poaType: poa_type,
      creationMethod: creation_method,
      attorneyContactInfo: attorney_contact_info,
      serviceName: service_name,
      serviceUrl: service_url,
      otherCreationMethod: other_creation_method,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!poa_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "POA name is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO power_of_attorney (
        user_id, poa_name, poa_alternate, poa_location, last_updated, poa_type, 
        creation_method, attorney_contact_info, service_name, service_url, 
        other_creation_method, nominee_contact, attorney_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          poa_name || null,
          poa_alternate || null,
          poa_location || null,
          last_updated || null,
          poa_type || null,
          creation_method || null,
          attorney_contact_info || null,
          service_name || null,
          service_url || null,
          other_creation_method || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Power of Attorney detail added successfully",
      });
    } catch (err) {
      console.error("Error adding power of attorney detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Power of Attorney details endpoint
app.get("/api/get-power-of-attorney-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        poa_name AS poaName,
        poa_alternate AS alternatePoaName,
        poa_location AS documentLocation,
        DATE_FORMAT(last_updated, '%Y-%m-%d') AS lastUpdated,
        poa_type AS poaType,
        creation_method AS creationMethod,
        attorney_contact_info AS attorneyContactInfo,
        service_name AS serviceName,
        service_url AS serviceUrl,
        other_creation_method AS otherCreationMethod,
        nominee_contact AS nomineeContact,
        attorney_file AS pass_file,
        filename,
        notes,
        created_at
      FROM power_of_attorney
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching power of attorney details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-trusts-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      trustName: trust_name,
      trustDocumentLocation: trust_location,
      trustLastUpdated: last_updated,
      trustPurpose: trust_purpose,
      specificTrustPurpose: trust_specific,
      otherTrustPurpose: other_purpose,
      trustCreationMethod: trust_create,
      trustAttorneyContact: contact_attorney,
      trustServiceName: service_name,
      trustServiceUrl: service_url,
      trustOtherCreationMethod: other_service,
      llcDocumentLocation: llc,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!trust_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Trust name is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO trusts (
        user_id, trust_name, trust_location, last_updated, trust_purpose, trust_specific,
        other_purpose, trust_create, contact_attorney, service_name, service_url,
        other_service, llc, nominee_contact, trusts_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          trust_name || null,
          trust_location || null,
          last_updated || null,
          trust_purpose || null,
          trust_specific || null,
          other_purpose || null,
          trust_create || null,
          contact_attorney || null,
          service_name || null,
          service_url || null,
          other_service || null,
          llc || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({ success: true, message: "Trust detail added successfully" });
    } catch (err) {
      console.error("Error adding trust detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Trusts details endpoint
app.get("/api/get-trusts-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        trust_name AS trustName,
        trust_location AS trustDocumentLocation,
        DATE_FORMAT(last_updated, '%Y-%m-%d') AS trustLastUpdated,
        trust_purpose AS trustPurpose,
        trust_specific AS specificTrustPurpose,
        other_purpose AS otherTrustPurpose,
        trust_create AS trustCreationMethod,
        contact_attorney AS trustAttorneyContact,
        service_name AS trustServiceName,
        service_url AS trustServiceUrl,
        other_service AS trustOtherCreationMethod,
        llc AS llcDocumentLocation,
        nominee_contact AS nomineeContact,
        trusts_file AS pass_file,
        filename,
        notes,
        created_at
      FROM trusts
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching trusts details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-other-legal-documents-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      documentName: document_name,
      documentLocation: location,
      creationMethod: creation_method,
      otherCreationDetails: other_creation_details,
      lastUpdated: last_updated,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!document_name) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Document name is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO other_legal_documents (
        user_id, document_name, location, creation_method, other_creation_details,
        last_updated, nominee_contact, legal_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          document_name || null,
          location || null,
          creation_method || null,
          other_creation_details || null,
          last_updated || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Other legal document detail added successfully",
      });
    } catch (err) {
      console.error("Error adding other legal document detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Other Legal Documents details endpoint
app.get(
  "/api/get-other-legal-documents-details",
  checkAuth,
  async (req, res) => {
    const userId = req.session.userId;

    try {
      const [rows] = await pool.query(
        `SELECT
        id,
        document_name AS documentName,
        location AS documentLocation,
        creation_method AS creationMethod,
        other_creation_details AS otherCreationDetails,
        DATE_FORMAT(last_updated, '%Y-%m-%d') AS lastUpdated,
        nominee_contact AS nomineeContact,
        legal_file AS pass_file,
        filename,
        notes,
        created_at
      FROM other_legal_documents
      WHERE user_id = ?`,
        [userId]
      );

      res.json({ success: true, records: rows });
    } catch (err) {
      console.error("Error fetching other legal documents details:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.post(
  "/api/add-other-insurance-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceType: insurance_type,
      policyNumber: policy_number,
      insuranceAgent: insurance_agent,
      policyDocumentsLocation: location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Insurance type is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO other_insurance (
        user_id, insurance_type, policy_number, insurance_agent, location,
        nominee_contact, insurance_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          insurance_type || null,
          policy_number || null,
          insurance_agent || null,
          location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Other insurance detail added successfully",
      });
    } catch (err) {
      console.error("Error adding other insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-other-insurance-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const recordId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      insuranceType: insurance_type,
      policyNumber: policy_number,
      insuranceAgent: insurance_agent,
      policyDocumentsLocation: location,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!insurance_type || !nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: !insurance_type
          ? "Insurance type is required"
          : "Nominee contact is required",
      });
    }

    try {
      // Fetch existing data
      const [rows] = await pool.query(
        `SELECT insurance_file FROM other_insurance WHERE id = ? AND user_id = ?`,
        [recordId, userId]
      );

      if (rows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = rows[0].insurance_file
        ? path.join(__dirname, rows[0].insurance_file)
        : null;

      let filePath = rows[0].insurance_file;
      let filename = null;

      if (files && files.length > 0) {
        const file = files[0];
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;

        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      await pool.query(
        `UPDATE other_insurance SET
          insurance_type = ?, policy_number = ?, insurance_agent = ?, location = ?,
          nominee_contact = ?, insurance_file = ?, filename = ?, notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          insurance_type || null,
          policy_number || null,
          insurance_agent || null,
          location || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          recordId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Other insurance detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating other insurance detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Other Insurance details endpoint
app.get("/api/get-other-insurance-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        insurance_type AS insuranceType,
        policy_number AS policyNumber,
        insurance_agent AS insuranceAgent,
        location AS policyDocumentsLocation,
        nominee_contact AS nomineeContact,
        insurance_file AS pass_file,
        filename,
        notes,
        created_at
      FROM other_insurance
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching other insurance details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-miles-reward-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      rewardType: reward_type,
      rewardAccountNumber: reward_account_number,
      nomineeContact: nominee_contact,
      companyName: company_name,
      notes,
    } = parsedDetails;

    if (!reward_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Reward type is required" });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO miles_reward (
        user_id, reward_type, reward_account_number, nominee_contact, company_name,
        reward_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          reward_type || null,
          reward_account_number || null,
          nominee_contact || null,
          company_name || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Miles and rewards detail added successfully",
      });
    } catch (err) {
      console.error("Error adding miles and rewards detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-miles-reward-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const rewardId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      rewardType: reward_type,
      rewardAccountNumber: reward_account_number,
      nomineeContact: nominee_contact,
      companyName: company_name,
      notes,
    } = parsedDetails;

    if (!reward_type) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Reward type is required" });
    }

    if (!nominee_contact) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      // Fetch current file info
      const [rows] = await pool.query(
        "SELECT reward_file FROM miles_reward WHERE id = ? AND user_id = ?",
        [rewardId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].reward_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Old file deletion warning:", err.message);
          }
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE miles_reward SET
          reward_type = ?, 
          reward_account_number = ?, 
          company_name = ?,
          nominee_contact = ?, 
          reward_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          reward_type || null,
          reward_account_number || null,
          company_name || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          rewardId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Miles and rewards detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating miles and rewards detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Miles and Rewards details endpoint
app.get("/api/get-miles-reward-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        reward_type AS rewardType,
        reward_account_number AS rewardAccountNumber,
        nominee_contact AS nomineeContact,
        company_name AS companyName,
        reward_file AS pass_file,
        filename,
        notes,
        created_at
      FROM miles_reward
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching miles and rewards details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-government-benefit-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      govBenefitType: gov_benefit_type,
      benefitAccountNumber: benefit_account_number,
      benefitValue: benefit_value,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!gov_benefit_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Government benefit type is required",
      });
    }

    if (!nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO government_benefit (
        user_id, gov_benefit_type, benefit_account_number, benefit_value, nominee_contact,
        benefit_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          gov_benefit_type || null,
          benefit_account_number || null,
          benefit_value ? parseFloat(benefit_value) : null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "Government benefit detail added successfully",
      });
    } catch (err) {
      console.error("Error adding government benefit detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-government-benefit-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;
    const benefitId = req.params.id;

    let parsedDetails;
    try {
      parsedDetails =
        typeof details === "string" ? JSON.parse(details) : details;
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      govBenefitType: gov_benefit_type,
      benefitAccountNumber: benefit_account_number,
      benefitValue: benefit_value,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!gov_benefit_type) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Government benefit type is required",
      });
    }

    if (!nominee_contact) {
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({
        success: false,
        message: "Nominee contact is required",
      });
    }

    try {
      // Get the existing record to retrieve current file info
      const [rows] = await pool.query(
        "SELECT benefit_file FROM government_benefit WHERE id = ? AND user_id = ?",
        [benefitId, userId]
      );

      if (!rows.length) {
        if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      let filePath = rows[0].benefit_file;
      let filename = rows[0].filename;

      const file = files?.length > 0 ? files[0] : null;
      if (file) {
        if (filePath) {
          try {
            fs.unlinkSync(`./${filePath}`);
          } catch (err) {
            console.warn("Old file deletion warning:", err.message);
          }
        }
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `UPDATE government_benefit SET
          gov_benefit_type = ?, 
          benefit_account_number = ?, 
          benefit_value = ?, 
          nominee_contact = ?, 
          benefit_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          gov_benefit_type || null,
          benefit_account_number || null,
          benefit_value ? parseFloat(benefit_value) : null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
          benefitId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Government benefit detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating government benefit detail:", err);
      if (files?.length) files.forEach((file) => fs.unlinkSync(file.path));
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Government Benefit details endpoint
app.get("/api/get-government-benefit-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        gov_benefit_type AS govBenefitType,
        benefit_account_number AS benefitAccountNumber,
        benefit_value AS benefitValue,
        nominee_contact AS nomineeContact,
        benefit_file AS pass_file,
        filename,
        notes,
        created_at
      FROM government_benefit
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching government benefit details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-important-dates-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      occasionType: occasion_type,
      occasionDate: occasion_date,
      getReminded: get_reminded,
      phoneNumber: phone_number,
      contactName: contact_name,
    } = parsedDetails;

    if (!occasion_type) {
      return res
        .status(400)
        .json({ success: false, message: "Occasion type is required" });
    }

    if (!occasion_date) {
      return res
        .status(400)
        .json({ success: false, message: "Occasion date is required" });
    }

    if (!phone_number) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    try {
      // Fetch contacts for the user
      const tableName = `contacts_user_${userId}`;
      await createUserContactsTable(userId);

      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || "plan_beyond", tableName]
      );

      let contact = null;
      if (tables.length > 0 && phone_number !== "custom") {
        const [contacts] = await pool.query(
          `SELECT id, name, phone_number, phone_number1, phone_number2
           FROM ${tableName}
           WHERE phone_number = ?`,
          [phone_number]
        );
        contact = contacts[0] || null;
      }

      let phone_number1 = null;
      let phone_number2 = null;
      let final_contact_name = contact_name;

      if (contact) {
        phone_number1 = contact.phone_number1 || null;
        phone_number2 = contact.phone_number2 || null;
        final_contact_name = contact.name || contact_name;
      }

      await pool.query(
        `INSERT INTO important_dates (
          user_id, occasion_type, occasion_date, get_reminded, contact_name, phone_number, phone_number1, phone_number2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          occasion_type || null,
          occasion_date || null,
          get_reminded || null,
          final_contact_name || null,
          phone_number !== "custom" ? phone_number : null,
          phone_number1,
          phone_number2,
        ]
      );

      res.json({
        success: true,
        message: "Important date detail added successfully.",
      });
    } catch (err) {
      console.error("Error adding important date detail:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-important-date-detail/:id",
  checkAuth,
  documentUpload.array("files"),
  async (req, res) => {
    const dateId = req.params.id;
    const userId = req.session.userId;
    const { details } = req.body;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      occasionType: occasion_type,
      occasionDate: occasion_date,
      getReminded: get_reminded,
      phoneNumber: phone_number,
      contactName: contact_name,
    } = parsedDetails;

    if (!occasion_type) {
      return res
        .status(400)
        .json({ success: false, message: "Occasion type is required" });
    }

    if (!occasion_date) {
      return res
        .status(400)
        .json({ success: false, message: "Occasion date is required" });
    }

    if (!phone_number) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    try {
      // Verify record exists and belongs to user
      const [existingRows] = await pool.query(
        "SELECT * FROM important_dates WHERE id = ? AND user_id = ?",
        [dateId, userId]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Important date detail not found",
        });
      }

      // Fetch contacts for the user, if applicable
      const tableName = `contacts_user_${userId}`;
      await createUserContactsTable(userId);

      const [tables] = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || "plan_beyond", tableName]
      );

      let contact = null;
      if (tables.length > 0 && phone_number !== "custom") {
        const [contacts] = await pool.query(
          `SELECT id, name, phone_number, phone_number1, phone_number2
           FROM ${tableName}
           WHERE phone_number = ?`,
          [phone_number]
        );
        contact = contacts[0] || null;
      }

      let phone_number1 = null;
      let phone_number2 = null;
      let final_contact_name = contact_name;

      if (contact) {
        phone_number1 = contact.phone_number1 || null;
        phone_number2 = contact.phone_number2 || null;
        final_contact_name = contact.name || contact_name;
      }

      await pool.query(
        `UPDATE important_dates SET 
          occasion_type = ?, 
          occasion_date = ?, 
          get_reminded = ?, 
          contact_name = ?, 
          phone_number = ?, 
          phone_number1 = ?, 
          phone_number2 = ?
        WHERE id = ? AND user_id = ?`,
        [
          occasion_type || null,
          occasion_date || null,
          get_reminded || null,
          final_contact_name || null,
          phone_number !== "custom" ? phone_number : null,
          phone_number1,
          phone_number2,
          dateId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Important date detail updated successfully.",
      });
    } catch (err) {
      console.error("Error updating important date detail:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.get("/api/get-important-dates-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        occasion_type AS occasionType,
        DATE_FORMAT(occasion_date, '%Y-%m-%d') AS occasionDate,
        get_reminded AS getReminded,
        contact_name AS contactName,
        phone_number AS phoneNumber,
        phone_number1 AS phoneNumber1,
        phone_number2 AS phoneNumber2,
        created_at
      FROM important_dates
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching important dates details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/add-final-arrangement-detail", checkAuth, async (req, res) => {
  const { details } = req.body;
  const userId = req.session.userId;

  let parsedDetails;
  try {
    parsedDetails = JSON.parse(details);
  } catch (err) {
    console.error("Invalid details format:", err);
    return res
      .status(400)
      .json({ success: false, message: "Invalid details format" });
  }

  const {
    howCremated: how_cremated,
    byCremated: by_cremated,
    otherInstruction: other_instruction,
    nomineeContact: nominee_contact,
  } = parsedDetails;

  if (!how_cremated) {
    return res
      .status(400)
      .json({ success: false, message: "Cremation method is required" });
  }

  try {
    await pool.query(
      `INSERT INTO final_arrangement (
        user_id, how_cremated, by_cremated, other_instruction, nominee_contact
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        how_cremated,
        by_cremated || null,
        other_instruction || null,
        nominee_contact,
      ]
    );

    res.json({
      success: true,
      message: "Final arrangement detail added successfully",
    });
  } catch (err) {
    console.error("Error adding final arrangement detail:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put(
  "/api/edit-final-arrangement-detail/:id",
  checkAuth,
  async (req, res) => {
    const arrangementId = req.params.id;
    const userId = req.session.userId;
    const { details } = req.body;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      howCremated: how_cremated,
      byCremated: by_cremated,
      otherInstruction: other_instruction,
      nomineeContact: nominee_contact,
    } = parsedDetails;

    if (!how_cremated) {
      return res
        .status(400)
        .json({ success: false, message: "Cremation method is required" });
    }

    if (!nominee_contact) {
      return res
        .status(400)
        .json({ success: false, message: "Nominee contact is required" });
    }

    try {
      const [existing] = await pool.query(
        `SELECT id FROM final_arrangement WHERE id = ? AND user_id = ?`,
        [arrangementId, userId]
      );

      if (existing.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Final arrangement not found" });
      }

      await pool.query(
        `UPDATE final_arrangement SET 
        how_cremated = ?, 
        by_cremated = ?, 
        other_instruction = ?, 
        nominee_contact = ?
      WHERE id = ? AND user_id = ?`,
        [
          how_cremated,
          by_cremated || null,
          other_instruction || null,
          nominee_contact,
          arrangementId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "Final arrangement detail updated successfully",
      });
    } catch (err) {
      console.error("Error updating final arrangement detail:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get Final Arrangement details endpoint
app.get("/api/get-final-arrangement-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        how_cremated AS howCremated,
        by_cremated AS byCremated,
        other_instruction AS otherInstruction,
        nominee_contact AS nomineeContact,
        created_at
      FROM final_arrangement
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching final arrangement details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-my-last-letter-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      letterOption: letter_type,
      letterContent: digital_letter,
      letterShareFriends: letter_share,
      letterShareFamily: letter_share1,
      letterShareEveryone: letter_share3,
      notes,
    } = parsedDetails;

    if (!letter_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Letter type is required" });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO my_last_letter (
        user_id, letter_type, digital_letter, letter_file, filename,
        letter_share, letter_share1, letter_share3, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          letter_type || null,
          digital_letter || null,
          filePath,
          filename,
          letter_share ? 1 : 0,
          letter_share1 ? 1 : 0,
          letter_share3 ? 1 : 0,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "My Last Letter detail added successfully",
      });
    } catch (err) {
      console.error("Error adding my last letter detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-my-last-letter-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const letterId = req.params.id;
    const userId = req.session.userId;
    const { details } = req.body;
    const files = req.files;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      letterOption: letter_type,
      letterContent: digital_letter,
      letterShareFriends: letter_share,
      letterShareFamily: letter_share1,
      letterShareEveryone: letter_share3,
      notes,
    } = parsedDetails;

    if (!letter_type) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Letter type is required" });
    }

    try {
      // Get the existing record to handle file preservation
      const [existingRows] = await pool.query(
        `SELECT letter_file FROM my_last_letter WHERE id = ? AND user_id = ?`,
        [letterId, userId]
      );

      if (existingRows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Letter record not found" });
      }

      const oldFilePath = existingRows[0].letter_file;
      let newFilePath = oldFilePath;
      let newFilename = null;

      // Handle file logic based on letter_type
      if (
        letter_type === "physical" &&
        oldFilePath &&
        fs.existsSync(path.join("uploads", oldFilePath))
      ) {
        // Remove existing image for physical letter
        fs.unlinkSync(path.join("uploads", oldFilePath));
        newFilePath = null;
        newFilename = null;
      } else if (files && files.length > 0) {
        // Handle new file upload for non-physical letter
        const file = files[0];
        newFilePath = `documents/${userId}/${file.filename}`;
        newFilename = file.originalname;

        // Delete the old file if it exists
        if (oldFilePath && fs.existsSync(path.join("uploads", oldFilePath))) {
          fs.unlinkSync(path.join("uploads", oldFilePath));
        }
      }

      await pool.query(
        `UPDATE my_last_letter SET
          letter_type = ?, 
          digital_letter = ?, 
          letter_file = ?, 
          filename = ?, 
          letter_share = ?, 
          letter_share1 = ?, 
          letter_share3 = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          letter_type || null,
          digital_letter || null,
          newFilePath || null,
          newFilename,
          letter_share ? 1 : 0,
          letter_share1 ? 1 : 0,
          letter_share3 ? 1 : 0,
          notes || null,
          letterId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "My Last Letter detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing my last letter detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get My Last Letter details endpoint
app.get("/api/get-my-last-letter-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        letter_type AS letterOption,
        digital_letter AS letterContent,
        letter_file AS file_path,
        filename,
        letter_share AS letterShareFriends,
        letter_share1 AS letterShareFamily,
        letter_share3 AS letterShareEveryone,
        notes,
        created_at
      FROM my_last_letter
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching my last letter details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-about-my-life-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      lifeThoughts: live_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!live_thought || !nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Life thoughts and nominee contact are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO about_my_life (
        user_id, live_thought, nominee_contact, life_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          live_thought || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "About My Life detail added successfully",
      });
    } catch (err) {
      console.error("Error adding about my life detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-about-my-life-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const lifeId = req.params.id;
    const userId = req.session.userId;
    const { details } = req.body;
    const files = req.files;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      lifeThoughts: live_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!live_thought || !nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Life thoughts and nominee contact are required",
      });
    }

    try {
      // Check if the record exists
      const [existingRows] = await pool.query(
        `SELECT life_file FROM about_my_life WHERE id = ? AND user_id = ?`,
        [lifeId, userId]
      );

      if (existingRows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = existingRows[0].life_file;
      let newFilePath = oldFilePath;
      let newFilename = null;

      // Handle new file upload
      if (files && files.length > 0) {
        const file = files[0];
        newFilePath = `documents/${userId}/${file.filename}`;
        newFilename = file.originalname;

        // Delete old file if it exists
        if (oldFilePath && fs.existsSync(path.join("uploads", oldFilePath))) {
          fs.unlinkSync(path.join("uploads", oldFilePath));
        }
      }

      await pool.query(
        `UPDATE about_my_life SET
          live_thought = ?, 
          nominee_contact = ?, 
          life_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          live_thought || null,
          nominee_contact || null,
          newFilePath || null,
          newFilename,
          notes || null,
          lifeId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "About My Life detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing about my life detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get About My Life details endpoint
app.get("/api/get-about-my-life-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        live_thought AS lifeThoughts,
        nominee_contact AS nomineeContact,
        life_file AS file_path,
        filename,
        notes,
        created_at
      FROM about_my_life
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching about my life details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post(
  "/api/add-my-secret-detail",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const { details } = req.body;
    const files = req.files;
    const userId = req.session.userId;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({ success: false, message: "Invalid details format" });
    }

    const {
      secretThoughts: secret_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!secret_thought || !nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Secret thoughts and nominee contact are required",
      });
    }

    try {
      const file = files.length > 0 ? files[0] : null;
      let filePath = null;
      let filename = null;
      if (file) {
        filePath = `documents/${userId}/${file.filename}`;
        filename = file.originalname;
      }

      await pool.query(
        `INSERT INTO my_secret (
        user_id, secret_thought, nominee_contact, secret_file, filename, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          secret_thought || null,
          nominee_contact || null,
          filePath,
          filename,
          notes || null,
        ]
      );

      res.json({
        success: true,
        message: "My Secret detail added successfully",
      });
    } catch (err) {
      console.error("Error adding my secret detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

app.put(
  "/api/edit-my-secret-detail/:id",
  checkAuth,
  documentUpload.array("files", 10),
  async (req, res) => {
    const secretId = req.params.id;
    const userId = req.session.userId;
    const { details } = req.body;
    const files = req.files;

    let parsedDetails;
    try {
      parsedDetails = JSON.parse(details);
    } catch (err) {
      console.error("Invalid details format:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Invalid details format",
      });
    }

    const {
      secretThoughts: secret_thought,
      nomineeContact: nominee_contact,
      notes,
    } = parsedDetails;

    if (!secret_thought || !nominee_contact) {
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({
        success: false,
        message: "Secret thoughts and nominee contact are required",
      });
    }

    try {
      // Check if the record exists
      const [existingRows] = await pool.query(
        `SELECT secret_file FROM my_secret WHERE id = ? AND user_id = ?`,
        [secretId, userId]
      );

      if (existingRows.length === 0) {
        if (files && files.length > 0) {
          files.forEach((file) => fs.unlinkSync(file.path));
        }
        return res
          .status(404)
          .json({ success: false, message: "Record not found" });
      }

      const oldFilePath = existingRows[0].secret_file;
      let newFilePath = oldFilePath;
      let newFilename = null;

      // Handle new file upload
      if (files && files.length > 0) {
        const file = files[0];
        newFilePath = `documents/${userId}/${file.filename}`;
        newFilename = file.originalname;

        // Delete old file if it exists
        if (oldFilePath && fs.existsSync(path.join("uploads", oldFilePath))) {
          fs.unlinkSync(path.join("uploads", oldFilePath));
        }
      }

      await pool.query(
        `UPDATE my_secret SET 
          secret_thought = ?, 
          nominee_contact = ?, 
          secret_file = ?, 
          filename = ?, 
          notes = ?
        WHERE id = ? AND user_id = ?`,
        [
          secret_thought || null,
          nominee_contact || null,
          newFilePath || null,
          newFilename,
          notes || null,
          secretId,
          userId,
        ]
      );

      res.json({
        success: true,
        message: "My Secret detail updated successfully",
      });
    } catch (err) {
      console.error("Error editing my secret detail:", err);
      if (files && files.length > 0) {
        files.forEach((file) => fs.unlinkSync(file.path));
      }
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get My Secret details endpoint
app.get("/api/get-my-secret-details", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        secret_thought AS secretThoughts,
        nominee_contact AS nomineeContact,
        secret_file AS file_path,
        filename,
        notes,
        created_at
      FROM my_secret
      WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, records: rows });
  } catch (err) {
    console.error("Error fetching my secret details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date)) return "Unknown";
  const options = { year: "numeric", month: "long", day: "2-digit" };
  return date.toLocaleDateString("en-US", options);
};

app.post("/api/send-message", async (req, res) => {
  const { userId, message, dateOfDeath } = req.body;

  console.log("Session data:", req.session);
  console.log("Received userId:", userId, "Type:", typeof userId);
  console.log(
    "Session userId:",
    req.session.userId,
    "Type:",
    typeof req.session.userId
  );

  if (!userId || !message || !dateOfDeath) {
    return res.status(400).json({
      success: false,
      message: "User ID, message, and date of death are required.",
    });
  }

  if (!req.session.userId) {
    console.error("No session userId found");
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No active session.",
    });
  }

  // Convert both to strings for comparison
  const sessionUserIdStr = String(req.session.userId);
  const receivedUserIdStr = String(userId);

  if (sessionUserIdStr !== receivedUserIdStr) {
    console.error(
      `Session userId (${req.session.userId}, type: ${typeof req.session
        .userId}) does not match provided userId (${userId}, type: ${typeof userId})`
    );
    return res.status(403).json({
      success: false,
      message: "Forbidden: User ID mismatch.",
    });
  }

  try {
    // Verify user and fetch ambassador_id, ambassador_user_id
    const [users] = await pool.query(
      "SELECT ambassador_id, ambassador_user_id FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = users[0];
    if (!user.ambassador_id && !user.ambassador_user_id) {
      return res.status(400).json({
        success: false,
        message: "No ambassador associated with this user.",
      });
    }

    // Fetch Secondary ambassador's email
    let ambassadorEmail;
    if (user.ambassador_user_id) {
      const [ambassadors] = await pool.query(
        "SELECT email FROM ambassadors WHERE user_id = ? AND ambassador_type = 'Secondary'",
        [user.ambassador_user_id]
      );
      if (ambassadors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No Secondary ambassador found for this user.",
        });
      }
      ambassadorEmail = ambassadors[0].email;
    } else {
      // Fallback: use sender's ambassador email
      const [ambassadors] = await pool.query(
        "SELECT email FROM ambassadors WHERE id = ?",
        [user.ambassador_id]
      );
      if (ambassadors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ambassador not found.",
        });
      }
      ambassadorEmail = ambassadors[0].email;
    }

    // Fetch profile data for the user associated with ambassador_user_id
    let profile = {};
    if (user.ambassador_user_id) {
      const [profiles] = await pool.query(
        "SELECT first_name, last_name, middle_name, date_of_birth, profile_image FROM profile WHERE user_id = ?",
        [user.ambassador_user_id]
      );
      if (profiles.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found for this user.",
        });
      }
      profile = profiles[0];
    } else {
      // Fallback: use sender's profile (if ambassador)
      const [profiles] = await pool.query(
        "SELECT first_name, last_name, middle_name, date_of_birth, profile_image FROM profile WHERE user_id = ?",
        [userId]
      );
      if (profiles.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found for ambassador.",
        });
      }
      profile = profiles[0];
    }

    // Construct full name
    const fullName = [
      profile.first_name,
      profile.middle_name || "",
      profile.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Construct profile image URL
    const profileImageUrl = profile.profile_image
      ? `${process.env.APP_BASE_URL}/images/${profile.profile_image.replace(
        /^images\/|^\//,
        ""
      )}?t=${Date.now()}`
      : null;

    // Create Death_message table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Death_message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        date_of_death DATE NOT NULL,
        ambassador_approve BOOLEAN DEFAULT FALSE,
        plan_admin_approve BOOLEAN DEFAULT FALSE,
        ambassador_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON DELETE CASCADE
      )
    `);

    // Insert message into Death_message table
    const [insertResult] = await pool.query(
      `INSERT INTO Death_message (user_id, message, date_of_death, ambassador_approve, plan_admin_approve, ambassador_id)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [
        user.ambassador_user_id || userId,
        message,
        dateOfDeath,
        user.ambassador_id || userId,
      ]
    );

    const messageId = insertResult.insertId;

    // Send email to Secondary ambassador with styled death message
    const approveLink = `${process.env.APP_BASE_URL}/api/approve-message?messageId=${messageId}`;
    const mailOptions = {
      from: `"ThePlanBeyond Team" <${process.env.EMAIL_USER}>`,
      to: ambassadorEmail,
      subject: "A Tribute Awaits Your Approval",
      html: `
        <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 30px;">
          <div style="text-align: left;">
            <p style="font-size: 15px; color: #333; margin: 0 0 20px; line-height: 1.6;">
              Hi,<br><br>
              We are sorry to inform you that ${fullName} is no longer with us. She passed away on ${formatDate(
        dateOfDeath
      )}, leaving behind a legacy of love, warmth, and unforgettable strength.<br>
              A tribute has been prepared in memory of ${fullName} — a soul forever cherished. Her kindness, strength, and laughter touched everyone around her.<br>
              This message has been submitted as part of her Plan Beyond memorial.<br><br>
              You’ve been identified as someone who can help approve and honor this message.
            </p>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px auto;">
            <h1 style="font-size: 22px; color: #333; margin: 0 0 15px; font-weight: normal;">Rest in Peace</h1>
            ${profileImageUrl
          ? `
              <img src="${profileImageUrl}" alt="Profile Image" style="max-width: 120px; height: auto; border-radius: 50%; margin: 10px auto; display: block; border: 2px solid #e0e0e0;" />
            `
          : ""
        }
            <h2 style="font-size: 20px; color: #333; margin: 10px 0; font-weight: normal;">${fullName}</h2>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">
              ${formatDate(profile.date_of_birth)} – ${formatDate(dateOfDeath)}
            </p>
            <p style="font-size: 15px; color: #333; margin: 20px 0; line-height: 1.6; padding: 0 20px;">
              "${message.replace(/\n/g, "<br>")}"
            </p>
          </div>
          <div style="text-align: left;">
            <p style="font-size: 15px; color: #333; margin: 20px 0; line-height: 1.6;">
              Please take a moment to review and approve the message to ensure the tribute reflects the love and respect she deserves.
            </p>
            <p style="margin: 25px 0;">
              <a href="${approveLink}" style="display: inline-block; padding: 8px 25px; background-color: #007c6a; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 14px;">Approve Message</a>
            </p>
            <p style="font-size: 13px; color: #777; margin: 10px 0;">
              If you have any questions or would like to modify the tribute, please contact us at <a href="mailto:support@theplanbeyond.com" style="color: #4a4a4a; text-decoration: none;">support@theplanbeyond.com</a>.
            </p>
            <p style="font-size: 13px; color: #1f1f2a; margin: 10px 0; line-height:1.8">With heartfelt sympathies,<br>The Plan Beyond Team</p>
          </div>
        </div>
      `,
      text: `
Hi,

We are sorry to inform you that ${fullName} is no longer with us. He/She passed away on ${formatDate(
        dateOfDeath
      )}, leaving behind a legacy of love, warmth, and unforgettable strength.
A tribute has been prepared in memory of ${fullName} — a soul forever cherished. His/Her kindness, strength, and laughter touched everyone around his/her.
This message has been submitted as part of his/her Plan Beyond memorial.
You’ve been identified as someone who can help approve and honor this message.

Rest in Peace
${fullName}
${formatDate(profile.date_of_birth)} - ${formatDate(dateOfDeath)}

"${message}"

Please take a moment to review and approve the message to ensure the tribute reflects the love and respect she deserves.

Please approve this message using the following link: ${approveLink}

If you have any questions or would like to modify the tribute, please contact us at support@theplanbeyond.com.

With heartfelt sympathies,
The Plan Beyond Team
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

app.get("/api/approve-message", async (req, res) => {
  const { messageId } = req.query;

  if (!messageId || isNaN(parseInt(messageId))) {
    return res.status(400).json({
      success: false,
      message: "Valid message ID is required.",
    });
  }

  try {
    // Step 1: Verify message exists and is not already approved
    const [messages] = await pool.query(
      "SELECT ambassador_approve FROM Death_message WHERE id = ?",
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (messages[0].ambassador_approve === 1) {
      return res.status(400).json({
        success: false,
        message: "Message already approved.",
      });
    }

    // Step 2: Update ambassador_approve to 1
    const [updateResult] = await pool.query(
      "UPDATE Death_message SET ambassador_approve = 1 WHERE id = ?",
      [messageId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to approve message.",
      });
    }

    // Step 3: Redirect or return JSON based on client
    if (req.headers["accept"] && req.headers["accept"].includes("text/html")) {
      const redirectUrl = `${process.env.FRONTEND_URL
        }/confirmation?message=${encodeURIComponent(
          "Message approved successfully"
        )}`;
      return res.redirect(redirectUrl);
    } else {
      return res.json({
        success: true,
        message: "Message approved successfully.",
      });
    }
  } catch (err) {
    console.error("Error approving message:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

app.get("/api/check-user-status", async (req, res) => {
  const { userId } = req.query;

  console.log("Received userId:", userId, "Type:", typeof userId);
  console.log(
    "Session userId:",
    req.session.userId,
    "Type:",
    typeof req.session.userId
  );

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  if (!req.session.userId) {
    console.error("No session userId found");
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No active session.",
    });
  }

  // Convert both to strings for comparison
  const sessionUserIdStr = String(req.session.userId);
  const receivedUserIdStr = String(userId);

  if (sessionUserIdStr !== receivedUserIdStr) {
    console.error(
      `Session userId (${req.session.userId}) does not match provided userId (${userId})`
    );
    return res.status(403).json({
      success: false,
      message: "Forbidden: User ID mismatch.",
    });
  }

  try {
    const [users] = await pool.query(
      "SELECT is_verified, ambassador_accept FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = users[0];
    return res.json({
      success: true,
      is_verified: user.is_verified,
      ambassador_accept: user.ambassador_accept,
    });
  } catch (err) {
    console.error("Error fetching user status:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message || "Unknown error occurred."}`,
    });
  }
});

app.post(
  "/api/upload-audio",
  checkAuth,
  audioUpload.single("file"),
  async (req, res) => {
    try {
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
        req.session.userId,
      ]);
      if (users.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No audio file uploaded." });
      }

      const { contacts, notes, delivery_date } = req.body;
      if (!contacts) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      let parsedContacts;
      try {
        parsedContacts = JSON.parse(contacts);
        if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid contacts data." });
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid contacts format." });
      }

      const contactFields = {
        contact1: parsedContacts[0]?.phone_number || null,
        contact_name1: parsedContacts[0]?.name || null,
        contact2: parsedContacts[1]?.phone_number || null,
        contact_name2: parsedContacts[1]?.name || null,
        contact3: parsedContacts[2]?.phone_number || null,
        contact_name3: parsedContacts[2]?.name || null,
        contact4: parsedContacts[3]?.phone_number || null,
        contact_name4: parsedContacts[3]?.name || null,
        contact5: parsedContacts[4]?.phone_number || null,
        contact_name5: parsedContacts[4]?.name || null,
      };

      if (!contactFields.contact1) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      if (!delivery_date) {
        return res.status(400).json({
          success: false,
          message: "Delivery date is required.",
        });
      }

      const audioPath = `audios/${req.session.userId}/${req.file.filename}`;

      await pool.query(
        `INSERT INTO audio_message (
          user_id, audio_path, notes, delivery_date,
          contact1, contact_name1,
          contact2, contact_name2,
          contact3, contact_name3,
          contact4, contact_name4,
          contact5, contact_name5
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          audioPath,
          notes || null,
          delivery_date || null,
          contactFields.contact1,
          contactFields.contact_name1,
          contactFields.contact2,
          contactFields.contact_name2,
          contactFields.contact3,
          contactFields.contact_name3,
          contactFields.contact4,
          contactFields.contact_name4,
          contactFields.contact5,
          contactFields.contact_name5,
        ]
      );

      res.json({ success: true, message: "Audio uploaded successfully." });
    } catch (err) {
      console.error("Error uploading audio:", err);
      if (req.file) {
        const filePath = path.join(__dirname, req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res
        .status(500)
        .json({ success: false, message: `Server error: ${err.message}` });
    }
  }
);

app.get("/api/audios", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      req.session.userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const [audios] = await pool.query(
      `SELECT id, audio_path, notes, delivery_date,
              contact1, contact_name1,
              contact2, contact_name2,
              contact3, contact_name3,
              contact4, contact_name4,
              contact5, contact_name5,
              created_at
       FROM audio_message
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.session.userId]
    );

    const formattedAudios = audios.map((audio) => {
      const contacts = [
        { phone_number: audio.contact1, name: audio.contact_name1 },
        { phone_number: audio.contact2, name: audio.contact_name2 },
        { phone_number: audio.contact3, name: audio.contact_name3 },
        { phone_number: audio.contact4, name: audio.contact_name4 },
        { phone_number: audio.contact5, name: audio.contact_name5 },
      ].filter((contact) => contact.phone_number && contact.name);

      return {
        id: audio.id,
        audio_path: audio.audio_path,
        notes: audio.notes || "",
        delivery_date: audio.delivery_date || null,
        contacts: contacts,
        created_at: audio.created_at,
      };
    });

    res.json({ success: true, audios: formattedAudios });
  } catch (err) {
    console.error("Error fetching audios:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.put(
  "/api/audios/:id",
  checkAuth,
  audioUpload.single("file"),
  async (req, res) => {
    try {
      const audioId = req.params.id;
      const userId = req.session.userId;
      const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
        userId,
      ]);
      if (users.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      const [audios] = await pool.query(
        "SELECT audio_path FROM audio_message WHERE id = ? AND user_id = ?",
        [audioId, userId]
      );
      if (audios.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Audio not found." });
      }

      const existingAudio = audios[0];
      let audioPath = existingAudio.audio_path;

      if (req.file) {
        const oldFilePath = path.join(__dirname, existingAudio.audio_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        audioPath = `audios/${userId}/${req.file.filename}`;
      }

      const { contacts, notes, delivery_date } = req.body;
      let parsedContacts = [];
      if (contacts) {
        try {
          parsedContacts = JSON.parse(contacts);
          if (!Array.isArray(parsedContacts) || parsedContacts.length === 0) {
            return res
              .status(400)
              .json({ success: false, message: "Invalid contacts data." });
          }
        } catch (err) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid contacts format." });
        }
      }

      const contactFields = {
        contact1: parsedContacts[0]?.phone_number || null,
        contact_name1: parsedContacts[0]?.name || null,
        contact2: parsedContacts[1]?.phone_number || null,
        contact_name2: parsedContacts[1]?.name || null,
        contact3: parsedContacts[2]?.phone_number || null,
        contact_name3: parsedContacts[2]?.name || null,
        contact4: parsedContacts[3]?.phone_number || null,
        contact_name4: parsedContacts[3]?.name || null,
        contact5: parsedContacts[4]?.phone_number || null,
        contact_name5: parsedContacts[4]?.name || null,
      };
      if (contacts && !contactFields.contact1) {
        return res.status(400).json({
          success: false,
          message: "At least one contact is required.",
        });
      }

      if (!delivery_date) {
        return res.status(400).json({
          success: false,
          message: "Delivery date is required.",
        });
      }

      await pool.query(
        `UPDATE audio_message
         SET audio_path = ?, notes = ?, delivery_date = ?,
             contact1 = ?, contact_name1 = ?,
             contact2 = ?, contact_name2 = ?,
             contact3 = ?, contact_name3 = ?,
             contact4 = ?, contact_name4 = ?,
             contact5 = ?, contact_name5 = ?
         WHERE id = ? AND user_id = ?`,
        [
          audioPath,
          notes || null,
          delivery_date || null,
          contactFields.contact1,
          contactFields.contact_name1,
          contactFields.contact2,
          contactFields.contact_name2,
          contactFields.contact3,
          contactFields.contact_name3,
          contactFields.contact4,
          contactFields.contact_name4,
          contactFields.contact5,
          contactFields.contact_name5,
          audioId,
          userId,
        ]
      );

      res.json({ success: true, message: "Audio updated successfully." });
    } catch (err) {
      console.error("Error updating audio:", err);
      if (req.file) {
        const filePath = path.join(__dirname, req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res
        .status(500)
        .json({ success: false, message: `Server error: ${err.message}` });
    }
  }
);

app.delete("/api/audios/:id", checkAuth, async (req, res) => {
  try {
    const audioId = req.params.id;
    const userId = req.session.userId;

    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    const [audios] = await pool.query(
      "SELECT audio_path FROM audio_message WHERE id = ? AND user_id = ?",
      [audioId, userId]
    );
    if (audios.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Audio not found." });
    }

    const audioPath = path.join(__dirname, audios[0].audio_path);
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    await pool.query("DELETE FROM audio_message WHERE id = ? AND user_id = ?", [
      audioId,
      userId,
    ]);

    res.json({ success: true, message: "Audio deleted successfully." });
  } catch (err) {
    console.error("Error deleting audio:", err);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
