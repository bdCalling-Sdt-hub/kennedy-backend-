const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const confessionSchema = new Schema(
  {
    title: {
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

    confessionAudioUrl: {
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
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Confession", confessionSchema);
