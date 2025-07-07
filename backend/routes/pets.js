const express = require("express");
const { pool } = require("../config/database");
const { checkAuth } = require("../middleware/auth");
const { upload } = require("../middleware/multer");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

router.post("/pets", checkAuth, upload, async (req, res) => {
  const userId = req.session.userId;
  const {
    name,
    type,
    breed,
    birthday,
    insurance_provider,
    policy_number,
    policy_holder,
    company_name,
    agent_contact,
    nominee_name,
    insurance_issued,
    insurance_expiration,
    notes,
    tag_number,
    tag_type,
    vet_clinic_name,
    vet_contact_info,
    vaccine_date,
  } = req.body;
  let photo = null;
  let insurance_document = null;
  let tag_document = null;
  let vet_document = null;

  if (!name) {
    return res.status(400).json({ success: false, message: "Pet name is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO pets (
        user_id, name, type, breed, birthday, photo,
        insurance_document, insurance_provider, policy_number, policy_holder,
        company_name, agent_contact, nominee_name, insurance_issued,
        insurance_expiration, notes, tag_document, tag_number, tag_type,
        vet_document, vet_clinic_name, vet_contact_info, vaccine_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        type || null,
        breed || null,
        birthday || null,
        null,
        null,
        insurance_provider || null,
        policy_number || null,
        policy_holder || null,
        company_name || null,
        agent_contact || null,
        nominee_name || null,
        insurance_issued || null,
        insurance_expiration || null,
        notes || null,
        null,
        tag_number || null,
        tag_type || null,
        null,
        vet_clinic_name || null,
        vet_contact_info || null,
        vaccine_date || null,
      ]
    );
    const petId = result.insertId;

    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      photo = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      await connection.query(`UPDATE pets SET photo = ? WHERE id = ? AND user_id = ?`, [
        photo,
        petId,
        userId,
      ]);
    }

    if (req.files && req.files.insurance_document) {
      const file = req.files.insurance_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      insurance_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      await connection.query(`UPDATE pets SET insurance_document = ? WHERE id = ? AND user_id = ?`, [
        insurance_document,
        petId,
        userId,
      ]);
    }

    if (req.files && req.files.tag_document) {
      const file = req.files.tag_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      tag_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      await connection.query(`UPDATE pets SET tag_document = ? WHERE id = ? AND user_id = ?`, [
        tag_document,
        petId,
        userId,
      ]);
    }

    if (req.files && req.files.vet_document) {
      const file = req.files.vet_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      vet_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      await connection.query(`UPDATE pets SET vet_document = ? WHERE id = ? AND user_id = ?`, [
        vet_document,
        petId,
        userId,
      ]);
    }

    await connection.commit();
    res.json({ success: true, message: "Pet added successfully.", petId });
  } catch (err) {
    await connection.rollback();
    if (req.files) {
      for (const field of ["profileImage", "insurance_document", "tag_document", "vet_document"]) {
        if (req.files[field]) {
          try {
            await fs.unlink(req.files[field][0].path);
            console.log(`Deleted temporary file: ${req.files[field][0].path}`);
          } catch (unlinkErr) {
            console.warn(`Failed to delete temporary file ${req.files[field][0].path}: ${unlinkErr.message}`);
          }
        }
      }
    }
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  } finally {
    connection.release();
  }
});

