const { mongoose, ObjectId, Schema } = require("mongoose");
AutoID = mongoose.Types.ObjectId;

const GroupPostSchema = new Schema(
  {
    id: AutoID,
    content: {
      type: String,
    },
    userID: {
      type: ObjectId,
      ref: "User",
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
    comments: [
      {
        type: ObjectId,
        ref: "GroupComments",
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

GroupPostSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "_id",
});

GroupPostSchema.virtual("groups", {
  ref: "Groups",
  localField: "groupID",
  foreignField: "id",
  justOne: true,
});

GroupPostSchema.virtual("groupComments", {
  ref: "GroupComments",
  localField: "comments",
  foreignField: "id",
});

module.exports = mongoose.model("GroupPosts", GroupPostSchema, "groupPosts");
