//#ToDo: Move all routes to seperated files

// ? Node modules.
const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");

const {
  controllerRootSlash,
  AuthController,
  PostController,
  SettingsController,
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
router.get("/settings", SettingsController.getSettings);

// ? Export.
module.exports = router;
