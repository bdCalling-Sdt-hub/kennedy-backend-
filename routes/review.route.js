const express = require("express");
const routes = express();

const {
  addReviewToBook,
  editReview,
  getAllReviews,
  getReviewByReviewId,
  getReviewByUserId,
  getReviewsByBookId,
  deleteReview,
} = require("../controller/review.controller");
// const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { isAuthorizedUser } = require("../middleware/authValidationJWT");
// const reviewValidator = require("../middleware/reviewValidation")

routes.get("/all-reviews", getAllReviews);
routes.get("/review-by-user", getReviewByUserId);
routes.get("/get-one-review/:reviewId", getReviewByReviewId);
routes.get("/get-reviews-by-book/:bookId", getReviewsByBookId);

routes.post(
  "/add-review-to-book",
  //   isAuthorizedUser,
  //   reviewValidator.addReview,
  isAuthorizedUser,
  addReviewToBook
);

routes.delete(
  "/delete-review/:reviewId",
  //   isAuthorizedUser,
  //   userValidator.delete,
  deleteReview
);

routes.put(
  "/update-review/:reviewId",
  //   isAuthorizedUser,
  //   reviewValidator.updateReview,
  editReview
);

module.exports = routes;
