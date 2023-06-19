// ? Node modules.
const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");

const {
  controllerRootSlash,
  AuthController,
  PostController,
} = require("../controllers");

// ? Root slash.
router.get("/", controllerRootSlash);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post(
  "/posts",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  PostController.createPostHandler
);

// ? Export.
module.exports = router;
