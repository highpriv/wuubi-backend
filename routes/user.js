const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { userController } = require("../controllers");

router.get(
  "/:username",
  userController.getUser
);


module.exports = router;
