const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { userController } = require("../controllers");

router.get("/:username",userController.getUser);

router.get("/", Middlewares.authenticateMiddleware, userController.getUsers);

router.post(
  "/follow/:userId",
  Middlewares.authenticateMiddleware,
  userController.followUser
);

router.put(
  "/",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  userController.updateUser
);

router.post(
  "/publish",
  [Middlewares.authenticateMiddleware, Middlewares.uploadMultipleImages],
  userController.publishPost
);

module.exports = router;
