const rateLimit = require("express-rate-limit");

const passwordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password-related attempts, please try again later.",
  },
});

module.exports = { passwordRateLimiter };