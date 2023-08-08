const mongoose = require("mongoose");
const AuthController = require("./AuthController");
const AdminController = require("./AdminController");
const PostController = require("./PostController");
const GroupController = require("./GroupController");
const userController = require("./userController");
const SettingsController = require("./SettingsController");
const messageController = require("./messageController");

const { VERSION, NODE_ENV } = process.env;

module.exports.controllerRootSlash = function (req, res, next) {
  try {
    const obj = { status: "not", version: VERSION, environment: NODE_ENV };

    res.setHeader("Last-Modified", new Date().toUTCString());

    if (mongoose.connection.readyState == 1) {
      obj.status = "ok";
    }

    res.format({
      "text/plain": function () {
        res.send(String(obj.status).toUpperCase());
      },

      "text/html": function () {
        res.render("index", obj);
      },

      "application/json": function () {
        res.json(obj);
      },

      default: function () {
        res.status(406).send("Not Acceptable");
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports.AuthController = AuthController;
module.exports.PostController = PostController;
module.exports.AdminController = AdminController;
module.exports.GroupController = GroupController;
module.exports.SettingsController = SettingsController;
module.exports.userController = userController;
module.exports.messageController = messageController;
