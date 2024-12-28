const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const forumSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: String },
    audioPost: { type: String },

    language: {
      type: String,
    },

    duration: {
      type: Number,
      //   required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Forum", forumSchema);
