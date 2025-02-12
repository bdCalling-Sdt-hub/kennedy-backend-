const { success, failure } = require("../utilities/common");
const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const UserModel = require("../model/user.model");
const Notification = require("../model/notification.model");

const getAllUsers = async (req, res) => {
  try {
    const { role, isAffiliate } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (typeof isAffiliate !== "undefined") {
      query.isAffiliate = isAffiliate === "true";
    }

    const users = await UserModel.find(query).select("-__v");

    if (users.length) {
      return res.status(HTTP_STATUS.OK).send(
        success("Successfully received all users", {
          result: users,
        })
      );
    } else {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Users not found"));
    }
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getUsersAppliedForAffiliate = async (req, res) => {
  try {
    const users = await UserModel.find({
      affiliateApplicationStatus: "pending",
    }).select("-__v");

    if (users.length) {
      return res.status(HTTP_STATUS.OK).send(
        success("users applied for affiliate", {
          result: users,
        })
      );
    } else {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Users not found"));
    }
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getOneUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.find({ _id: id });
    if (!user.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully got the user", user[0]));
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`internal server error`);
  }
};

const profile = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User not logged in"));
    }
    const user = await UserModel.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully got profile", user));
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send(`internal server error`);
  }
};

const updateUserById = async (req, res) => {
  try {
    // const validation = validationResult(req).array();

    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to update data", validation[0].msg));
    // }

    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "please provide id parameter" });
    }

    // const updatedUserData = req.body;
    const { name, phone } = req.body;

    // const user = await UserModel.findById(req.user._id);
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }

    console.log("files", req.files);
    console.log("files", req.files["image"]);

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file

        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        user.image = imageFileName;
      }
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    // const updatedUser = await UserModel.findByIdAndUpdate(
    //   req.params.id,
    //   updatedUserData,
    //   // Returns the updated document
    //   { new: true }
    // );

    // if (!updatedUser) {
    //   return res
    //     .status(HTTP_STATUS.NOT_FOUND)
    //     .send({ message: "User not found" });
    // }
    // console.log(updatedUser);
    // updatedUser.__v = undefined;
    return res
      .status(HTTP_STATUS.ACCEPTED)
      .send(success("User data updated successfully", user));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send({ message: "INTERNAL SERVER ERROR" });
  }
};

const updateProfileByUser = async (req, res) => {
  try {
    const { name, phone, image } = req.body;
    console.log("body", req.body);
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }

    console.log("files", req.files);
    console.log("files", req.files["image"]);

    if (req.files && req.files["image"]) {
      let imageFileName = "";
      if (req.files.image[0]) {
        // Add public/uploads link to the image file

        imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
        user.image = imageFileName;
      }
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      // Returns the updated document
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ message: "User not found" });
    }
    console.log(updatedUser);
    updatedUser.__v = undefined;
    await user.save();
    return res
      .status(HTTP_STATUS.ACCEPTED)
      .send(success("Profile updated successfully", user));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send({ message: "INTERNAL SERVER ERROR" });
  }
};

// Controller to get notifications by userId
const getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide userId"));
    }

    // Fetch the user to check if they exist
    const user = await UserModel.findById(userId).populate("notifications");

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }
    // Return the user's notifications
    res.status(HTTP_STATUS.OK).send({
      message: "Notifications fetched successfully",
      notifications: user.notifications,
    });
    // .json({
    //   message: "Notifications fetched successfully",
    //   notifications: user.notifications,
    // });
  } catch (error) {
    console.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

// Controller to get notifications
const getAllNotifications = async (req, res) => {
  try {
    // Fetch the user to check if they exist
    const notifications = await Notification.find();

    if (!notifications) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("notification does not exist"));
    }

    res.status(HTTP_STATUS.OK).send({
      message: "All Notifications fetched successfully",
      notifications: notifications,
    });
  } catch (error) {
    console.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  getOneUserById,
  getUsersAppliedForAffiliate,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  profile,
  updateProfileByUser,
};
