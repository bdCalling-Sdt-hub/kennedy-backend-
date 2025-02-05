const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true, enum: ["basic", "premium"] },
    stripePriceId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
