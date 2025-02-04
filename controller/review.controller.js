const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { failure, success } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Review = require("../model/review.model");
const UserModel = require("../model/user.model");
const User = require("../model/user.model");
const addReviewToDoctor = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the review", validation[0].msg));
    // }

    const authId = req.params.id;

    const userAuth = await UserModel.find({ _id: authId });

    if (!userAuth) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }

    const userId = userAuth[0].user._id;

    const { doctorId, review, rating } = req.body;

    const doctorReview = await Review.findOne({ doctorId });

    if (doctorReview) {
      const reviewExists = doctorReview.reviews.filter((element) => {
        if (String(element.user) === String(userId)) {
          return true;
        }
      });
      console.log("reviewExists", reviewExists);
      // checking if review already exists
      if (reviewExists.length) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .send(failure("Same user cannot review twice"));
      }
    }

    const doctor = await User.findById({ _id: doctorId });

    if (!doctor) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Doctor with ID was not found"));
    }

    if (!doctorReview) {
      console.log("Creating new review...");
      const newReview = await Review.create({
        doctorId: doctorId,
        reviews: [{ user: userId, review: review, rating: rating }],
      });

      if (newReview) {
        return res
          .status(HTTP_STATUS.CREATED)
          .send(success("Added review successfully", newReview));
      }
    }

    doctorReview.reviews.push({
      user: userId,
      review: review,
      rating: rating,
    });

    const total = doctorReview.reviews.reduce((acc, curr) => {
      return acc + Number(curr.rating);
    }, 0);

    const average = total / doctorReview.reviews.length;

    doctorReview.averageRating = average;

    await doctorReview.save();
    doctorReview.__v = undefined;
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Review added successfully", doctorReview));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const addReviewToWebsite = async (req, res) => {
  try {
    const { review, rating, userId } = req.body;

    if (!review || !rating || !userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("All fields are required"));
    }

    const reviewExists = await Review.findOne({ userId });

    if (reviewExists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Same user cannot review twice"));
    }

    const user = await UserModel.findById({ _id: userId });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User with ID was not found"));
    }

    const newReview = await Review.create({
      userId,
      review,
      rating,
    });
    if (newReview) {
      return res
        .status(HTTP_STATUS.CREATED)
        .send(success("Added review successfully", newReview));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAllWebsiteReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("userId")
      .sort({ createdAt: -1 });

    if (reviews) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("all reviews fetched successfully", reviews));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("reviews could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getReviewByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be fetched"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review fetched successfully", review));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getReviewByUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("All fields are required"));
    }

    const review = await Review.findOne({ userId });
    if (!review) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be fetched"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review fetched successfully", review));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const editReview = async (req, res) => {
  try {
    const { review, rating, userId } = req.body;
    const { reviewId } = req.params;

    if (!reviewId || !userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("reviewId and userId are required"));
    }

    const reviewExists = await Review.findOne({
      _id: reviewId,
      userId: userId,
    });

    if (!reviewExists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review does not exist"));
    }

    reviewExists.review = review || reviewExists.review;
    reviewExists.rating = rating || reviewExists.rating;
    await reviewExists.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review updated successfully", reviewExists));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!reviewId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("reviewId is required"));
    }
    const deletedReview = await Review.findByIdAndDelete({ _id: reviewId });
    if (!deletedReview) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review could not be deleted"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("review deleted successfully", deletedReview));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = {
  addReviewToDoctor,
  addReviewToWebsite,
  getAllWebsiteReviews,
  getReviewByUserId,
  getReviewByReviewId,
  editReview,
  deleteReview,
};
