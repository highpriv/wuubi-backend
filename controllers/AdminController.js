const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const controller = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await Admin.findOne({ email });
      if (!user) {
        return res.status(400).send({ error: "Invalid password or email." });
      }
      let errorMessages = [
        {
          check: !password || !email,
          message: "Bütün alanları doldurunuz.",
        },
        {
          check: !(await bcrypt.compare(password, user.password)),
          message: "Invalid password or email.",
        },
      ];

      let i = 0;
      while (i < errorMessages.length) {
        if (errorMessages[i].check)
          return res.status(400).send({ error: errorMessages[i].message });
        i++;
      }
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: 86400,
      });
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      res.status(200).json({
        token,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar,
      });
    } catch (err) {
      console.log(err.message);
      res.status(401).send({
        token: null,
        message: "An error occured!",
      });
    }
  },

  async register(req, res, next) {
    try {
      const { name, lastname, email, password } = req.body;

      const adminExists = await Admin.findOne({ email });

      if (adminExists) {
        return res.status(400).send({ error: "Account already exists" });
      }

      const user = new Admin({ name, lastname, email, password });
      await user.save();

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      res.status(200).json({
        token,
        user: {
          name: user.name,
          lastname: user.lastname,
        },
      });
    } catch (err) {
      console.log(err.message);
      res.status(401).send({
        message: "An error occured!",
      });
    }
  },
};
module.exports = controller;
