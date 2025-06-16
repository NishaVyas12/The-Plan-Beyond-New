const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "admin@theplanbeyond.com",
    pass: process.env.EMAIL_PASS || "hrsl ajhz gzng uzxv",
  },
});

module.exports = { transporter };