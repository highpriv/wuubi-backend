const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { GroupController } = require("../controllers");

router.post(
  "/create",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  GroupController.createGroup
);

router.get(
  "/:slug",
  Middlewares.authenticateMiddleware,
  GroupController.getGroup
);

router.post(
  "/:slug/action",
  Middlewares.authenticateMiddleware,
  GroupController.groupAction
);

router.post(
  "/:slug/publish",
  [Middlewares.authenticateMiddleware, Middlewares.uploadMultipleImages],
  GroupController.publishPost
);

router.post(
  "/posts/:postID/action",
  Middlewares.authenticateMiddleware,
  GroupController.actionPost
);

router.get(
  "/posts/:postID/comments",
  Middlewares.authenticateMiddleware,

  GroupController.getPostComments
);

router.post(
  "/posts/:postID/comments",
  Middlewares.authenticateMiddleware,
  GroupController.createPostComment
);

router.post(
  "/comments/:commentID/:action",
  Middlewares.authenticateMiddleware,
  GroupController.likeComment
);

router.put(
  "/:groupID/edit",
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  GroupController.editGroup
);
module.exports = router;
