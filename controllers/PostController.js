const { uploadImageToS3 } = require("../services/uploadService");
const Contents = require("../models/Contents");
const Users = require("../models/User");
const generateSlug = require("../utils/generateSlug");
const generateRandomSlug = require("../utils/randomSlug");
const dtos = require("../utils/dtos/index");
const controller = {
  async getPublishedPosts(req, res) {
    const { page, limit, category, type, slug } = req.query;
    const userIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

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

      if (userIP) {
        posts.forEach((post) => {
          if (!post.uniqueViewCount.includes(userIP)) {
            post.viewCount = post.viewCount + 1;
            post.dailyViewCount = post.dailyViewCount + 1;
            post.uniqueDailyViewCount.push(userIP);
            post.uniqueViewCount.push(userIP);
            post.save();
          }
        });
      }

      const modifiedPosts = posts.map((post) => dtos.contentDto(post));

      res.status(200).send({
        posts: modifiedPosts,
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
    let {
      title,
      summary,
      category,
      thumbnail,
      content,
      type,
      pollContent,
      quizContent,
      listContent,
      testContent,
    } = req.body;
    const { _id } = req.user;

    pollContent = pollContent ? JSON.parse(pollContent) : [];
    quizContent = quizContent ? JSON.parse(quizContent) : [];
    listContent = listContent ? JSON.parse(listContent) : [];
    testContent = testContent ? JSON.parse(testContent) : [];

    try {
      if (!_id) return res.status(401).send("Kullanıcı bulunamadı.");

      Users.findById(_id).then((result) => {
        if (!result) return res.status(401).send("Kullanıcı bulunamadı.");
      });
    } catch (error) {
      console.log(error);
      return res.status(401).send("Kullanıcı bulunamadı.");
    }

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
      thumbnail: "İçerik Görseli",
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

    let newPost = {
      title,
      slug,
      content,
      pollContent,
      quizContent,
      listContent,
      testContent,
      summary,
      category,
      type,
      userID: _id,
      status: "Pending",
    };

    try {
      if (typeof thumbnail === "string") {
        newPost.thumbnail = thumbnail;
      } else if (req.files && req.files.thumbnail) {
        newPost.thumbnail = await uploadImageToS3(req.files.thumbnail[0]);
      }

      await Contents.create(newPost)
        .then((result) => {
          res.status(201).send({
            message: "İçerik başarıyla oluşturuldu.",
            result,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(400).send("İçerik oluşturulurken bir hata meydana geldi.");
        });
    } catch (error) {
      console.log("hata!", error);
      res.status(400).send("İçerik oluşturulurken bir hata meydana geldi.");
    }
  },

  async autosaveHandler(req, res) {
    let {
      title,
      summary,
      category,
      content,
      type,
      listContent,
      pollContent,
      quizContent,
      testContent,
    } = req.body;

    const { _id } = req.user;
    listContent = listContent ? JSON.parse(listContent) : [];
    pollContent = pollContent ? JSON.parse(pollContent) : [];
    quizContent = quizContent ? JSON.parse(quizContent) : [];
    testContent = testContent ? JSON.parse(testContent) : [];

    try {
      let draft = await Contents.findOne({
        userID: _id,
        status: "Draft",
        type,
      });

      let thumbnailImg;
      if (req.files && req.files.thumbnail) {
        thumbnailImg = await uploadImageToS3(req.files.thumbnail[0]);
      }
      else {
        thumbnailImg = draft.thumbnail;
      }

      let listImages = [];
      if (req.files) {
        console.log("req.files", req.files)
        for (let i = 0; i < 30; i++) {
          if (req.files[`listImage_${i}`]) {
            listImages.push(
            {
              index: i,
              image: await uploadImageToS3(req.files[`listImage_${i}`][0]),
            }
            );
          }
        }
      }

      if (listImages.length > 0) {
        listContent = listContent.map((item, index) => {
          const relatedImage = listImages.find((image) => image.index === index);
          if (relatedImage) {
            item.image = relatedImage.image;
          }
          return item;
        });
      }

      if (draft) {
        draft.title = title;
        draft.summary = summary;
        draft.category = category;
        draft.content = content;
        draft.listContent = listContent;
        draft.pollContent = pollContent;
        draft.quizContent = quizContent;
        draft.testContent = testContent;
        draft.status = "Draft";
        draft.thumbnail = thumbnailImg;
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
          listContent,
          content,
          thumbnail: thumbnailImg,
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

  async getFeaturedPosts(req, res) {
    try {
      const posts = await Contents.find({
        status: "Published",
      })
        .sort({ createdAt: -1, dailyViewCount: -1 })
        .limit(3)
        .populate("userID", "name lastname username");

      if (!posts || posts.length === 0) {
        return res.status(404).send("İçerik bulunamadı.");
      }
      res.status(200).send(posts.map((post) => dtos.contentDto(post)));
    } catch (error) {
      console.log(error);
      res.status(400).send("İçerikler getirilirken bir hata meydana geldi.");
    }
  },
};
module.exports = controller;
