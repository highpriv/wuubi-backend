const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { PostController } = require("../controllers");

router.get("/posts", PostController.getPublishedPosts);
router.post(
  "/posts",
  [Middlewares.multerMiddleware, Middlewares.authenticateMiddleware],
  PostController.createPostHandler
);

router.post(
  "/autosave",
  [
    Middlewares.authenticateMiddleware,
    Middlewares.uploadFieldsMiddlewareGenerator,
  ],
  PostController.autosaveHandler
);
router.get(
  "/autosave",
  [Middlewares.authenticateMiddleware],
  PostController.getDraftHandler
);

router.get("/featured-posts", PostController.getFeaturedPosts);

module.exports = router;
