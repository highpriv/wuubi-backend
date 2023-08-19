const { uploadImageToS3 } = require("../services/uploadService");
const Contents = require("../models/Contents");
const Users = require("../models/User");
const generateSlug = require("../utils/generateSlug");
const parseHashtags = require("../utils/hashtagParser");
const generateRandomSlug = require("../utils/randomSlug");
const giveAchievement = require("../helpers/giveAchievement");
const dtos = require("../utils/dtos/index");
const controller = {
  async getPublishedPosts(req, res, next) {
    const { page, limit, category, type, slug } = req.query;
    const userIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const query = {
      status: "Published",
    };

    if (type) {
      query.type = type;
    }

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

    const requiredFields = ["title", "summary", "category", "content"];
    const fieldNames = {
      title: "Başlık",
      summary: "Özet",
      category: "Kategori",
      content: "İçerik",
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

    try {
      if (!_id) return res.status(401).send("Kullanıcı bulunamadı.");

      Users.findById(_id).then((result) => {
        if (!result) return res.status(401).send("Kullanıcı bulunamadı.");
      });
    } catch (error) {
      console.log(error);
      return res.status(401).send("Kullanıcı bulunamadı.");
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
    const hashtags = parseHashtags(content);

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
      hashtags,
    };

    try {
      if (req.files && req.files["thumbnail"]) {
        newPost.thumbnail = await uploadImageToS3(req.files["thumbnail"][0]);
      }



      await Contents.create(newPost)
        .then(async (result) => {
          res.status(201).send({
            message: "İçerik başarıyla oluşturuldu.",
            result,
          });

          await Contents.deleteMany({
            userID: _id,
            status: "Draft",
            type,
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
      } else {
        thumbnailImg = draft.thumbnail;
      }

      let listImages = [];
      if (req.files) {
        for (let i = 0; i < 30; i++) {
          if (req.files[`listImage_${i}`]) {
            listImages.push({
              index: i,
              image: await uploadImageToS3(req.files[`listImage_${i}`][0]),
            });
          }
        }
      }

      if (listImages.length > 0) {
        if (listImages.length > 0) {
          switch (type) {
            case "list":
              listContent = listContent.map((item, index) => {
                const relatedImage = listImages.find(
                  (image) => image.index === index
                );
                if (relatedImage) {
                  item.image = relatedImage.image;
                }
                return item;
              });
              break;
            case "test":
              testContent.results = testContent.results.map((item, index) => {
                const relatedImage = listImages.find(
                  (image) => image.index === index
                );
                if (relatedImage) {
                  item.image = relatedImage.image;
                }
                return item;
              });

              break;
            default:
              break;
          }
        }
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

  async getBySlug(req, res) {
    const { slug } = req.params;
    try {
      const post = await Contents.findOne({ slug })
        .populate("userID", "name lastname username")
        .populate("category", "name");
      if (!post) {
        return res.status(404).send("İçerik bulunamadı.");
      }

      if (post.uniqueViewCount && post.uniqueViewCount.length > 500) {
        giveAchievement("basarili-uye", post.userID);

        /*     if(gainedAchievement){
          const notification = await Notifications.create({
            userID: post.userID,
            message: `Tebrikler! Başarılı Üye başarımını kazandınız.`,
            link: `/profil/${post.userID.username}`,
            type: "achievement",
          });
          await notification.save();
        } */
      }
      res.status(200).send(dtos.contentDto(post));
    } catch (error) {
      console.log(error);
      res.status(400).send("İçerik getirilirken bir hata meydana geldi.");
    }
  },

  async contentActionHandler(req, res) {
    const { slug } = req.params;

    const { action } = req.body;

    const { _id } = req.user;

    try {
      const findPost = await Contents.findOne({ slug }).populate(
        "userID",
        "name lastname username"
      );
      if (!findPost) {
        return res.status(404).json({ error: "İçerik bulunamadı." });
      }

      switch (action) {
        case "like":
          if (findPost.likedBy.includes(_id)) {
            findPost.likedBy = findPost.likedBy.filter(
              (id) => id.toString() !== _id
            );
          } else {
            findPost.likedBy.push(_id);
          }
          break;
        case "bookmark":
          if (findPost.savedBy.includes(_id)) {
            findPost.savedBy = findPost.savedBy.filter(
              (id) => id.toString() !== _id
            );
          } else {
            findPost.savedBy.push(_id);
          }
          break;
        default:
          break;
      }

      await findPost.save();

      res.status(200).json({ message: "İçerik güncellendi.", post: findPost });
    } catch (err) {
      return res.status(500).json({ error: "Bir hata oluştu." });
    }
  },

  async getSavedContents(req, res) {
    const { _id } = req.user;
    const { page } = req.query;
    const limit = 10;

    try {
      const savedContents = await Contents.find({
        savedBy: _id,
        status: "Published",
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userID", "name lastname username");

      if (!savedContents || savedContents.length === 0) {
        return res.status(404).send("İçerik bulunamadı.");
      }
      res.status(200).send(savedContents.map((post) => dtos.contentDto(post)));
    } catch (error) {
      console.log(error);
      res.status(400).send("İçerikler getirilirken bir hata meydana geldi.");
    }
  },

  async voteOption(req, res) {
    const { slug } = req.params;

    const { optionIndex, questionIndex } = req.body;

    const { _id } = req.user;

    try {
      const findPost = await Contents.findOne({ slug }).populate(
        "userID",
        "name lastname username"
      );
      if (!findPost) {
        return res.status(404).json({ error: "İçerik bulunamadı." });
      }

      const isVoted = findPost.pollContent[Number(questionIndex)].options.filter(
        (option) => option.votedBy.includes(_id)
      )

      if (findPost.pollContent && findPost.pollContent.length > 0) {
        const findOption =
          findPost.pollContent[Number(questionIndex)].options[
            Number(optionIndex)
          ];

        if (findOption) {
          if (isVoted && isVoted?.length > 0) {
            return res.status(400).json({ error: "Zaten oy kullandınız." });
          } else {
            findOption.votedBy.push(_id);
          }

          findPost.pollContent.map((i) => {
            const totalVote = i.options.reduce(
              (a, b) => a + b.votedBy.length,
              0
            );

            i.options.map((j) => {
              j.percentage = Math.round((j.votedBy.length * 100) / totalVote);
              return j;
            });
          });

          await Contents.updateOne(
            { slug },
            { pollContent: findPost.pollContent }
          );

          return res.status(200).json({
            message: "Seçenek güncellendi.",
            post: findPost,
          });
        } else {
          return res.status(404).json({ error: "Seçenek bulunamadı." });
        }
      } else {
        return res.status(404).json({ error: "Anket bulunamadı." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Bir hata oluştu." });
    }
  },
};

module.exports = controller;
