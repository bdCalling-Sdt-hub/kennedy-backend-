const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      required: [true, "please provide email"],
      unique: true,
    },
    image: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },
    address: {
      type: String,
    },

    paymentIntent: {
      type: String,
    },

    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    ],

    isBasicSubscribed: {
      type: Boolean,
      default: false,
    },

    isPremiumSubscribed: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },

    affiliateApplicationStatus: {
      type: String,
      enum: ["notApplied", "pending", "approved", "cancelled"],
      default: "notApplied",
    },
    phone: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    balance: {
      type: Number,
      min: 0,
      default: 0,
    },
    dateOfBirth: {
      type: Date,
      // required: true
    },

    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
    isAffiliate: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifyCode: {
      type: String,
    },

    bookReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],

    isActive: {
      type: Boolean,
      default: true,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
