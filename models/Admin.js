// ? Node modules.
const mongoose = require("mongoose");
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
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: "editor",
      enum: ["editor", "admin"],
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// TODO User Model
module.exports = mongoose.model("Admin", userSchema, "admin");
