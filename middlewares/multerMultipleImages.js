const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const uploadMultipleImages = upload.array("images", 4);

module.exports = uploadMultipleImages;
