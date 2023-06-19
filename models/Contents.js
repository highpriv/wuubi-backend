const { mongoose, ObjectId, Schema } = require("mongoose");
const bcrypt = require("bcryptjs");

const ContentSchema = new Schema(
  {
    id: AutoID,
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["gundem", "teknoloji-ve-bilim", "kultur-ve-sanat"],
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },

    userID: {
      type: ObjectId,
      required: true,
    },
    status: {
      type: String,
      required: false,
      enum: ["Draft", "Pending", "Published", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);
ContentSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "id",
  justOne: true,
});
const Content = mongoose.model("Content", ContentSchema);
module.exports = Content;
