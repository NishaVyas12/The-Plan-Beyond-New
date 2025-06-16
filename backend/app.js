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
    secret: process.env.SESSION_SECRET || "4abb9ebc8ad8a34bc118ef1856571ea209a6d90c00052f2a1353a6b4f6707065",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

const rpName = "The Plan Beyond";
const rpID = process.env.WEBAUTHN_RPID || "localhost";
const origin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use("/images", express.static(path.join(__dirname, "images")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "plan_beyond",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

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
      ambassador_id INT NULL,
      ambassador_user_id INT NULL,
      ambassador_accept BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
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

const createWebAuthnCredentialsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      credential_id VARCHAR(255) NOT NULL,
      public_key TEXT NOT NULL,
      counter BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY unique_credential_id (credential_id)
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

(async () => {
  try {
    await createUsersTable();
    await createProfileTable();
    await createUserPopupResponsesTable();
    await createWebAuthnCredentialsTable();
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

    const [result] = await pool.query(
      "INSERT INTO users (email, password, otp, is_verified) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, otp, false]
    );

    const userId = result.insertId;
    req.session.userId = userId;

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

    res.json({ success: true, message: "OTP sent to your email.", userId });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp, isPasswordReset } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    const user = users[0];
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    if (!isPasswordReset) {
      await pool.query(
        "UPDATE users SET is_verified = ?, otp = NULL WHERE email = ?",
        [true, email]
      );
      req.session.userId = user.id;
    }

    res.json({
      success: true,
      message: "OTP verified successfully.",
      userId: isPasswordReset ? null : user.id,
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/register-biometric", checkAuth, async (req, res) => {
  const { email, userId } = req.body;

  if (!email || !userId || userId !== req.session.userId) {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  try {
    const [users] = await pool.query("SELECT id, email FROM users WHERE id = ? AND email = ?", [userId, email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userId: Buffer.from(user.id.toString()),
      userName: user.email,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      excludeCredentials: [],
    });

    req.session.challenge = options.challenge;
    req.session.userId = user.id;

    res.json({ success: true, options });
  } catch (err) {
    console.error("Error generating biometric registration options:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/verify-biometric-registration", checkAuth, async (req, res) => {
  const { response, userId } = req.body;

  // Validate inputs
  if (!response || !userId || userId !== req.session.userId) {
    console.error("Invalid request: Missing response or userId mismatch", { response, userId, sessionUserId: req.session.userId });
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  try {
    const [users] = await pool.query("SELECT id, email FROM users WHERE id = ?", [parseInt(userId)]);
    if (users.length === 0) {
      console.error("User not found for userId:", userId);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const expectedChallenge = req.session.challenge;
    if (!expectedChallenge) {
      console.error("No challenge found in session for userId:", userId);
      return res.status(400).json({ success: false, message: "No challenge found in session." });
    }

    // Log response for debugging
    console.log("WebAuthn response received:", JSON.stringify(response, null, 2));

    // Decode clientDataJSON to verify challenge
    let clientData;
    try {
      clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64").toString());
      console.log("Decoded clientDataJSON:", clientData);
      if (clientData.challenge !== expectedChallenge) {
        console.error("Challenge mismatch:", { received: clientData.challenge, expected: expectedChallenge });
        return res.status(400).json({ success: false, message: "Challenge mismatch." });
      }
    } catch (err) {
      console.error("Error decoding clientDataJSON:", err);
      return res.status(400).json({ success: false, message: "Invalid client data." });
    }

    // Verify WebAuthn response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch (err) {
      console.error("Verification error:", err);
      return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
    }

    console.log("Verification result:", JSON.stringify(verification, null, 2));

    if (verification.verified && verification.registrationInfo && verification.registrationInfo.credential) {
      const { id: credentialID, publicKey: credentialPublicKey, counter } = verification.registrationInfo.credential;

      // Validate credential fields
      if (!credentialID || !credentialPublicKey || counter === undefined) {
        console.error("Invalid registrationInfo.credential:", { credentialID, credentialPublicKey, counter });
        return res.status(400).json({ success: false, message: "Invalid biometric registration data." });
      }

      // Normalize credential_id by removing padding
      const normalizedCredentialID = credentialID.replace(/=+$/, '');
      console.log("Storing credential_id:", normalizedCredentialID);

      await pool.query(
        "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter) VALUES (?, ?, ?, ?)",
        [
          parseInt(userId),
          normalizedCredentialID, // Store base64url string without padding
          Buffer.from(credentialPublicKey).toString("base64"),
          counter,
        ]
      );

      delete req.session.challenge;

      res.json({ success: true, message: "Biometric registration successful." });
    } else {
      console.error("Biometric registration verification failed:", verification);
      return res.status(400).json({ success: false, message: "Biometric registration verification failed." });
    }
  } catch (err) {
    console.error("Error verifying biometric registration:", err, { response, userId });
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

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, password, is_verified, ambassador_accept FROM users WHERE email = ?",
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
    res.json({ success: true,
      email: user.email });
  } catch (err) {
    console.error("Error retrieving user:", err);
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
        .json({ success: false, message: "Session timed out, please login again." });
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

    res.json({ success: true, message: "User responses saved successfully." });
  } catch (err) {
    console.error("Error saving popup responses:", err);
    res.status(500).json({ success: false, message: "Server error." });
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







app.post("/api/login-biometric", async (req, res) => {
  try {
    const [credentials] = await pool.query(
      "SELECT user_id, credential_id FROM webauthn_credentials"
    );

    if (credentials.length === 0) {
      console.error("No biometric credentials found in the database.");
      return res.status(400).json({
        success: false,
        message: "No biometric credentials registered.",
      });
    }

    // Validate credential_id format
    const validCredentials = credentials.filter(cred => {
      if (typeof cred.credential_id !== 'string' || !cred.credential_id) {
        console.warn("Invalid credential_id type or empty for user_id:", cred.user_id, { credential_id: cred.credential_id });
        return false;
      }
      // Allow base64url characters (A-Z, a-z, 0-9, -, _, =)
      const base64urlRegex = /^[A-Za-z0-9\-_=]+$/;
      if (!base64urlRegex.test(cred.credential_id)) {
        console.warn("Invalid base64url format for credential_id for user_id:", cred.user_id, { credential_id: cred.credential_id });
        return false;
      }
      return true;
    });

    if (validCredentials.length === 0) {
      console.error("No valid credentials found after filtering.");
      return res.status(400).json({
        success: false,
        message: "No valid biometric credentials registered. Please re-register your biometrics.",
      });
    }

    console.log("Valid credentials:", validCredentials.map(cred => ({
      user_id: cred.user_id,
      credential_id: cred.credential_id,
    })));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: validCredentials.map(cred => ({
        id: cred.credential_id, // Use raw base64url string
        type: "public-key",
      })),
      userVerification: "required",
    });

    req.session.challenge = options.challenge;
    console.log("Generated biometric login options:", JSON.stringify(options, null, 2));

    res.json({ success: true, options });
  } catch (err) {
    console.error("Error generating biometric login options:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Replace the existing /api/verify-biometric-login endpoint
app.post("/api/verify-biometric-login", async (req, res) => {
  const { response } = req.body;

  if (!response || !response.id) {
    console.error("Invalid request: Missing response or response.id", { response });
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  try {
    const expectedChallenge = req.session.challenge;
    if (!expectedChallenge) {
      console.error("No challenge found in session");
      return res.status(400).json({ success: false, message: "No challenge found in session." });
    }

    const credentialId = response.id; // Base64url string
    console.log("Verifying credential_id:", credentialId);

    const [credentials] = await pool.query(
      "SELECT user_id, credential_id, public_key, counter FROM webauthn_credentials WHERE credential_id = ?",
      [credentialId]
    );

    if (credentials.length === 0) {
      console.error("No credentials found for credential_id:", credentialId);
      return res.status(400).json({
        success: false,
        message: "No biometric credentials found for this user.",
      });
    }

    const credential = credentials[0];
    const [users] = await pool.query(
      "SELECT id, email, is_verified, ambassador_accept FROM users WHERE id = ?",
      [credential.user_id]
    );

    if (users.length === 0) {
      console.error("User not found for user_id:", credential.user_id);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: Buffer.from(credential.credential_id, "base64url"),
          publicKey: Buffer.from(credential.public_key, "base64"),
          counter: credential.counter,
        },
        requireUserVerification: true,
      });
    } catch (err) {
      console.error("Verification error:", err);
      return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
    }

    console.log("Verification result:", JSON.stringify(verification, null, 2));

    if (verification.verified) {
      await pool.query(
        "UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?",
        [verification.authenticationInfo.newCounter, credential.credential_id]
      );

      delete req.session.challenge;

      if (user.is_verified === 1) {
        req.session.userId = user.id;
        return res.json({
          success: true,
          message: "Biometric login successful.",
          userId: user.id,
          userType: "user",
        });
      } else if (user.is_verified === 0 && user.ambassador_accept === 0) {
        return res.status(400).json({
          success: false,
          message: "You haven't accepted the ambassador request. Please accept and login again.",
        });
      } else if (user.is_verified === 0 && user.ambassador_accept === 1) {
        req.session.userId = user.id;
        return res.json({
          success: true,
          message: "Biometric login successful.",
          userId: user.id,
          userType: "ambassador",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Please verify your email with OTP.",
        });
      }
    } else {
      console.error("Biometric login verification failed:", verification);
      return res.status(400).json({ success: false, message: "Biometric login verification failed." });
    }
  } catch (err) {
    console.error("Error verifying biometric login:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});