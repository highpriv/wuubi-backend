const { uploadImageToS3 } = require("../services/uploadService");
const Contents = require("../models/Contents");
const Users = require("../models/User");
const generateSlug = require("../utils/generateSlug");

const controller = {
  async createPostHandler(req, res, next) {
    const { title, summary, category, content, status, type } = req.body;
    const { _id } = req.user;
    if (!_id) return res.status(401).send("Kullanıcı bulunamadı.");

    Users.findById(_id).then((result) => {
      if (!result) return res.status(401).send("Kullanıcı bulunamadı.");
    });

    const requiredFields = [
      "title",
      "summary",
      "category",
      "content",
      "thumbnail",
    ];
    const fieldNames = {
      title: "Başlık",
      summary: "Özet",
      category: "Kategori",
      content: "İçerik",
      thumbnail: "Öne Çıkan Görsel",
    };

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map((field) => fieldNames[field] || field)
        .join(", ");
      return res
        .status(400)
        .send(
          `Eksik olan ${
            missingFieldNames.length > 1 ? "alanları" : "alanı"
          } girmeniz gerekmektedir: ${missingFieldNames}`
        );
    }

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
      type,
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
      res.status(400).send("İçerik oluşturulurken bir hata meydana geldi.");
    }
  },

  async autosaveHandler(req, res) {
    const { title, summary, category, content, status, type } = req.body;
    const { _id } = req.user;

    try {
      let draft = await Contents.findOne({
        userID: _id,
        status: "Draft",
        type,
      });

      if (draft) {
        draft.title = title;
        draft.summary = summary;
        draft.category = category;
        draft.content = content;
        draft.status = "Draft";
      } else {
        draft = new Contents({
          title: title,
          slug: generateSlug(title),
          summary,
          category,
          content,
          userID: _id,
          status: "Draft",
        });
      }
      await draft.save();

      res.status(200).json({ message: "Taslak Kaydedildi", draft });
    } catch (error) {
      console.error("Autosave error:", error);
      res.status(500).json({ error: "Taslak kaydedilirken hata oluştu." });
    }
  },
};
module.exports = controller;
