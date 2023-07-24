const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const listImages = () => {
  let fields = [];
  for (let i = 0; i < 30; i++) {
    fields.push({ name: `listImage_${i}`, maxCount: 1 });
  }

  fields.push({ name: "thumbnail", maxCount: 1 });

  return fields;
};

const uploadFieldsMiddlewareGenerator = upload.fields(listImages());

module.exports = uploadFieldsMiddlewareGenerator;
