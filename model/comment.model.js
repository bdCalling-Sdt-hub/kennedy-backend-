const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    comment: {
      type: String,
      trim: true,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    confession: {
      type: Schema.Types.ObjectId,
      ref: "Confession",
      //   required: true,
    },

    podcast: {
      type: Schema.Types.ObjectId,
      ref: "Podcast",
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
