const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Contents = require("../models/Contents");

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

  async getPosts(req, res) {
    const { page, limit, category, type, slug } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    const query = {
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

  async updatePost(req, res) {
    const { status, title, type, slug, category, content, summary, thumbnail } =
      req.body;

    const { id } = req.query;
    try {
      const post = await Contents.findById(id);
      if (!post) {
        return res.status(404).send("İçerik bulunamadı.");
      }

      const updatedPost = {
        status,
        title,
        type,
        slug,
        category,
        content,
        summary,
        thumbnail,
      };

      Object.keys(updatedPost).forEach((key) => {
        if (!updatedPost[key]) {
          delete updatedPost[key];
        }
      });

      Object.assign(post, updatedPost);

      await post.save();
      res.status(200).send(post);
    } catch (error) {
      console.log(error);
      res.status(400).send("İçerik güncellenirken bir hata meydana geldi.");
    }
  },
};
module.exports = controller;
