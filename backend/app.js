const express = require("express");
const cors = require("cors");
const path = require("path");
const { configureSession } = require("./config/session");
const { initializeDatabase } = require("./database/schema");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const biometricRoutes = require("./routes/biometric");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize database
initializeDatabase().then(() => {
  // Initialize Express app
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(configureSession());
  app.use("/images", express.static(path.join(__dirname, "images")));
  app.use("/photos", express.static(path.join(__dirname, "photos")));

  // Routes
  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", biometricRoutes);

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});