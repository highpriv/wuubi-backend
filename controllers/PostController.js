const { uploadImageToS3 } = require("../services/uploadService");
const Contents = require("../models/Contents");
const Users = require("../models/User");
const generateSlug = require("../utils/generateSlug");

const controller = {
  async createPostHandler(req, res, next) {
    const { title, summary, category, content, status } = req.body;
    const { _id } = req.user;
    if (!_id) return res.status(401).send("Kullanıcı bulunamadı.");

    Users.findById(_id).then((result) => {
      if (!result) return res.status(401).send("Kullanıcı bulunamadı.");
    });

    let slug = generateSlug(title);
    let slugChecker = true;
    let counter = 1;

    while (slugChecker) {
      await Contents.findOne({ slug }).then((result) => {
        if (result) {
          slug = generateSlug(title + "-" + counter);
          counter++;
        } else {
          slugChecker = false;
        }
      });
    }

    const newPost = {
      title,
      slug,
      content,
      summary,
      category,
      userID: _id,
      status: status === "Draft" ? "Draft" : "Pending",
    };

    try {
      const uploadedFile = await uploadImageToS3(req.file);
      newPost.thumbnail = uploadedFile;

      await Contents.create(newPost).then((result) => {
        res.status(201).send({
          message: "İçerik başarıyla oluşturuldu.",
        });
      });
    } catch (error) {
      console.log("hata!", error);
      res.status(500).send("İçerik oluşturulurken bir hata meydana geldi.");
    }
  },
};
module.exports = controller;
