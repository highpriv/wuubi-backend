const authenticateMiddleware = require("./authenticateMiddleware");
const multerMiddleware = require("./multerMiddleware");
const adminMiddleware = require("./adminMiddleware");

module.exports = {
  authenticateMiddleware,
  multerMiddleware,
  adminMiddleware,
};
