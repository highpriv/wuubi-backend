const { mongoose, ObjectId, Schema } = require("mongoose");

const ContentCommentsSchema = new Schema(
  {
    content: {
      type: String,
    },
    userID: {
      type: ObjectId,
      ref: "User",
    },
    contentID: {
      type: ObjectId,
      ref: "Contents",
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

ContentCommentsSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "_id",
  justOne: true,
  options: { select: "name lastname username" },
});

ContentCommentsSchema.virtual("contents", {
  ref: "Contents",
  localField: "contentID",
  foreignField: "_id",
  justOne: true,
});

module.exports = mongoose.model(
  "ContentComments",
  ContentCommentsSchema,
  "contentComments"
);
