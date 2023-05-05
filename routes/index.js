// ? Node modules.
const express = require("express");
const router = express.Router();
const { controllerRootSlash, AuthController } = require("../controllers");

// ? Root slash.
router.get("/", controllerRootSlash);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

// ? Export.
module.exports = router;
