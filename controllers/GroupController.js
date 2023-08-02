const { uploadImageToS3 } = require("../services/uploadService");
const Groups = require("../models/Groups");
const Users = require("../models/User");
const GroupPosts = require("../models/GroupPosts");
const generateSlug = require("../utils/generateSlug");
const controller = {
  async createGroup(req, res, next) {
    let { title, summary, thumbnail, isPrivate } = req.body;
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
      thumbnail,
      admins: [_id],
      members: [_id],
    };

    try {
      if (req.files && req.files.thumbnail) {
        newGroup.thumbnail = await uploadImageToS3(req.files.thumbnail[0]);
      }

      await Groups.create(newGroup)
        .then(async (result) => {
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
        .populate("admins", "name surname username")
        .populate("members", "name surname username")
        .populate({
          path: "posts",
          populate: { path: "user", select: "name lastname username" },
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

    const { content, contentFile } = req.body;

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
    };

    await GroupPosts.create(newPost)
      .then(async (result) => {
        groupFinded.posts.push(result._id);
        await groupFinded.save();

        return res.status(201).send({
          message: "Gönderi başarıyla oluşturuldu.",
          result,
        });
      })
      .catch((err) => {
        console.log(err);
        return res
          .status(400)
          .send("Gönderi oluşturulurken bir hata meydana geldi.");
      });
  },
};
module.exports = controller;
