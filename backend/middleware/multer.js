const fsSync = require("fs");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const sanitize = require("sanitize-filename");

// Storage for main upload (contact images and documents)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.session.userId;
    const familyId = req.body.family_id || req.params.id; // Use family_id from body or params
    let uploadPath;

    if (!userId) {
      return cb(new Error("User ID is required for file uploads"));
    }

    if (file.fieldname === "profileImage") {
      uploadPath = path.join("images", `${userId}`); // Store profile images in images/user_id/
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
      uploadPath = path.join("images", `${userId}`, "family", `${familyId}`); // Store documents in images/user_id/family/family_id/
    } else if (file.fieldname === "additionalFiles") {
      uploadPath = path.join("images", `${userId}`, "sendfile"); // Store additional files in images/user_id/sendfile/
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
    const destination =
      file.fieldname === "profileImage"
        ? path.join("images", `${userId}`)
        : file.fieldname === "additionalFiles"
        ? path.join("images", `${userId}`, "sendfile")
        : path.join("images", `${userId}`, "family", `${familyId}`);

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
  { name: "additionalFiles", maxCount: 15 },
  { name: "driver_license_document", maxCount: 1 },
  { name: "birth_certificate_document", maxCount: 1 },
  { name: "pan_card_document", maxCount: 1 },
  { name: "passport_document", maxCount: 1 },
  { name: "aadhaar_card_document", maxCount: 1 },
  { name: "other_file", maxCount: 1 },
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