const checkAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Session timed out, login again." });
  }
  next();
};

module.exports = { checkAuth };