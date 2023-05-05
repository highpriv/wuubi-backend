const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const controller = {
  async login(req, res, next) {
    try {
      const { email, username, password } = req.body;
      console.log("email", email);
      const user = await User.findOne({ $or: [{ email }, { username }] });
      console.log("user", user);
      let errorMessages = [
        {
          check: !password,
          message: "Please enter all fields. pw",
        },
        {
          check: !username && !email,
          message: "Please enter all fields. id",
        },
        {
          check: !user,
          message: "Invalid password or email. 404",
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
      res.json({ token });
    } catch (err) {
      console.log(err.message);
      res.status(401).send({
        message: "An error occured!",
      });
    }
  },

  async register(req, res, next) {
    try {
      const { name, lastname, username, email, password } = req.body;

      const userExistsMail = await User.findOne({ email });
      const userExistUserName = await User.findOne({ username });

      if (userExistsMail) {
        return res.status(400).send({ error: "Email already exists" });
      }
      if (userExistUserName) {
        return res.status(400).send({ error: "Username already exists" });
      }

      const user = new User({ name, lastname, username, email, password });
      await user.save();

      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      res.send({ token });
    } catch (err) {
      console.log(err.message);
      res.status(401).send({
        message: "An error occured!",
      });
    }
  },
};
module.exports = controller;
