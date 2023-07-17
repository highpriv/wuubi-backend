const { uploadImageToS3 } = require("../services/uploadService");
const Contents = require("../models/Contents");
const Users = require("../models/User");
const generateSlug = require("../utils/generateSlug");
const generateRandomSlug = require("../utils/randomSlug");
const controller = {
  async getPublishedPosts(req, res) {
    const { page, limit, category, type, slug } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const query = {
      status: "Published",
      type,
    };

    if (category) {
      query.category = category;
    }

    if (slug) {
      query.slug = slug;
    }

    try {
      const posts = await Contents.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("userID", "name lastname username");

      const totalPosts = await Contents.countDocuments(query);

      if (!posts || posts.length === 0) {
        return res.status(404).send("İçerik bulunamadı.");
      }
      res.status(200).send({
        posts,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send("İçerikler getirilirken bir hata meydana geldi.");
    }
  },

  async createPostHandler(req, res, next) {
    const { title, summary, category, content, status, type } = req.body;
    const { _id } = req.user;
    if (!_id) return res.status(401).send("Kullanıcı bulunamadı.");

    Users.findById(_id).then((result) => {
      if (!result) return res.status(401).send("Kullanıcı bulunamadı.");
    });

    const requiredFields = ["title", "summary", "category", "content"];
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
    const { title, summary, category, content, type } = req.body;
    const { _id } = req.user;

    try {
      let draft = await Contents.findOne({
        userID: _id,
        status: "Draft",
        type,
      });
      const uploadedFile = req.file ? await uploadImageToS3(req.file) : "";

      if (draft) {
        draft.title = title;
        draft.summary = summary;
        draft.category = category;
        draft.content = content;
        draft.status = "Draft";
        draft.thumbnail = uploadedFile;
        draft.save();
      } else {
        let slug = generateRandomSlug();
        let slugChecker = true;
        let counter = 1;

        while (slugChecker) {
          await Contents.findOne({ slug }).then((result) => {
            if (result || slug === "") {
              slug = generateRandomSlug();
              counter++;
            } else {
              slugChecker = false;
            }
          });
        }
        draft = await Contents.create({
          title,
          summary,
          category,
          slug,
          content,
          thumbnail: uploadedFile,
          status: "Draft",
          type,
          userID: _id,
        });
      }

      res.status(201).json({ message: "Taslak Kaydedildi", draft });
    } catch (error) {
      console.error("Autosave error:", error);
      res.status(500).json({ error: "Taslak kaydedilirken hata oluştu." });
    }
  },

  async getDraftHandler(req, res) {
    const { _id } = req.user;
    const { type } = req.query;
    try {
      const draft = await Contents.findOne({
        userID: _id,
        status: "Draft",
        type,
      });
      if (!draft) {
        return res.status(404).json({ error: "Taslak bulunamadı." });
      }
      res.status(200).json(draft);
    } catch (error) {
      res.status(500).json({ error: "Taslak getirilirken hata oluştu." });
    }
  },
};
module.exports = controller;
