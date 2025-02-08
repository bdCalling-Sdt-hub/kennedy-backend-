const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new Schema(
  {
    podcastTitle: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },

    podcastVideo: {
      type: String,
    },

    price: {
      type: Number,
      //   required: true,
    },
    stripePriceId: { type: String }, // Stripe Price ID
    duration: {
      type: Number,
      //   required: true,
    },

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

    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

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

module.exports = mongoose.model("Podcast", podcastSchema);
