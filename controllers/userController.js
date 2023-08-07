const { uploadImageToS3 } = require("../services/uploadService");
const Users = require("../models/User");
const dtos = require("../utils/dtos/index");
const controller = {
  async getUser(req, res) {
    const { username } = req.params;
    console.log("test1", username)
    try {
      const user = await Users.findOne({ username });
      if (!user) {
        res.status(404).send("Kullanıcı bulunamadı.");
      }
      const userDto = dtos.userDto(user);
      res.status(200).json(userDto);
    } catch (error) {
      console.log(error);
      res
        .status(400)
        .send("Kullanıcı bilgileri getirilirken bir hata meydana geldi.");
    }
  },
};
module.exports = controller;
