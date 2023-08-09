const { mongoose, ObjectId, Schema } = require("mongoose");

const AchievementsSchema = new Schema(
  {
    id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    title: {
      type: String,
    },
    slug: {
      type: String,
    },

    description: {
      type: String,
    },
    point: {
      type: Number,
    },
    badge: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

module.exports = mongoose.model(
  "Achievements",
  AchievementsSchema,
  "achievements"
);
