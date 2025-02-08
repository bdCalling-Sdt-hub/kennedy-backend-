const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Subscription = require("../model/subscriptionPlan.model");

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

module.exports = {
  createSubscription,
  getAllSubscriptionPlans,
  getSubscriptionById,

  updateSubscriptionById,
  deleteSubscriptionById,
};
