const { pool } = require("../config/database");

const createUserIdsDocumentsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS user_ids_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      document_type VARCHAR(255) NOT NULL,
      document_number VARCHAR(255) NOT NULL,
      state_issued VARCHAR(255) DEFAULT NULL,
      country_issued VARCHAR(255) DEFAULT NULL,
      expiration_date DATE DEFAULT NULL,
      location VARCHAR(1000) DEFAULT NULL,
      file_path VARCHAR(1000) DEFAULT NULL,
      file_name VARCHAR(500) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;
    try {
        await pool.query(query);
        console.log("user_ids_documents table created successfully.");
    } catch (err) {
        console.error("Error creating user_ids_documents table:", err);
        throw err;
    }
};

const createUserEmploymentDocumentsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS user_employment_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(100) NOT NULL,
      organisation VARCHAR(255),
      joining_date DATE,
      leaving_date DATE,
      supervisor_contact VARCHAR(255),
      nominee_contact VARCHAR(255),
      employment_type VARCHAR(100),
      job_title VARCHAR(255),
      employment_id VARCHAR(255),
      benefits_type VARCHAR(100),
      benefits_details VARCHAR(1000),
      other_status VARCHAR(255),
      file_path VARCHAR(1000),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;
    try {
        await pool.query(query);
        console.log("user_employment_documents table created successfully.");
    } catch (err) {
        console.error("Error creating user_employment_documents table:", err);
        throw err;
    }
};

const createUserReligionDocumentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_religion_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      religion VARCHAR(100) NOT NULL,
      religion_other VARCHAR(100),
      nominee_contact VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_religion_documents table created.");
  } catch (err) {
    console.error("Failed to create user_religion_documents table:", err);
  }
};

const createUserCharityTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_charity_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        charity_name VARCHAR(255) NOT NULL,
        charity_website VARCHAR(255),
        payment_method VARCHAR(100),
        amount DECIMAL(10,2),
        frequency VARCHAR(50),
        enrolled BOOLEAN,
        nominee_contact VARCHAR(255),
        file_paths TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_charity_documents table created.");
  } catch (err) {
    console.error("Failed to create user_charity_documents table:", err);
  }
};

const createUserClubTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_club_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        club VARCHAR(255) NOT NULL,
        club_name VARCHAR(255),
        club_contact VARCHAR(255),
        membership_type VARCHAR(100),
        membership_status BOOLEAN,
        nominee_contact VARCHAR(255),
        file_paths TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_club_documents table created.");
  } catch (err) {
    console.error("Failed to create user_club_documents table:", err);
  }
};

const createUserDegreeTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_degrees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        university_name VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        degree_field VARCHAR(255),
        degree_type VARCHAR(100),
        degree_start DATE,
        degree_end DATE,
        grade VARCHAR(50),
        completion_status BOOLEAN,
        nominee_contact VARCHAR(255),
        activities TEXT,
        file_paths TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_degrees table created.");
  } catch (err) {
    console.error("Failed to create user_degrees table:", err);
  }
};

const createUserMilitaryTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_military_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        university_name VARCHAR(255) NOT NULL,
        degree VARCHAR(255) NOT NULL,
        degree_field VARCHAR(255),
        degree_type VARCHAR(100),
        degree_start DATE,
        degree_end DATE,
        grade VARCHAR(50),
        completion_status BOOLEAN,
        nominee_contact VARCHAR(255),
        activities TEXT,
        file_paths TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_military_documents table created.");
  } catch (err) {
    console.error("Failed to create user_military_documents table:", err);
  }
};
const createUserMiscellaneousTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_miscellaneous_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        status BOOLEAN,
        nominee_contact VARCHAR(255),
        file_paths TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(query);
    console.log("user_miscellaneous_documents table created.");
  } catch (err) {
    console.error("Failed to create user_miscellaneous_documents table:", err);
  }
};

module.exports = {
    createUserIdsDocumentsTable,
    createUserEmploymentDocumentsTable,
    createUserReligionDocumentsTable,
    createUserCharityTable,
    createUserClubTable,
    createUserDegreeTable,
    createUserMilitaryTable,
    createUserMiscellaneousTable,
};