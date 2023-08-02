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
  [Middlewares.authenticateMiddleware, Middlewares.multerMiddleware],
  GroupController.publishPost
);

module.exports = router;
