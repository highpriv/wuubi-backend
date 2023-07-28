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
    id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    title: {
      type: String,
    },
    type: {
      type: String,

      enum: ["standart", "list", "test", "quiz", "poll"],
    },
    listContent: [
      {
        type: Object,
      },
    ],
    pollContent: [
      {
        type: Object,
      },
    ],
    quizContent: [
      {
        type: Object,
      },
    ],
    testContent: [
      {
        type: Object,
      },
    ],
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
    viewCount: {
      type: Number,
      default: 0,
    },

    dailyViewCount: {
      type: Number,
      default: 0,
    },

    uniqueViewCount: [
      {
        type: String,
      },
    ],

    uniqueDailyViewCount: [
      {
        type: String,
      },
    ],

    userID: {
      type: ObjectId,
      ref: "User",
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
