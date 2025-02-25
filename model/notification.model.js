const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // The user applying for the doctor role
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // The admin managing the application
    },
    confession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Confession",
    },
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
    message: {
      type: String,
      required: true, // Message about the notification
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["confession", "forum", "others"],
      default: "others",
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
