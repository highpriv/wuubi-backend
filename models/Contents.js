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
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["standart", "list", "test", "quiz", "poll"],
    },
    slug: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: categoryEnums,
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

ContentSchema.pre("save", async function (next) {
  console.log("asdasd");
  next();
});

const Content = mongoose.model("Content", ContentSchema);
module.exports = Content;
