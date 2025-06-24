const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const sanitize = require("sanitize-filename");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.session.userId;
    let uploadPath;

    if (!userId) {
      return cb(new Error("User ID is required for file uploads"));
    }

    if (file.fieldname === "profileImage") {
      uploadPath = path.join("uploads", `contact_image-${userId}`);
    } else if (file.fieldname === "additionalFiles") {
      const contactId = req.body.contactId || (req.body.contacts ? JSON.parse(req.body.contacts)?.id : null);
      if (contactId) {
        uploadPath = path.join("uploads", "send_file", `${userId}`, `${contactId}`);
      } else {
        uploadPath = path.join("uploads", "temp", `${userId}`);
      }
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
      ? path.join("uploads", `contact_image-${req.session.userId}`)
      : path.join("uploads", "send_file", `${req.session.userId}`, req.body.contactId || (req.body.contacts ? JSON.parse(req.body.contacts)?.id : "temp"));

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "additionalFiles", maxCount: 15 },
]);

module.exports = upload;