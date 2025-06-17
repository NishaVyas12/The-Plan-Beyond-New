const express = require("express");
const { pool } = require("../config/database");
const { transporter } = require("../config/email");
const { passwordRateLimiter } = require("../middleware/rateLimiter");
const { hashPassword, validatePassword } = require("../utils/password");
const { generateOtp } = require("../utils/otp");
const bcrypt = require("bcrypt");

const router = express.Router();

// Helper function to check device
async function getDeviceInfo(userId, deviceId) {
    const [devices] = await pool.query(
        "SELECT is_trusted, device_name FROM devices WHERE user_id = ? AND device_id = ?",
        [userId, deviceId]
    );
    return devices[0];
}

// Helper function to add or update device
async function upsertDevice(userId, deviceId, deviceName, isTrusted = false) {
    await pool.query(
        `INSERT INTO devices (user_id, device_id, device_name, is_trusted, last_login)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
     device_name = ?, is_trusted = ?, last_login = NOW()`,
        [userId, deviceId, deviceName, isTrusted, deviceName, isTrusted]
    );
}

router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [existingUsers] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (existingUsers.length > 0) {
            return res
                .status(400)
                .json({ success: false, message: "Email already registered." });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be 8-100 characters long, contain uppercase and lowercase letters, at least one digit, one symbol, and no spaces.",
            });
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOtp();

        const [result] = await pool.query(
            "INSERT INTO users (email, password, otp, is_verified) VALUES (?, ?, ?, ?)",
            [email, hashedPassword, otp, false]
        );

        const userId = result.insertId;
        req.session.userId = userId;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Unlock Your The Plan Beyond Journey!",
            text: `Dear User,

Welcome to ThePlanBeyond — where your digital legacy is protected with care and simplicity.

To complete your registration, please use the following One-Time Password (OTP):

Your OTP: ${otp}

This OTP is valid for the next 10 minutes, ensuring your account remains secure. Enter it on the verification page to activate your account and start managing your plan with ease.

Thank you for choosing ThePlanBeyond to safeguard what matters most.

Warm regards,
ThePlanBeyond Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "OTP sent to your email.", userId });
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-otp", async (req, res) => {
    const { email, otp, isPasswordReset } = req.body;

    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
            email,
        ]);
        if (users.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "User not found." });
        }

        const user = users[0];
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP." });
        }

        if (!isPasswordReset) {
            await pool.query(
                "UPDATE users SET is_verified = ?, otp = NULL WHERE email = ?",
                [true, email]
            );
            req.session.userId = user.id;
        }

        res.json({
            success: true,
            message: "OTP verified successfully.",
            userId: isPasswordReset ? null : user.id,
        });
    } catch (err) {
        console.error("Error verifying OTP:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/forgot-password", passwordRateLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required.",
        });
    }

    try {
        const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [
            email,
        ]);
        if (users.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "User not found." });
        }

        const otp = generateOtp();
        await pool.query("UPDATE users SET otp = ? WHERE email = ?", [otp, email]);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Password Reset OTP for ThePlanBeyond",
            text: `Dear User,

Welcome back to ThePlanBeyond — where your digital legacy is safeguarded with care and simplicity.

To reset your password, please use the following One-Time Password (OTP):

Your OTP: ${otp}

This OTP is valid for the next 10 minutes, ensuring your account remains secure. Enter it on the password reset page to regain access and continue managing your plan with ease.

Thank you for trusting ThePlanBeyond to protect what matters most.

