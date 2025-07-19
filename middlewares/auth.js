// middleware/auth.js
const jwt = require("jsonwebtoken");
const SECRET = "spider";

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.clearCookie("token");
      return res.redirect("/login");
    }
  },

  requireRole: (role) => {
    return (req, res, next) => {
      if (req.user && req.user.role === role) {
        next();
      } else {
        res.status(403).send("Forbidden: You don't have permission");
      }
    };
  }
};

module.exports = authMiddleware;