router.get("/pets/:id", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  const petId = req.params.id;

  try {
    const [pet] = await pool.query(
      `SELECT id, user_id, name, type, breed, birthday, photo,
              insurance_document, insurance_provider, policy_number, policy_holder,
              company_name, agent_contact, nominee_name, insurance_issued,
              insurance_expiration, notes, tag_document, tag_number, tag_type,
              vet_document, vet_clinic_name, vet_contact_info, vaccine_date, created_at
       FROM pets WHERE id = ? AND user_id = ?`,
      [petId, userId]
    );

    if (pet.length === 0) {
      return res.status(404).json({ success: false, message: "Pet not found." });
    }

    res.json({ success: true, pet: pet[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
});

router.get("/pets", checkAuth, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [pets] = await pool.query(
      `SELECT id, user_id, name, type, breed, birthday, photo,
              insurance_document, insurance_provider, policy_number, policy_holder,
              company_name, agent_contact, nominee_name, insurance_issued,
              insurance_expiration, notes, tag_document, tag_number, tag_type,
              vet_document, vet_clinic_name, vet_contact_info, vaccine_date, created_at
       FROM pets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
});

router.put("/pets/:id", checkAuth, upload, async (req, res) => {
  const userId = req.session.userId;
  const petId = req.params.id;
  const formData = req.body;
  let photo = null;
  let insurance_document = null;
  let tag_document = null;
  let vet_document = null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT id, name, type, breed, birthday, photo, insurance_document,
              insurance_provider, policy_number, policy_holder, company_name,
              agent_contact, nominee_name, insurance_issued, insurance_expiration,
              notes, tag_document, tag_number, tag_type,
              vet_document, vet_clinic_name, vet_contact_info, vaccine_date
       FROM pets WHERE id = ? AND user_id = ?`,
      [petId, userId]
    );
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Pet not found." });
    }

    const existingPet = existing[0];

    // Ensure name is provided
    if (!formData.name && !existingPet.name) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Pet name is required." });
    }

    // Handle photo upload
    if (req.files && req.files.profileImage) {
      const file = req.files.profileImage[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      photo = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      if (existingPet.photo) {
        const oldPhotoPath = path.join(__dirname, "..", existingPet.photo.replace(/^\//, ""));
        try {
          await fs.access(oldPhotoPath);
          await fs.unlink(oldPhotoPath);
          console.log(`Deleted old photo: ${oldPhotoPath}`);
        } catch (err) {
          console.warn(`Failed to delete old photo ${oldPhotoPath}: ${err.message}`);
        }
      }
    }

    // Handle insurance document upload or deletion
    if (req.files && req.files.insurance_document) {
      const file = req.files.insurance_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      insurance_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      if (existingPet.insurance_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.insurance_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted old insurance document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete old insurance document ${oldFilePath}: ${err.message}`);
        }
      }
    } else if (formData.insurance_document === "") {
      insurance_document = null;
      if (existingPet.insurance_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.insurance_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted insurance document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete insurance document ${oldFilePath}: ${err.message}`);
        }
      }
    }

    // Handle tag document upload or deletion
    if (req.files && req.files.tag_document) {
      const file = req.files.tag_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      tag_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      if (existingPet.tag_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.tag_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted old tag document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete old tag document ${oldFilePath}: ${err.message}`);
        }
      }
    } else if (formData.tag_document === "") {
      tag_document = null;
      if (existingPet.tag_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.tag_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted tag document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete tag document ${oldFilePath}: ${err.message}`);
        }
      }
    }

    // Handle vet document upload or deletion
    if (req.files && req.files.vet_document) {
      const file = req.files.vet_document[0];
      const tempPath = file.path;
      const finalPath = path.join(__dirname, "../images", `${userId}`, "pet", `${petId}`, "file", file.filename);
      const finalDir = path.dirname(finalPath);

      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(tempPath, finalPath);
      vet_document = `/${path.relative(path.join(__dirname, ".."), finalPath).replace(/\\/g, "/")}`;

      if (existingPet.vet_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.vet_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted old vet document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete old vet document ${oldFilePath}: ${err.message}`);
        }
      }
    } else if (formData.vet_document === "") {
      vet_document = null;
      if (existingPet.vet_document) {
        const oldFilePath = path.join(__dirname, "..", existingPet.vet_document.replace(/^\//, ""));
        try {
          await fs.access(oldFilePath);
          await fs.unlink(oldFilePath);
          console.log(`Deleted vet document: ${oldFilePath}`);
        } catch (err) {
          console.warn(`Failed to delete vet document ${oldFilePath}: ${err.message}`);
        }
      }
    }

    // Construct update fields
    const updateFields = {
      name: formData.name !== undefined ? formData.name : existingPet.name,
      type: formData.type !== undefined ? formData.type || null : existingPet.type,
      breed: formData.breed !== undefined ? formData.breed || null : existingPet.breed,
      birthday: formData.birthday !== undefined ? formData.birthday || null : existingPet.birthday,
      photo: photo !== null ? photo : existingPet.photo,
      insurance_document: formData.insurance_document === "" ? null : (insurance_document !== null ? insurance_document : existingPet.insurance_document),
      insurance_provider: formData.insurance_provider !== undefined ? formData.insurance_provider || null : existingPet.insurance_provider,
      policy_number: formData.policy_number !== undefined ? formData.policy_number || null : existingPet.policy_number,
      policy_holder: formData.policy_holder !== undefined ? formData.policy_holder || null : existingPet.policy_holder,
      company_name: formData.company_name !== undefined ? formData.company_name || null : existingPet.company_name,
      agent_contact: formData.agent_contact !== undefined ? formData.agent_contact || null : existingPet.agent_contact,
      nominee_name: formData.nominee_name !== undefined ? formData.nominee_name || null : existingPet.nominee_name,
      insurance_issued: formData.insurance_issued !== undefined ? formData.insurance_issued || null : existingPet.insurance_issued,
      insurance_expiration: formData.insurance_expiration !== undefined ? formData.insurance_expiration || null : existingPet.insurance_expiration,
      notes: formData.notes !== undefined ? formData.notes || null : existingPet.notes,
      tag_document: formData.tag_document === "" ? null : (tag_document !== null ? tag_document : existingPet.tag_document),
      tag_number: formData.tag_number !== undefined ? formData.tag_number || null : existingPet.tag_number,
      tag_type: formData.tag_type !== undefined ? formData.tag_type || null : existingPet.tag_type,
      vet_document: formData.vet_document === "" ? null : (vet_document !== null ? vet_document : existingPet.vet_document),
      vet_clinic_name: formData.vet_clinic_name !== undefined ? formData.vet_clinic_name || null : existingPet.vet_clinic_name,
      vet_contact_info: formData.vet_contact_info !== undefined ? formData.vet_contact_info || null : existingPet.vet_contact_info,
      vaccine_date: formData.vaccine_date !== undefined ? formData.vaccine_date || null : existingPet.vaccine_date,
    };

    console.log(`Updating pet ${petId} with fields:`, updateFields);

    await connection.query(
      `UPDATE pets SET
        name = ?, type = ?, breed = ?, birthday = ?,
        photo = ?, insurance_document = ?,
        insurance_provider = ?, policy_number = ?, policy_holder = ?,
        company_name = ?, agent_contact = ?, nominee_name = ?,
        insurance_issued = ?, insurance_expiration = ?, notes = ?,
        tag_document = ?, tag_number = ?, tag_type = ?,
        vet_document = ?, vet_clinic_name = ?, vet_contact_info = ?, vaccine_date = ?
       WHERE id = ? AND user_id = ?`,
      [
        updateFields.name,
        updateFields.type,
        updateFields.breed,
        updateFields.birthday,
        updateFields.photo,
        updateFields.insurance_document,
        updateFields.insurance_provider,
        updateFields.policy_number,
        updateFields.policy_holder,
        updateFields.company_name,
        updateFields.agent_contact,
        updateFields.nominee_name,
        updateFields.insurance_issued,
        updateFields.insurance_expiration,
        updateFields.notes,
        updateFields.tag_document,
        updateFields.tag_number,
        updateFields.tag_type,
        updateFields.vet_document,
        updateFields.vet_clinic_name,
        updateFields.vet_contact_info,
        updateFields.vaccine_date,
        petId,
        userId,
      ]
    );

    await connection.commit();
    console.log(`Pet ${petId} updated successfully`);
    res.json({ success: true, message: "Pet updated successfully.", pet: updateFields });
  } catch (err) {
    await connection.rollback();
    if (req.files) {
      for (const field of ["profileImage", "insurance_document", "tag_document", "vet_document"]) {
        if (req.files[field]) {
          try {
            await fs.unlink(req.files[field][0].path);
            console.log(`Deleted temporary file: ${req.files[field][0].path}`);
          } catch (unlinkErr) {
            console.warn(`Failed to delete temporary file ${req.files[field][0].path}: ${unlinkErr.message}`);
          }
        }
      }
    }
    console.error(`Error updating pet ${petId}:`, err.message);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  } finally {
    connection.release();
  }
});

router.delete("/pets/:id", checkAuth, async (req, res) => {
  const userId = req.session.userId;
  const petId = req.params.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT id, photo, insurance_document, tag_document, vet_document
       FROM pets WHERE id = ? AND user_id = ?`,
      [petId, userId]
    );
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Pet not found." });
    }

    const existingPet = existing[0];

    // Delete associated files
    for (const field of ["photo", "insurance_document", "tag_document", "vet_document"]) {
      if (existingPet[field]) {
        const filePath = path.join(__dirname, "..", existingPet[field].replace(/^\//, ""));
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`Deleted ${field}: ${filePath}`);
        } catch (err) {
          console.warn(`Failed to delete ${field} ${filePath}: ${err.message}`);
        }
      }
    }

    await connection.query("DELETE FROM pets WHERE id = ? AND user_id = ?", [petId, userId]);
    await connection.commit();
    console.log(`Pet ${petId} deleted successfully`);
    res.json({ success: true, message: "Pet deleted successfully." });
  } catch (err) {
    await connection.rollback();
    console.error(`Error deleting pet ${petId}:`, err.message);
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;