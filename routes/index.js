const express = require("express");
const router = express.Router();
const adminRoutes = require("./admin");
const contentRoutes = require("./contents");
const authRoutes = require("./auth");

const { controllerRootSlash, SettingsController } = require("../controllers");

router.use("/admin", adminRoutes);
router.use("/contents", contentRoutes);
router.use("/auth", authRoutes);

router.get("/", controllerRootSlash);
router.get("/settings", SettingsController.getSettings);

module.exports = router;