Warm regards,
ThePlanBeyond Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "OTP sent to your email." });
    } catch (err) {
        console.error("Error sending forgot password OTP:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/reset-password", passwordRateLimiter, async (req, res) => {
    const { email, otp, newPassword, confirmNewPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
            success: false,
            message: "Email, OTP, new password, and confirmation are required.",
        });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match.",
        });
    }

    if (!validatePassword(newPassword)) {
        return res.status(400).json({
            success: false,
            message:
                "Password must be 8-100 characters long, contain uppercase and lowercase letters, at least one digit, one symbol, and no spaces.",
        });
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [users] = await connection.query(
                "SELECT id, otp, password FROM users WHERE email = ?",
                [email]
            );

            if (users.length === 0) {
                await connection.rollback();
                connection.release();
                return res
                    .status(404)
                    .json({ success: false, message: "User not found." });
            }

            const user = users[0];
            if (user.otp !== otp) {
                await connection.rollback();
                connection.release();
                return res
                    .status(400)
                    .json({ success: false, message: "Invalid or expired OTP." });
            }
            const isSamePassword = await bcrypt.compare(newPassword, user.password);
            if (isSamePassword) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                    success: false,
                    message: "New password must be different from current password.",
                });
            }

            const hashedPassword = await hashPassword(newPassword);
            await connection.query(
                "UPDATE users SET password = ?, otp = NULL WHERE email = ?",
                [hashedPassword, email]
            );

            await connection.commit();
            connection.release();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Password Reset Successful",
                text: `Dear User,\n\nYour password has been successfully reset on ${new Date().toLocaleString()}.\nIf you did not initiate this change, please contact our support immediately.\n\nBest regards,\nThePlanBeyond Team`,
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (mailErr) {
                console.error("Failed to send password reset notification:", mailErr);
            }

            res.json({ success: true, message: "Password updated successfully." });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/login", async (req, res) => {
    const { email, password, rememberMe, deviceId, userAgent } = req.body;

    if (!email || !password || !deviceId) {
        return res.status(400).json({
            success: false,
            message: "Email, password, and device ID are required.",
        });
    }

    try {
        const [users] = await pool.query(
            "SELECT id, password, is_verified, ambassador_accept, remember_me FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        // Check device
        const deviceInfo = await getDeviceInfo(user.id, deviceId);
        const isTrustedDevice = deviceInfo && deviceInfo.is_trusted;

        // Update remember_me and device info (do not trust device yet)
        await pool.query("UPDATE users SET remember_me = ? WHERE id = ?", [
            rememberMe || false,
            user.id,
        ]);
        await upsertDevice(user.id, deviceId, userAgent || "Unknown Device", isTrustedDevice);

        if (user.is_verified === 1) {
            if (isTrustedDevice) {
                req.session.userId = user.id;
                return res.json({
                    success: true,
                    message: "Login successful.",
                    userId: user.id,
                    userType: "user",
                });
            } else {
                const otp = generateOtp();
                await pool.query("UPDATE users SET otp = ? WHERE id = ?", [otp, user.id]);

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "Your Login OTP",
                    text: `Your OTP for login from ${userAgent || "an unknown device"} is ${otp}. It is valid for 5 minutes.`,
                });

                return res.json({
                    success: false,
                    message: "OTP sent to your email for verification.",
                    requiresOtp: true,
                    deviceId,
                });
            }
        } else if (user.is_verified === 0 && user.ambassador_accept === 0) {
            return res.status(400).json({
                success: false,
                message: "You haven't accepted the ambassador request. Please accept and login again.",
            });
        } else if (user.is_verified === 0 && user.ambassador_accept === 1) {
            if (isTrustedDevice) {
                req.session.userId = user.id;
                return res.json({
                    success: true,
                    message: "Login successful.",
                    userId: user.id,
                    userType: "ambassador",
                });
            } else {
                const otp = generateOtp();
                await pool.query("UPDATE users SET otp = ? WHERE id = ?", [otp, user.id]);

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "Unlock Your The Plan Beyond Journey!",
                    text: `Dear User,

Welcome to ThePlanBeyond — where your digital legacy is protected with care and simplicity.

To complete your login from ${userAgent || "an unknown device"}, please use the following One-Time Password (OTP):

Your OTP: ${otp}

This OTP is valid for the next 10 minutes, ensuring your account remains secure. Enter it on the verification page to activate your account and start managing your plan with ease.

Thank you for choosing ThePlanBeyond to safeguard what matters most.

Warm regards,
ThePlanBeyond Team`,
                });

                return res.json({
                    success: false,
                    message: "OTP sent to your email for verification.",
                    requiresOtp: true,
                    deviceId,
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Please verify your email with OTP.",
            });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-login-otp", async (req, res) => {
    const { email, otp, deviceId, trustDevice, userAgent } = req.body;

    if (!email || !otp || !deviceId) {
        return res.status(400).json({
            success: false,
            message: "Email, OTP, and device ID are required.",
        });
    }

    try {
        const [users] = await pool.query(
            "SELECT id, otp, is_verified, ambassador_accept FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User not found.",
            });
        }

        const user = users[0];
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        // Clear OTP
        await pool.query("UPDATE users SET otp = NULL WHERE id = ?", [user.id]);

        // Update or insert device with trust status
        await upsertDevice(user.id, deviceId, userAgent || "Unknown Device", trustDevice);

        req.session.userId = user.id;
        return res.json({
            success: true,
            message: "OTP verified successfully.",
            userId: user.id,
            userType: user.is_verified === 1 ? "user" : "ambassador",
        });
    } catch (err) {
        console.error("Error verifying OTP:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;