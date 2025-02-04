const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Help = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Help", Help);
