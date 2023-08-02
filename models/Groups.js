const { mongoose, ObjectId, Schema } = require("mongoose");

const GroupSchema = new Schema(
  {
    title: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
    },
    summary: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    posts: [
      {
        type: ObjectId,
        ref: "GroupPosts",
      },
    ],

    userID: {
      type: ObjectId,
      ref: "User",
    },
    members: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    admins: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

GroupSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "id",
  justOne: true,
});

GroupSchema.virtual("groupPosts", {
  ref: "GroupPosts",
  localField: "posts",
  foreignField: "id",
  justOne: true,
});

module.exports = mongoose.model("Groups", GroupSchema, "groups");
