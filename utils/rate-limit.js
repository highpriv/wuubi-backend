// ? Node modules.
const rateLimit = require("express-rate-limit");

// ? Options.
const options = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  headers: true,
  handler: (req, res) => {
    res.json({ message: "You are restricted by too many requests" });
  },
};

module.exports = rateLimit(options);
