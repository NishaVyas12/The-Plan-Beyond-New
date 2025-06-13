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
// WebAuthn configuration
const rpName = "The Plan Beyond";
const rpID = "localhost";
const origin = `http://localhost:5173`

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
    // Note: createNomineesTable and createAmbassadorsTable are assumed to exist elsewhere
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
    // Check users table
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

    // Validation rules
    if (user.is_verified === 1) {
      // Case 1: Verified user, redirect to dashboard
      req.session.userId = user.id;
      return res.json({
        success: true,
        message: "Login successful.",
        userId: user.id,
        userType: "user",
      });
    } else if (user.is_verified === 0 && user.ambassador_accept === 0) {
      // Case 2: Unverified user with unaccepted ambassador request
      return res.status(400).json({
        success: false,
        message:
          "You haven't accepted the ambassador request. Please accept and login again.",
      });
    } else if (user.is_verified === 0 && user.ambassador_accept === 1) {
      // Case 3: Unverified user with accepted ambassador request, redirect to send-message
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