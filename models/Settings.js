const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  contentCategories: [Object],
  metaTitle: String,
});

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
