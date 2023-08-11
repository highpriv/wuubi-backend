const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const multerMiddleware = (req, res, next) => {
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "Görsel yüklenemedi" });
    } else if (err) {
      return res.status(500).json({ error: "Sunucu hatası" });
    }

    const thumbnailFile = req.files && req.files["thumbnail"] ? req.files["thumbnail"][0] : null;
    const coverFile = req.files && req.files["cover"] ? req.files["cover"][0] : null;

    req.body.thumbnail = thumbnailFile;
    req.body.cover = coverFile;

    next();
  });
};

module.exports = multerMiddleware;
