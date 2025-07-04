const dotenv = require("dotenv");
dotenv.config({ path: '/var/www/backend/.env' });

const express = require("express");
const cors = require("cors");
const path = require("path");
const { configureSession } = require("./config/session");
const { initializeDatabase } = require("./database/schema");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const biometricRoutes = require("./routes/biometric");
const contactsRoutes = require("./routes/contacts");
const ambassadorsRoutes = require("./routes/ambassadors");
const nomineesRoutes = require("./routes/nominees");
const familyInfoRoutes = require("./routes/familyinfo");
const petRoutes = require("./routes/pets");

initializeDatabase().then(() => {
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(configureSession());

  // Static file serving
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/images", express.static(path.join(__dirname, "images")));

  // Routes
  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", biometricRoutes);
  app.use("/api/contacts", contactsRoutes);
  app.use("/api/ambassadors", ambassadorsRoutes);
  app.use("/api", nomineesRoutes);
  app.use("/api/familyinfo", familyInfoRoutes);
  app.use("/api", petRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});