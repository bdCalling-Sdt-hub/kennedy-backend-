const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookSchema = new Schema(
  {
    bookName: {
      type: String,
      required: true,
    },
    pdfUrls: {
      type: [String],
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },

    bookCoverImage: {
      type: String,
    },

    language: {
      type: String,
    },

    price: {
      type: Number,
      //   required: true,
    },

    duration: {
      type: Number,
      //   required: true,
    },
    stripePriceId: { type: String }, // Stripe Price ID
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Book", bookSchema);
