const fsSync = require("fs");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const sanitize = require("sanitize-filename");

// Storage for main upload (contact images, pet images, documents, and personal IDs)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.session.userId;
    const familyId = req.body.family_id || req.params.id;
    const petId = req.body.pet_id || req.params.id;
    let uploadPath;

    if (!userId) {
      return cb(new Error("User ID is required for file uploads"));
    }

    if (file.fieldname === "profileImage") {
      if (req.path.includes("/pets")) {
        if (!petId && req.method === "POST") {
          uploadPath = path.join("images", `${userId}`, "pet", "temp");
        } else if (petId) {
          uploadPath = path.join("images", `${userId}`, "pet", `${petId}`);
        } else {
          return cb(new Error("Pet ID is required for pet profile image uploads"));
        }
      } else {
        uploadPath = path.join("images", `${userId}`);
      }
    } else if (["insurance_document", "tag_document", "vet_document"].includes(file.fieldname)) {
      if (!petId) {
        return cb(new Error("Pet ID is required for document uploads"));
      }
      uploadPath = path.join("images", `${userId}`, "pet", `${petId}`, "file");
    } else if (
      [
        "driver_license_document",
        "aadhaar_card_document",
        "birth_certificate_document",
        "pan_card_document",
        "passport_document",
        "other_file",
      ].includes(file.fieldname)
    ) {
      if (!familyId) {
        return cb(new Error("Family ID is required for document uploads"));
      }
      uploadPath = path.join("images", `${userId}`, "family", `${familyId}`);
    } else if (file.fieldname === "new_folder_documents") {
      uploadPath = path.join("images", `${userId}`, "family", `${familyId || "temp"}`, "folders");
    } else if ([
      "personalIdFiles",
      "employmentFiles",
      "charityFiles",
      "clubFiles",
      "degreeFiles",
      "militaryFiles",
      "miscellaneousFiles",
    ].includes(file.fieldname)) {
      uploadPath = path.join("images", `${userId}`, "documents", "personalid");
    } else if (file.fieldname === "additionalFiles") {
      uploadPath = path.join("images", `${userId}`, "sendfile");
    } else {
      return cb(new Error("Invalid file field name"));
    }

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: async (req, file, cb) => {
    const sanitizedFilename = sanitize(file.originalname);
    const ext = path.extname(sanitizedFilename);
    const basename = path.basename(sanitizedFilename, ext);
    let finalName = sanitizedFilename;
    let counter = 0;
    const userId = req.session.userId;
    const familyId = req.body.family_id || req.params.id;
    const petId = req.body.pet_id || req.params.id;
    let destination;

    if (file.fieldname === "profileImage") {
      if (req.path.includes("/pets")) {
        destination = petId
          ? path.join("images", `${userId}`, "pet", `${petId}`)
          : path.join("images", `${userId}`, "pet", "temp");
      } else {
        destination = path.join("images", `${userId}`);
      }
    } else if (["insurance_document", "tag_document", "vet_document"].includes(file.fieldname)) {
      destination = path.join("images", `${userId}`, "pet", `${petId}`, "file");
    } else if (file.fieldname === "new_folder_documents") {
      destination = path.join("images", `${userId}`, "family", `${familyId || "temp"}`, "folders");
    } else if (file.fieldname === "additionalFiles") {
      destination = path.join("images", `${userId}`, "sendfile");
    } else if ([
      "personalIdFiles",
      "employmentFiles",
      "charityFiles",
      "clubFiles",
      "degreeFiles",
      "militaryFiles",
      "miscellaneousFiles",
    ].includes(file.fieldname)) {
      destination = path.join("images", `${userId}`, "documents", "personalid");
    } else {
      destination = path.join("images", `${userId}`, "family", `${familyId}`);
    }

    while (true) {
      try {
        await fs.access(path.join(destination, finalName));
        counter++;
        finalName = `${basename}${counter}${ext}`;
      } catch (err) {
        break;
      }
    }

    cb(null, finalName);
  },
});

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "../images");
    fsSync.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = sanitize(file.originalname);
    const ext = path.extname(sanitizedFilename);
    const basename = path.basename(sanitizedFilename, ext);
    let finalName = sanitizedFilename;
    let counter = 0;
    const destination = path.join(__dirname, "../images");

    while (fsSync.existsSync(path.join(destination, finalName))) {
      counter++;
      finalName = `${basename}${counter}${ext}`;
    }

    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/vcard",
    "application/octet-stream",
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith(".vcf")) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, and VCF files are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "insurance_document", maxCount: 1 },
  { name: "tag_document", maxCount: 1 },
  { name: "vet_document", maxCount: 1 },
  { name: "additionalFiles", maxCount: 15 },
  { name: "driver_license_document", maxCount: 1 },
  { name: "birth_certificate_document", maxCount: 1 },
  { name: "pan_card_document", maxCount: 1 },
  { name: "passport_document", maxCount: 1 },
  { name: "aadhaar_card_document", maxCount: 1 },
  { name: "other_file", maxCount: 1 },
  { name: "personalIdFiles", maxCount: 15 },
  { name: "employmentFiles", maxCount: 15 },
  { name: "charityFiles", maxCount: 15 },
  { name: "clubFiles", maxCount: 15 },
  { name: "degreeFiles", maxCount: 15 },
  { name: "militaryFiles", maxCount: 15 },
  { name: "miscellaneousFiles", maxCount: 15 },
  { name: "new_folder_documents", maxCount: 15 },
]);

const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("profileImage");

module.exports = { upload, profileImageUpload };