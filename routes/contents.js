const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { PostController } = require("../controllers");

router.get("/posts", PostController.getPublishedPosts);
router.get("/get-post/:slug", PostController.getBySlug);
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

router.post(
  "/posts/action/:slug",
  Middlewares.authenticateMiddleware,
  PostController.contentActionHandler
);

router.get(
  "/get-saved-posts",
  [Middlewares.authenticateMiddleware],
  PostController.getSavedContents
);

module.exports = router;
