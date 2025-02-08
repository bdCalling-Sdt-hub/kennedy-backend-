const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { failure, success } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Review = require("../model/review.model");
const User = require("../model/user.model");
const Book = require("../model/book.model");
const addReviewToBook = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the review", validation[0].msg));
    // }

    if (!req.body.bookId || !req.body.review) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("bookId and review fields are required"));
    }

    if (!req.user || !req.user._id) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Please login"));
    }

    const authId = req.user._id;

    const user = await User.find({ _id: authId });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User was not found"));
    }

    console.log("user", user);

    const userId = req.user._id;

    const { bookId, review } = req.body;

    const bookReview = await Review.findOne({
      book: new mongoose.Types.ObjectId(bookId),
    });

    if (bookReview) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Same user cannot review twice"));
    }

    const book = await Book.findById({ _id: bookId });

    if (!book) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Book with ID was not found"));
    }

    console.log("Creating new review...");
    const newReview = await Review.create({
      book: bookId,
      user: userId,
      review: review,
    });

    if (!newReview) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Review could not be added"));
    }

    book.reviews.push(newReview._id);
    book.save();

    user[0].bookReviews.push(newReview._id);
    user[0].save();

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Review added successfully", newReview));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });

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

    const review = await Review.findOne({ user: userId });
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

const getReviewsByBookId = async (req, res) => {
  try {
    const { bookId } = req.params;

    const review = await Review.find({ book: bookId }).populate({
      path: "user",
      select: "name image",
    });
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
      user: userId,
    });

    if (!reviewExists) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("review does not exist"));
    }

    reviewExists.review = review || reviewExists.review;
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
  addReviewToBook,
  getAllReviews,
  getReviewByUserId,
  getReviewByReviewId,
  getReviewsByBookId,
  editReview,
  deleteReview,
};
