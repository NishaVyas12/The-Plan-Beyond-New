const rpName = "The Plan Beyond";
const rpID = process.env.WEBAUTHN_RPID || "localhost";
const origin = process.env.FRONTEND_URL || "http://localhost:5173";

module.exports = { rpName, rpID, origin };