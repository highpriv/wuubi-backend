const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { AdminController, PostController } = require("../controllers");

router.post("/login", AdminController.login);
router.post("/new", [Middlewares.adminMiddleware], AdminController.register);
router.get("/posts", [Middlewares.adminMiddleware], AdminController.getPosts);
router.put("/posts", [Middlewares.adminMiddleware], AdminController.updatePost);

module.exports = router;
