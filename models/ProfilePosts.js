const { mongoose, ObjectId, Schema } = require("mongoose");
AutoID = mongoose.Types.ObjectId;

const ProfilePostSchema = new Schema(
  {
    content: {
      type: String,
    },
    userID: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    images: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Types.ObjectId,
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


ProfilePostSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "_id",
});
  


module.exports = mongoose.model("ProfilePosts", ProfilePostSchema, "profilePosts");
