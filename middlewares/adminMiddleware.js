const jwt = require("jsonwebtoken");
const Admins = require("../models/Admin");

const authenticateMiddleware = async (req, res, next) => {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authToken.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const user = await Admins.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authenticateMiddleware;
