const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "../images", userId.toString());
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session.userId;
    if (!userId) {
      return cb(new Error("Session timed out, login again."));
    }
    const uploadPath = path.join(__dirname, "../photos", userId.toString());
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

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

module.exports = { upload, imageUpload };