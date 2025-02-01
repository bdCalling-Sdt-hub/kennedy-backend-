const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AboutUs = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("About", AboutUs);
