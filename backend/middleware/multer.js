const fsSync = require("fs");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const sanitize = require("sanitize-filename");

// Storage for main upload (contact images and additional files)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.session.userId;
    let uploadPath;

    if (!userId) {
      return cb(new Error("User ID is required for file uploads"));
    }

    if (file.fieldname === "profileImage") {
      uploadPath = path.join("images", `${userId}`); // Store in images/user_id/
    } else if (file.fieldname === "additionalFiles") {
      uploadPath = path.join("images", `${userId}`, "sendfile"); // Store in images/user_id/sendfile/
    } else if (
      [
        "driver_license_document",
        "aadhaar_card_document",
        "birth_certificate",
        "pan_card_document",
        "passport_document",
        "voter_id_document",
        "other_document",
      ].includes(file.fieldname)
    ) {
      uploadPath = path.join("images", file.fieldname); // You can adjust path per field if needed
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
    const destination = file.fieldname === "profileImage"
      ? path.join("images", `${req.session.userId}`)
      : path.join("images", `${req.session.userId}`, "sendfile");

    // Check for existing files and append counter if necessary
    while (true) {
      try {
        await fs.access(path.join(destination, finalName));
        // File exists, increment counter
        counter++;
        finalName = `${basename}${counter}${ext}`;
      } catch (err) {
        // File does not exist, use this name
        break;
      }
    }

    cb(null, finalName);
  },
});

// Storage for profile images (images/user_id.file)
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "../images"); // Store in images/
    fsSync.mkdirSync(uploadPath, { recursive: true }); // Use fsSync.mkdirSync
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = sanitize(file.originalname); // Sanitize original filename
    const ext = path.extname(sanitizedFilename);
    const basename = path.basename(sanitizedFilename, ext);
    let finalName = sanitizedFilename;
    let counter = 0;
    const destination = path.join(__dirname, "../images");

    // Check for existing files and append counter if necessary
    while (fsSync.existsSync(path.join(destination, finalName))) {
      counter++;
      finalName = `${basename}${counter}${ext}`;
    }

    cb(null, finalName); // Save as images/sanitizedFilename (e.g., images/profile.jpg)
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

// Main upload for contact images (images/user_id/file) and additional files (images/user_id/sendfile/file)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "additionalFiles", maxCount: 15 },
  { name: "driver_license_document", maxCount: 1 },
  { name: "birth_certificate", maxCount: 1 },
]);

// Profile image upload for images/user_id.file
const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("profileImage");

module.exports = { upload, profileImageUpload };