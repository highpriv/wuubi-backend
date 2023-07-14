const { mongoose, ObjectId, Schema } = require("mongoose");
const Settings = require("./Settings");

let categoryEnums = [];

async function fetchCategoryEnums() {
  try {
    const settings = await Settings.findOne().exec();
    categoryEnums = settings.contentCategories.map((category) => category.slug);
  } catch (error) {
    throw error;
  }
}

fetchCategoryEnums();

const ContentSchema = new Schema(
  {
    id: AutoID,
    title: {
      type: String,
    },
    type: {
      type: String,

      enum: ["standart", "list", "test", "quiz", "poll"],
    },
    slug: {
      type: String,
    },
    category: {
      type: String,

      enum: categoryEnums,
    },
    content: {
      type: String,
    },
    summary: {
      type: String,
    },
    thumbnail: {
      type: String,
    },

    userID: {
      type: ObjectId,
    },
    status: {
      type: String,
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

ContentSchema.pre("validate", async function (next) {
  if (this.status === "Draft") {
    next();
  } else {
  }
});

ContentSchema.virtual("user", {
  ref: "User",
  localField: "userID",
  foreignField: "id",
  justOne: true,
});
const Content = mongoose.model("Content", ContentSchema);
module.exports = Content;
