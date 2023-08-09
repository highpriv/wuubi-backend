const User = require("../models/User");
const Achievements = require("../models/Achievements");

async function giveAchievement(achievementSlug, userId) {
  const findAchievement = await Achievements.findOne({ slug: achievementSlug });

  User.findOneAndUpdate(
    { _id: userId },
    {
      $cond: {
        if: { $in: [findAchievement._id, "$achievement"] },
        then: "$achievement",
        else: { $push: { achievement: findAchievement._id } },
      },
    },
    { new: true }
  )
    .then((user) => {
      return user;
    })
    .catch((err) => {
      console.log(err);
    });
}

module.exports = giveAchievement;
