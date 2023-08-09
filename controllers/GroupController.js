const { uploadImageToS3 } = require("../services/uploadService");
const Groups = require("../models/Groups");
const Users = require("../models/User");
const GroupComments = require("../models/GroupComments");
const GroupPosts = require("../models/GroupPosts");
const giveAchievement = require("../helpers/giveAchievement");
const generateSlug = require("../utils/generateSlug");
const controller = {
  async createGroup(req, res, next) {
    let { title, summary, isPrivate } = req.body;
    const { _id } = req.user;

    const requiredFields = ["title", "summary"];
    const fieldNames = {
      title: "Grup Adı",
      summary: "Grup Açıklaması",
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
      await Groups.findOne({ slug }).then((result) => {
        if (result) {
          slug = generateSlug(title + "-" + counter);
          counter++;
        } else {
          slugChecker = false;
        }
      });
    }

    let newGroup = {
      title,
      slug,
      summary,
      isPrivate,
      admins: [_id],
      members: [_id],
    };

    try {
      if (req.files && req.files["cover"]) {
        newGroup.cover = await uploadImageToS3(req.files["cover"][0]);
      }

      if (req.files && req.files["thumbnail"]) {
        newGroup.thumbnail = await uploadImageToS3(req.files["thumbnail"][0]);
      }

      await Groups.create(newGroup)
        .then(async (result) => {
          await giveAchievement("sosyal-uye", _id);
          res.status(201).send({
            message: "Grup başarıyla oluşturuldu.",
            result,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(400).send("Grup oluşturulurken bir hata meydana geldi.");
        });
    } catch (error) {
      console.log("hata!", error);
      res.status(400).send("Grup oluşturulurken bir hata meydana geldi.");
    }
  },

  async getGroup(req, res, next) {
    const { slug } = req.params;
    const { _id } = req.user;

    try {
      const group = await Groups.findOne({ slug })
        .populate("admins", "name lastname username")
        .populate("members", "name lastname username")
        .populate({
          path: "posts",
          populate: [{ path: "user", select: "name lastname username" }],
        })
        .exec();

      if (!group) return res.status(404).send("Grup bulunamadı.");

      if (group.isPrivate) {
        if (!group.members.includes(_id)) {
          return res.status(401).send("Bu grup gizli.");
        }

        return res.status(200).send({
          ...group.toJSON(),
          isMember: group.members
            .map((member) => member._id.toString())
            .includes(_id),
        });
      } else {
        return res.status(200).send({
          ...group.toJSON(),
          isMember: group.members
            .map((member) => member._id.toString())
            .includes(_id),
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async groupAction(req, res, next) {
    const { slug } = req.params;
    const { _id } = req.user;

    const { action } = req.body;

    if (!action) return res.status(400).send("Eylem belirtilmedi.");
    if (!["join", "leave"].includes(action))
      return res.status(400).send("Geçersiz eylem.");

    try {
      const groupFinded = await Groups.findOne({ slug }).exec();
      if (!groupFinded) return res.status(404).send("Grup bulunamadı.");

      const userFinded = await Users.findById(_id).exec();
      if (!userFinded) return res.status(404).send("Kullanıcı bulunamadı.");

      if (action === "join") {
        if (!groupFinded.members.includes(_id)) {
          groupFinded.members.push(_id);
        }

        if (!userFinded.joinedGroups.includes(groupFinded._id)) {
          userFinded.joinedGroups.push(groupFinded._id);
        }

        await groupFinded.save();
        await userFinded.save();

        return res.status(200).send({
          message: "Gruba katıldınız",
          group: {
            ...groupFinded.toJSON(),
            isMember: groupFinded.members
              .map((member) => member._id.toString())
              .includes(_id),
          },
        });
      } else if (action === "leave") {
        const index = groupFinded.members.indexOf(_id);
        if (index > -1) {
          groupFinded.members.splice(index, 1);
        }

        const userIndex = userFinded.joinedGroups.indexOf(groupFinded._id);
        if (userIndex > -1) {
          userFinded.joinedGroups.splice(userIndex, 1);
        }

        groupFinded.save();
        userFinded.save();

        return res.status(200).send({
          message: "Grup üyeliğiniz sonlandırıldı.",
          group: {
            ...groupFinded.toJSON(),
            isMember: groupFinded.members
              .map((member) => member._id.toString())
              .includes(_id),
          },
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async publishPost(req, res, next) {
    const { slug } = req.params;
    const { _id } = req.user;

    const { content } = req.body;
    let images = [];

    if (req.files) {
      images = await Promise.all(
        req.files.map(async (image) => {
          return await uploadImageToS3(image);
        })
      );
    }

    if (!content) return res.status(400).send("İçerik belirtilmedi.");

    const groupFinded = await Groups.findOne({ slug })
      .populate("members", "_id")
      .exec();

    if (!groupFinded) return res.status(404).send("Grup bulunamadı.");

    const userFinded = await Users.findById(_id).exec();
    if (
      !userFinded ||
      groupFinded.members.filter((m) => m._id == _id).length == 0 ||
      groupFinded.admins.filter((m) => m._id == _id).length == 0
    )
      return res
        .status(404)
        .send("Kullanıcı bulunamadı veya grup üyesi değil.");

    let newPost = {
      content,
      userID: _id,
      groupID: groupFinded._id,
      images,
    };

    try {
      const createdPost = await GroupPosts.create(newPost);
      const populatedPost = await GroupPosts.findById(createdPost._id).populate(
        "user"
      );

      groupFinded.posts.push(createdPost._id);
      await groupFinded.save();

      return res.status(201).send({
        message: "Gönderi başarıyla oluşturuldu.",
        post: populatedPost,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async actionPost(req, res, next) {
    const { postID } = req.params;
    const { _id } = req.user;
    const { action } = req.body;

    if (!["like", "dislike", "bookmark"].includes(action) || !action)
      return res.status(400).send("Geçersiz eylem.");

    if (!postID) return res.status(400).send("Gönderi belirtilmedi.");

    try {
      const findedPost = await GroupPosts.findById(postID)
        .populate("user", "name lastname username")
        .populate("comments", "user content createdAt userID")
        .exec();

      if (!findedPost) return res.status(404).send("Gönderi bulunamadı.");

      if (action === "like") {
        const isUserLiked = findedPost.likes.includes(_id);

        if (isUserLiked) {
          findedPost.likes = findedPost.likes.filter((id) => id != _id);
        } else {
          findedPost.likes.push(_id);
        }

        await findedPost.save();

        return res.status(200).send({
          message: `Gönderi ${
            isUserLiked ? "beğenisi kaldırıldı." : "beğenildi."
          }`,
          post: findedPost,
        });
      }

      if (action === "bookmark") {
        const isUserBookmarked =
          findedPost.bookmarks && findedPost.bookmarks.includes(_id)
            ? true
            : false;

        if (isUserBookmarked) {
          findedPost.bookmarks = findedPost.bookmarks.filter((id) => id != _id);
        } else {
          findedPost.bookmarks.push(_id);
        }

        await findedPost.save();

        return res.status(200).send({
          message: `Gönderi ${
            isUserBookmarked ? "arşivden kaldırıldı." : "kaydedildi."
          }`,
          post: findedPost,
        });
      }
    } catch (error) {}
  },

  async getPostComments(req, res, next) {
    const { postID } = req.params;
    const { _id } = req.user;

    if (!postID) return res.status(400).send("Gönderi belirtilmedi.");

    try {
      const findedComments = await GroupComments.find({ postID })
        .populate("user", "name lastname username")
        .exec();

      return res.status(200).send({
        message: "Yorumlar başarıyla getirildi.",
        comments: findedComments,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async createPostComment(req, res, next) {
    const { postID } = req.params;
    const { _id } = req.user;
    const { content } = req.body;

    const errorMessages = [
      {
        message: "Gönderi bulunamadı.",
        check: !postID,
      },
      {
        message: "İçerik belirtilmedi.",
        check: !content,
      },
      {
        message: "Yorum içeriği çok kısa.",
        check: content.length < 3,
      },
      {
        message: "Yorum içeriği çok uzun.",
        check: content.length > 500,
      },
    ];

    const errorMessage = errorMessages.find((e) => e.check);

    if (errorMessage) return res.status(400).send(errorMessage.message);

    try {
      const findedPost = await GroupPosts.findById(postID)
        .populate("user", "name lastname username")
        .populate("comments", "user content createdAt userID")
        .exec();

      if (!findedPost) return res.status(404).send("Gönderi bulunamadı.");

      const newComment = {
        content,
        userID: _id,
        postID: findedPost._id,
      };

      const createdComment = await GroupComments.create(newComment);

      findedPost.comments.push(createdComment._id);
      await findedPost.save();

      const populatedComment = await GroupComments.findById(
        createdComment._id
      ).populate("user", "name lastname username");

      return res.status(201).send({
        message: "Yorum başarıyla oluşturuldu.",
        comment: populatedComment,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async likeComment(req, res, next) {
    const { commentID, action } = req.params;
    const { _id } = req.user;

    if (!commentID) return res.status(400).send("Yorum belirtilmedi.");

    try {
      const findComment = await GroupComments.findById(commentID)
        .populate("user", "name lastname username")
        .exec();

      if (!findComment) return res.status(404).send("Yorum bulunamadı.");

      const isUserLiked = findComment.likes.includes(_id);
      const isUserDisliked = findComment.dislikes.includes(_id);
      switch (action) {
        case "like":
          if (isUserDisliked) {
            findComment.dislikes = findComment.dislikes.filter(
              (id) => id != _id
            );
          }
          if (isUserLiked) {
            findComment.likes = findComment.likes.filter((id) => id != _id);
          } else {
            findComment.likes.push(_id);
          }
          break;
        case "dislike":
          if (isUserLiked) {
            findComment.likes = findComment.likes.filter((id) => id != _id);
          }
          if (isUserDisliked) {
            findComment.dislikes = findComment.dislikes.filter(
              (id) => id != _id
            );
          } else {
            findComment.dislikes.push(_id);
          }
          break;
        default:
          return res.status(400).send("Geçersiz eylem.");
      }

      await findComment.save();

      return res.status(200).send({
        message: `Yorum ${isUserLiked ? "beğenisi kaldırıldı." : "beğenildi."}`,
        comment: findComment,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },

  async editGroup(req, res, next) {
    const { groupID } = req.params;
    const { _id } = req.user;
    let {
      title,
      summary,
      isPrivate,
      admins,
      members,
      removeThumbnail,
      removeCover,
    } = req.body;

    if (!groupID) return res.status(400).send("Grup belirtilmedi.");

    const findGroup = await Groups.findById(groupID).exec();

    if (!findGroup) return res.status(404).send("Grup bulunamadı.");

    const isUserAdmin = findGroup.admins.includes(_id);

    if (!isUserAdmin) return res.status(403).send("Yetkisiz işlem.");

    let newGroup = {
      title: title || findGroup.name,
      summary: summary || findGroup.summary,
      isPrivate: isPrivate || findGroup.isPrivate,
    };

    if (admins && admins.length === 0) {
      return res.status(400).send("En az bir yönetici olmalıdır.");
    }

    if (removeThumbnail) newGroup.thumbnail = null;
    if (removeCover) newGroup.cover = null;

    if (req.files && req.files["cover"]) {
      newGroup.cover = await uploadImageToS3(req.files["cover"][0]);
    }

    if (req.files && req.files["thumbnail"]) {
      newGroup.thumbnail = await uploadImageToS3(req.files["thumbnail"][0]);
    }

    if (members) {
      members = JSON.parse(members);

      const uniqueMembers = members.reduce((acc, current) => {
        const x = acc.find((item) => item._id === current._id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      newGroup.members = uniqueMembers.map((member) => member._id);
    }

    if (admins) {
      let parsedAdmins = JSON.parse(admins);

      const uniqueAdmins = parsedAdmins.reduce((acc, current) => {
        const x = acc.find((item) => item._id === current._id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      newGroup.admins = uniqueAdmins.map((admin) => admin._id);
    }

    try {
      const updatedGroup = await Groups.findByIdAndUpdate(groupID, newGroup, {
        new: true,
      }).exec();

      return res.status(200).send({
        message: "Grup başarıyla güncellendi.",
        group: updatedGroup,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bir hata oluştu");
    }
  },
};
module.exports = controller;
