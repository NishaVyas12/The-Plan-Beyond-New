const express = require("express");
const { pool } = require("../config/database");
const { checkAuth } = require("../middleware/auth");
const { rpName, rpID, origin } = require("../config/webauthn");
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const router = express.Router();

router.post("/register-biometric", checkAuth, async (req, res) => {
    const { email, userId, biometricType } = req.body;

    if (!email || !userId || userId !== req.session.userId) {
        return res.status(400).json({ success: false, message: "Invalid request." });
    }

    if (!["face", "fingerprint"].includes(biometricType)) {
        return res.status(400).json({ success: false, message: "Invalid biometric type." });
    }

    try {
        const [users] = await pool.query("SELECT id, email FROM users WHERE id = ? AND email = ?", [userId, email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const user = users[0];
        console.log(`Generating ${biometricType} registration options for user:`, user.email);

        const options = await generateRegistrationOptions({
            rpName: rpName || 'The Plan Beyond',
            rpID: rpID || 'localhost',
            userId: Buffer.from(user.id.toString()),
            userName: user.email,
            attestationType: "none",
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                residentKey: "preferred",
            },
            excludeCredentials: [],
        });

        req.session.challenge = options.challenge;
        req.session.userId = user.id;
        req.session.biometricType = biometricType; // Store biometric type in session

        res.json({ success: true, options });
    } catch (err) {
        console.error(`Error generating ${biometricType} registration options:`, err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-biometric-registration", checkAuth, async (req, res) => {
    const { response, userId, biometricType } = req.body;

    if (!response || !userId || userId !== req.session.userId) {
        console.error("Invalid request: Missing response or userId mismatch", { response, userId, sessionUserId: req.session.userId });
        return res.status(400).json({ success: false, message: "Invalid request." });
    }

    if (!["face", "fingerprint"].includes(biometricType)) {
        return res.status(400).json({ success: false, message: "Invalid biometric type." });
    }

    try {
        const [users] = await pool.query("SELECT id, email FROM users WHERE id = ?", [parseInt(userId)]);
        if (users.length === 0) {
            console.error("User not found for userId:", userId);
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const expectedChallenge = req.session.challenge;
        if (!expectedChallenge) {
            console.error("No challenge found in session for userId:", userId);
            return res.status(400).json({ success: false, message: "No challenge found in session." });
        }

        let clientData;
        try {
            clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64").toString());
            if (clientData.challenge !== expectedChallenge) {
                console.error("Challenge mismatch:", { received: clientData.challenge, expected: expectedChallenge });
                return res.status(400).json({ success: false, message: "Challenge mismatch." });
            }
        } catch (err) {
            console.error("Error decoding clientDataJSON:", err);
            return res.status(400).json({ success: false, message: "Invalid client data." });
        }

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (err) {
            console.error(`Verification error for ${biometricType}:`, err);
            return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
        }

        if (verification.verified && verification.registrationInfo && verification.registrationInfo.credential) {
            const { id: credentialID, publicKey: credentialPublicKey, counter } = verification.registrationInfo.credential;

            if (!credentialID || !credentialPublicKey || counter === undefined) {
                console.error(`Invalid registrationInfo.credential for ${biometricType}:`, { credentialID, credentialPublicKey, counter });
                return res.status(400).json({ success: false, message: `Invalid ${biometricType} registration data.` });
            }

            const normalizedCredentialID = credentialID.replace(/=+$/, '');

            await pool.query(
                "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, biometric_type) VALUES (?, ?, ?, ?, ?)",
                [
                    parseInt(userId),
                    normalizedCredentialID,
                    Buffer.from(credentialPublicKey).toString("base64"),
                    counter,
                    biometricType
                ]
            );

            delete req.session.challenge;
            delete req.session.biometricType;

            res.json({ success: true, message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} registration successful.` });
        } else {
            console.error(`${biometricType} registration verification failed:`, verification);
            return res.status(400).json({ success: false, message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} registration verification failed.` });
        }
    } catch (err) {
        console.error(`Error verifying ${biometricType} registration:`, err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/login-biometric", async (req, res) => {
    const { biometricType } = req.body; // Optionally accept biometricType for login

    try {
        const [credentials] = await pool.query(
            "SELECT user_id, credential_id, biometric_type FROM webauthn_credentials WHERE biometric_type = ? OR biometric_type IS NULL",
            [biometricType || "fingerprint"]
        );

        if (credentials.length === 0) {
            console.error("No biometric credentials found for type:", biometricType || "any");
            return res.status(400).json({
                success: false,
                message: "No biometric credentials registered.",
            });
        }

        const validCredentials = credentials.filter(cred => {
            if (typeof cred.credential_id !== 'string' || !cred.credential_id) {
                console.warn("Invalid credential_id type or empty for user_id:", cred.user_id, { credential_id: cred.credential_id });
                return false;
            }
            const base64urlRegex = /^[A-Za-z0-9\-_=]+$/;
            if (!base64urlRegex.test(cred.credential_id)) {
                console.warn("Invalid base64url format for credential_id for user_id:", cred.user_id, { credential_id: cred.credential_id });
                return false;
            }
            return true;
        });

        if (validCredentials.length === 0) {
            console.error("No valid credentials found after filtering for type:", biometricType || "any");
            return res.status(400).json({
                success: false,
                message: "No valid biometric credentials registered. Please re-register your biometrics.",
            });
        }

        const allowCredentials = validCredentials.map((cred) => ({
            id: cred.credential_id,
            type: 'public-key',
            transports: ['internal'],
        }));

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "required",
            allowCredentials,
            timeout: 60000,
        });

        req.session.challenge = options.challenge;
        req.session.biometricType = biometricType; // Store for verification

        res.json({ success: true, options });
    } catch (err) {
        console.error(`Error generating biometric login options for ${biometricType || "any"}:`, err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-biometric-login", async (req, res) => {
    const { response, biometricType } = req.body;

    if (!response || !response.id) {
        console.error("Invalid request: Missing response or response.id", { response });
        return res.status(400).json({ success: false, message: "Invalid request." });
    }

    try {
        const expectedChallenge = req.session.challenge;
        if (!expectedChallenge) {
            console.error("No challenge found in session");
            return res.status(400).json({ success: false, message: "No challenge found in session." });
        }

        const credentialId = response.id;

        const [credentials] = await pool.query(
            "SELECT user_id, credential_id, public_key, counter, biometric_type FROM webauthn_credentials WHERE credential_id = ?",
            [credentialId]
        );

        if (credentials.length === 0) {
            console.error("No credentials found for credential_id:", credentialId);
            return res.status(400).json({
                success: false,
                message: "No biometric credentials found for this user.",
            });
        }

        const credential = credentials[0];
        if (biometricType && credential.biometric_type && biometricType !== credential.biometric_type) {
            console.error("Biometric type mismatch:", { requested: biometricType, stored: credential.biometric_type });
            return res.status(400).json({
                success: false,
                message: `Requested ${biometricType} but credential is registered as ${credential.biometric_type}.`,
            });
        }

        const [users] = await pool.query(
            "SELECT id, email, is_verified, ambassador_accept FROM users WHERE id = ?",
            [credential.user_id]
        );

        if (users.length === 0) {
            console.error("User not found for user_id:", credential.user_id);
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const user = users[0];
        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                credential: {
                    id: credential.credential_id,
                    publicKey: Buffer.from(credential.public_key, "base64"),
                    counter: credential.counter,
                },
                requireUserVerification: true,
            });
        } catch (err) {
            console.error(`Verification error for ${biometricType || "biometric"}:`, err);
            return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
        }

        if (verification.verified) {
            await pool.query(
                "UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?",
                [verification.authenticationInfo.newCounter, credential.credential_id]
            );

            delete req.session.challenge;
            delete req.session.biometricType;

            if (user.is_verified === 1) {
                req.session.userId = user.id;
                return res.json({
                    success: true,
                    message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} login successful.`,
                    userId: user.id,
                    userType: "user",
                });
            } else if (user.is_verified === 0 && user.ambassador_accept === 0) {
                return res.status(400).json({
                    success: false,
                    message: "You haven't accepted the ambassador request. Please accept and login again.",
                });
            } else if (user.is_verified === 0 && user.ambassador_accept === 1) {
                req.session.userId = user.id;
                return res.json({
                    success: true,
                    message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} login successful.`,
                    userId: user.id,
                    userType: "ambassador",
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Please verify your email with OTP.",
                });
            }
        } else {
            console.error(`${biometricType || "Biometric"} login verification failed:`, verification);
            return res.status(400).json({ success: false, message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} login verification failed.` });
        }
    } catch (err) {
        console.error(`Error verifying ${biometricType || "biometric"} login:`, err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.delete("/delete-biometric", checkAuth, async (req, res) => {
    const { biometricType } = req.body;
    const userId = req.session.userId;

    if (!["face", "fingerprint"].includes(biometricType)) {
        return res.status(400).json({ success: false, message: "Invalid biometric type." });
    }

    try {
        const [credentials] = await pool.query(
            "SELECT credential_id FROM webauthn_credentials WHERE user_id = ? AND biometric_type = ?",
            [userId, biometricType]
        );

        if (credentials.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No ${biometricType === "face" ? "Face ID" : "Fingerprint"} biometric registered.`,
            });
        }

        await pool.query(
            "DELETE FROM webauthn_credentials WHERE user_id = ? AND biometric_type = ?",
            [userId, biometricType]
        );

        res.json({
            success: true,
            message: `${biometricType === "face" ? "Face ID" : "Fingerprint"} biometric deleted successfully.`,
        });
    } catch (err) {
        console.error(`Error deleting ${biometricType} biometric:`, err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});


router.get("/check-biometric", checkAuth, async (req, res) => {
    const userId = req.session.userId;
    const { biometricType } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID not found." });
    }

    if (!["face", "fingerprint"].includes(biometricType)) {
        return res.status(400).json({ success: false, message: "Invalid biometric type." });
    }

    try {
        const [credentials] = await pool.query(
            "SELECT credential_id FROM webauthn_credentials WHERE user_id = ? AND biometric_type = ?",
            [userId, biometricType]
        );

        res.json({
            success: true,
            isRegistered: credentials.length > 0,
        });
    } catch (err) {
        console.error(`Error checking ${biometricType} biometric status:`, err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;