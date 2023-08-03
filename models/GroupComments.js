const { mongoose, ObjectId, Schema } = require("mongoose");

const GroupCommentsSchema = new Schema(
  {
    content: {
      type: String,
    },
    userID: {
      type: ObjectId,
      ref: "User",
    },
    postID: {
      type: ObjectId,
      ref: "GroupPosts",
    },
    groupID: {
      type: ObjectId,
      ref: "Groups",
    },
    likes: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
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

GroupCommentsSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "_id",
  justOne: true,
  options: { select: "name lastname username" },
});

GroupCommentsSchema.virtual("groups", {
  ref: "Groups",
  localField: "groupID",
  foreignField: "id",
  justOne: true,
});

GroupCommentsSchema.virtual("groupPosts", {
  ref: "GroupPosts",
  localField: "postID",
  foreignField: "id",
  justOne: true,
});

module.exports = mongoose.model(
  "GroupComments",
  GroupCommentsSchema,
  "groupComments"
);
