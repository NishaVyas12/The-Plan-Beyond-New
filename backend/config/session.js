const session = require("express-session");

const configureSession = () => {
  return session({
    secret: process.env.SESSION_SECRET || "4abb9ebc8ad8a34bc118ef1856571ea209a6d90c00052f2a1353a6b4f6707065",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  });
};

module.exports = { configureSession };