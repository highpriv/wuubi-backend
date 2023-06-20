const Settings = require("../models/Settings");

async function updateSettings(req, res) {
  /*   const { contentCategories, metaTitle, contactAddress } = req.body;

  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings({
        contentCategories,
        metaTitle,
        contactAddress,
      });
    } else {
      settings.contentCategories = contentCategories;
      settings.metaTitle = metaTitle;
      settings.contactAddress = contactAddress;
    }

    await settings.save();

    res.status(200).json({ message: "Settings saved successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while saving the settings" });
  } */

  res.status(500).json({ message: "Under construction" });
}

async function getSettings(req, res) {
  try {
    const settings = await Settings.findOne();
    res.status(200).json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Config Err!" });
  }
}

module.exports = { updateSettings, getSettings };
