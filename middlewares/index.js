const authenticateMiddleware = require("./authenticateMiddleware");
const multerMiddleware = require("./multerMiddleware");
const adminMiddleware = require("./adminMiddleware");
const uploadFieldsMiddlewareGenerator = require("./multerListImages");

module.exports = {
  authenticateMiddleware,
  multerMiddleware,
  adminMiddleware,
  uploadFieldsMiddlewareGenerator,
};
