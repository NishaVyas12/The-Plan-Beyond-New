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
    const { email, userId } = req.body;

    if (!email || !userId || userId !== req.session.userId) {
        return res.status(400).json({ success: false, message: "Invalid request." });
    }

    try {
        const [users] = await pool.query("SELECT id, email FROM users WHERE id = ? AND email = ?", [userId, email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const user = users[0];

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

        res.json({ success: true, options });
    } catch (err) {
        console.error("Error generating biometric registration options:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-biometric-registration", checkAuth, async (req, res) => {
    const { response, userId } = req.body;

    if (!response || !userId || userId !== req.session.userId) {
        console.error("Invalid request: Missing response or userId mismatch", { response, userId, sessionUserId: req.session.userId });
        return res.status(400).json({ success: false, message: "Invalid request." });
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
            console.error("Verification error:", err);
            return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
        }

        if (verification.verified && verification.registrationInfo && verification.registrationInfo.credential) {
            const { id: credentialID, publicKey: credentialPublicKey, counter } = verification.registrationInfo.credential;

            if (!credentialID || !credentialPublicKey || counter === undefined) {
                console.error("Invalid registrationInfo.credential:", { credentialID, credentialPublicKey, counter });
                return res.status(400).json({ success: false, message: "Invalid biometric registration data." });
            }

            const normalizedCredentialID = credentialID.replace(/=+$/, '');

            await pool.query(
                "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter) VALUES (?, ?, ?, ?)",
                [
                    parseInt(userId),
                    normalizedCredentialID,
                    Buffer.from(credentialPublicKey).toString("base64"),
                    counter,
                ]
            );

            delete req.session.challenge;

            res.json({ success: true, message: "Biometric registration successful." });
        } else {
            console.error("Biometric registration verification failed:", verification);
            return res.status(400).json({ success: false, message: "Biometric registration verification failed." });
        }
    } catch (err) {
        console.error("Error verifying biometric registration:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/login-biometric", async (req, res) => {
    try {
        const [credentials] = await pool.query(
            "SELECT user_id, credential_id FROM webauthn_credentials"
        );

        if (credentials.length === 0) {
            console.error("No biometric credentials found in the database.");
            return res.status(400).json({
                success: false,
                message: "No biometric credentials registered.",
            });
        }

        // Validate credential_id format
        const validCredentials = credentials.filter(cred => {
            if (typeof cred.credential_id !== 'string' || !cred.credential_id) {
                console.warn("Invalid credential_id type or empty for user_id:", cred.user_id, { credential_id: cred.credential_id });
                return false;
            }
            // Allow base64url characters (A-Z, a-z, 0-9, -, _, =)
            const base64urlRegex = /^[A-Za-z0-9\-_=]+$/;
            if (!base64urlRegex.test(cred.credential_id)) {
                console.warn("Invalid base64url format for credential_id for user_id:", cred.user_id, { credential_id: cred.credential_id });
                return false;
            }
            return true;
        });

        if (validCredentials.length === 0) {
            console.error("No valid credentials found after filtering.");
            return res.status(400).json({
                success: false,
                message: "No valid biometric credentials registered. Please re-register your biometrics.",
            });
        }

        // const options = await generateAuthenticationOptions({
        //   rpID,
        //   allowCredentials: validCredentials.map(cred => ({
        //     id: cred.credential_id, // Use raw base64url string
        //     type: "public-key",
        //   })),
        //   userVerification: "required",
        // });

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

        res.json({ success: true, options });
    } catch (err) {
        console.error("Error generating biometric login options:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

router.post("/verify-biometric-login", async (req, res) => {
    const { response } = req.body;

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
            "SELECT user_id, credential_id, public_key, counter FROM webauthn_credentials WHERE credential_id = ?",
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
            console.error("Verification error:", err);
            return res.status(400).json({ success: false, message: `Verification failed: ${err.message}` });
        }

        if (verification.verified) {
            await pool.query(
                "UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?",
                [verification.authenticationInfo.newCounter, credential.credential_id]
            );

            delete req.session.challenge;

            if (user.is_verified === 1) {
                req.session.userId = user.id;
                return res.json({
                    success: true,
                    message: "Biometric login successful.",
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
                    message: "Biometric login successful.",
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
            console.error("Biometric login verification failed:", verification);
            return res.status(400).json({ success: false, message: "Biometric login verification failed." });
        }
    } catch (err) {
        console.error("Error verifying biometric login:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;