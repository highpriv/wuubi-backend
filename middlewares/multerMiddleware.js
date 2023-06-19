const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const multerMiddleware = upload.single("thumbnail");

module.exports = multerMiddleware;
