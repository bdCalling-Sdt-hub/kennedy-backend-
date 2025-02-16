const mongoose = require("mongoose");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Subscription = require("../model/subscription.model");
const UserModel = require("../model/user.model");

const createSubscription = async (req, res) => {
  try {
    const { name, price, duration, features } = req.body;

    const newSubscription = new Subscription({
      name,
      price,
      duration,
      features,
    });

    if (!newSubscription) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("subscription could not be added"));
    }

    await newSubscription.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("subscription added successfully", newSubscription));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding subscription", err.message));
  }
};

const updateSubscriptionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide subscription id"));
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedSubscription) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("subscription not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated subscription", updatedSubscription));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllSubscriptionPlans = async (req, res) => {
  try {
    const subscriptions = await Subscription.find();

    const count = await Subscription.countDocuments();

    if (!subscriptions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("subscriptions not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all subscriptions", {
        result: subscriptions,
        count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching subscriptions", error.message));
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide subscription id"));
    }
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("subscription not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received subscription", subscription));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching subscription", error.message));
  }
};

const deleteSubscriptionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide subscription id"));
    }
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("subscription not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted subscription", subscription));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting subscription", error.message));
  }
};

const getSubscriptionTimeLeftOfAUser = async (req, res) => {
  try {
    // Fetch the user to check if they exist
    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User does not exist"));
    }

    if (!user.subscriptions || !user.subscriptions.length) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("User has no subscriptions"));
    }

    // Fetch the latest subscription of the user
    const latestSubscriptionId =
      user.subscriptions[user.subscriptions.length - 1];
    const latestSubscription = await Subscription.findById(
      new mongoose.Types.ObjectId(latestSubscriptionId)
    );

    if (!latestSubscription) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Subscription does not exist"));
    }

    const subscriptionTimeLeft = latestSubscription.endDate - Date.now();

    const daysLeft = Math.ceil(subscriptionTimeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(subscriptionTimeLeft / (1000 * 60 * 60));
    const monthsLeft = Math.ceil(daysLeft / 30);
    const yearsLeft = monthsLeft / 12;

    // Return the time left for the user to subscribe
    res.status(HTTP_STATUS.OK).send({
      message: "Time left for subscription",
      timeLeft: subscriptionTimeLeft,
      daysLeft,
      hoursLeft,
      monthsLeft,
      yearsLeft,
    });
  } catch (error) {
    console.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptionPlans,
  getSubscriptionById,
  getSubscriptionTimeLeftOfAUser,
  updateSubscriptionById,
  deleteSubscriptionById,
};
