// ? Node modules.
const { mongoose, ObjectId, Schema } = require("mongoose");
const bcrypt = require("bcryptjs");

AutoID = mongoose.Types.ObjectId;

// ? Schema.
const userSchema = new mongoose.Schema(
  {
    id: AutoID,
    name: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    phone: String,
    birthday: Date,
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    registered: {
      type: Date,
      required: false,
      default: Date.now,
    },
    status: {
      type: String,
      required: false,
      enum: ["Active", "Pending", "Banned", "Delete"],
      default: "Pending",
    },
    permissions: {
      type: Array,
      required: false,
      default: [],
    },
    achievement: [
      {
        type: ObjectId,
        ref: "Achievements",
      },
    ], 
    joinedGroups: [
      {
        type: ObjectId,
        ref: "Groups",
      }
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

/* userSchema.virtual("contents", {
  ref: "Contents",
  localField: "_id",
  foreignField: "userID",
});

userSchema.virtual("profileContents", {
    ref: "ProfileContents",
    localField: "_id",
    foreignField: "userID",
  }); */

userSchema.virtual("groups", {
  ref: "Groups",
  localField: "joinedGroups",
  foreignField: "members",
});

userSchema.virtual("achievements", {
  ref: "Achievements",
  localField: "achievement",
  foreignField: "_id",
});

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// TODO User Model
module.exports = mongoose.model("User", userSchema, "user");
