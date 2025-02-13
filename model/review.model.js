const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewRatingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
    },
    rating: {
      type: Number,
      // required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", ReviewRatingSchema);
