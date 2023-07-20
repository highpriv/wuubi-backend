const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { PostController } = require("../controllers");

router.get("/posts", PostController.getPublishedPosts);
router.post(
  "/posts",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  PostController.createPostHandler
);

router.post(
  "/autosave",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  PostController.autosaveHandler
);
router.get(
  "/autosave",
  [Middlewares.authenticateMiddleware],
  PostController.getDraftHandler
);

router.get("/featured-posts", PostController.getFeaturedPosts);

module.exports = router;
