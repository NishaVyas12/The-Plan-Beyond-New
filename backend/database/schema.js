const { pool } = require("../config/database");

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
      remember_me BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating users table:", err);
    throw err;
  }
};

const createDevicesTable = async () => {
  const query = `
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device_id VARCHAR(255) NOT NULL UNIQUE,
        device_name VARCHAR(255),
        is_trusted BOOLEAN DEFAULT FALSE,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating devices table:", err);
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
      address_line_1 VARCHAR(1000),
      address_line_2 VARCHAR(1000),
      city VARCHAR(100),
      state VARCHAR(100),
      zip_code VARCHAR(20),
      country VARCHAR(100),
      profile_image VARCHAR(1000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating profile table:", err);
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
    console.error("Error creating user_popup_responses table:", err);
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
      biometric_type VARCHAR(50) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE KEY unique_credential_id (credential_id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating webauthn_credentials table:", err);
    throw err;
  }
};

const createUserContactsTable = async (userId) => {
  const tableName = `contacts_user_${userId}`;
  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255) DEFAULT '',
      last_name VARCHAR(255) DEFAULT '',
      company VARCHAR(1000) DEFAULT '',
      job_type VARCHAR(1000) DEFAULT '',
      website VARCHAR(1000) DEFAULT '',
      category VARCHAR(255) DEFAULT '',
      relation VARCHAR(255) DEFAULT '',
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      phone_number3 VARCHAR(20) DEFAULT '',
      email VARCHAR(255) DEFAULT NULL,
      flat_building_no VARCHAR(1000) DEFAULT '',
      street TEXT DEFAULT NULL,
      country VARCHAR(100) DEFAULT '',
      state VARCHAR(100) DEFAULT '',
      city VARCHAR(100) DEFAULT '',
      postal_code VARCHAR(20) DEFAULT '',
      date_of_birth VARCHAR(10) DEFAULT '',
      anniversary VARCHAR(10) DEFAULT '',
      notes TEXT DEFAULT NULL,
      contact_image VARCHAR(1000) DEFAULT '',
      release_on_pass BOOLEAN DEFAULT FALSE,
      is_ambassador BOOLEAN DEFAULT FALSE,
      is_nominee BOOLEAN DEFAULT FALSE,
      share_on VARCHAR(255) DEFAULT '',
      share_by_whatsapp BOOLEAN DEFAULT FALSE,
      share_by_sms BOOLEAN DEFAULT FALSE,
      share_by_email BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_phone (phone_number, phone_number1, phone_number2, phone_number3),
      INDEX idx_name (first_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error(`Error creating contacts table for user ${userId}:`, err);
    throw err;
  }
};

const alterUserContactsTable = async (userId) => {
  const tableName = `contacts_user_${userId}`;
  const query = `
    ALTER TABLE ${tableName}
    ADD COLUMN IF NOT EXISTS share_on VARCHAR(255) DEFAULT '',
    ADD COLUMN IF NOT EXISTS share_by_whatsapp BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS share_by_sms BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS share_by_email BOOLEAN DEFAULT FALSE
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error(`Error altering contacts table for user ${userId}:`, err);
    throw err;
  }
};

const createUploadedFilesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      contact_id INT NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      file_name VARCHAR(1000) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating uploaded_files table:", err);
    throw err;
  }
};

const createImportantDatesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS important_dates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      occasion_type VARCHAR(255) NOT NULL,
      occasion_date VARCHAR(10) NOT NULL,
      get_reminded VARCHAR(10) DEFAULT 'Yes',
      contact_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20),
      phone_number1 VARCHAR(20),
      phone_number2 VARCHAR(20),
      phone_number3 VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating important_dates table:", err);
    throw err;
  }
};

const createNomineesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS nominees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      relationship VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      nominee_type ENUM('Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary', '') NOT NULL DEFAULT '',
      profile_image VARCHAR(1000),
      nominee_accept BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
    console.log("Nominees table created or already exists.");
  } catch (err) {
    console.error("Error creating nominees table:", err);
    throw err;
  }
};

const createAmbassadorsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ambassadors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255),
      last_name VARCHAR(255),
      category VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      relationship VARCHAR(255) NOT NULL,
      ambassador_type ENUM('Primary', 'Secondary', '') NOT NULL DEFAULT '',
      profile_image VARCHAR(1000),
      ambassador_accept BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error("Error creating ambassadors table:", err);
    throw err;
  }
};

const createFamilyInfoTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS familyinfo (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255) DEFAULT '',
      last_name VARCHAR(255) DEFAULT '',
      nickname VARCHAR(255) DEFAULT '',
      email VARCHAR(255) DEFAULT NULL,
      phone_number VARCHAR(20) NOT NULL,
      phone_number1 VARCHAR(20) DEFAULT '',
      phone_number2 VARCHAR(20) DEFAULT '',
      phone_number3 VARCHAR(20) DEFAULT '',
      flat_building_no VARCHAR(1000) DEFAULT '',
      street TEXT DEFAULT NULL,
      country VARCHAR(255) DEFAULT '',
      state VARCHAR(255) DEFAULT '',
      city VARCHAR(255) DEFAULT '',
      zipcode VARCHAR(20) DEFAULT '',
      profile_image VARCHAR(255) DEFAULT '',
      birthday DATE DEFAULT NULL,
      relation VARCHAR(255) DEFAULT '', -- Added relation field
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  try {
    await pool.query(query);
    console.log("FamilyInfo table created or already exists.");
  } catch (err) {
    console.error("Error creating familyinfo table:", err);
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

const initializeDatabase = async () => {
  try {
    await createUsersTable();
    await createDevicesTable();
    await createProfileTable();
    await createUserPopupResponsesTable();
    await createWebAuthnCredentialsTable();
    await createUploadedFilesTable();
    await createImportantDatesTable();
    await createNomineesTable();
    await createAmbassadorsTable();
    await createFamilyInfoTable();
    
    // Alter existing user contacts tables
    const [users] = await pool.query("SELECT id FROM users");
    for (const user of users) {
      const tableName = `contacts_user_${user.id}`;
      const tableExists = await checkTableExists(tableName);
      if (tableExists) {
        await alterUserContactsTable(user.id);
      }
    }
  } catch (err) {
    console.error("Error setting up database:", err);
    throw err;
  }
};

module.exports = {
  initializeDatabase,
  checkTableExists,
  createUserContactsTable,
  alterUserContactsTable,
  createUploadedFilesTable,
  createImportantDatesTable,
  createNomineesTable,
  createAmbassadorsTable,
  createFamilyInfoTable,
};