const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Affiliate = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    affiliateCode: {
      type: String,
      required: true,
    },
    referralLink: {
      type: String,
      required: true,
    },
    totalCommission: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 0,
    },
    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    ],
    stripeAccountId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Affiliate", Affiliate);
