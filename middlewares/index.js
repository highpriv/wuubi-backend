const authenticateMiddleware = require("./authenticateMiddleware");
const multerMiddleware = require("./multerMiddleware");
const adminMiddleware = require("./adminMiddleware");
const uploadFieldsMiddlewareGenerator = require("./multerListImages");
const uploadMultipleImages = require("./multerMultipleImages");

module.exports = {
  authenticateMiddleware,
  multerMiddleware,
  adminMiddleware,
  uploadFieldsMiddlewareGenerator,
  uploadMultipleImages,
};
