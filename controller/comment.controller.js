const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { failure, success } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Comment = require("../model/comment.model");
const User = require("../model/user.model");
const Confession = require("../model/confession.model");
const Podcast = require("../model/podcast.model");
const addCommentToConfession = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the review", validation[0].msg));
    // }

    if (!req.body.confessionId || !req.body.comment) {
      return res.send(failure("confessionId and comment fields are required"));
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

    const userId = req.user._id;

    const { confessionId, comment } = req.body;

    const confession = await Confession.findById({ _id: confessionId });

    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }

    console.log("Creating new comment...");
    const newComment = await Comment.create({
      confession: confessionId,
      user: userId,
      comment,
    });

    if (!newComment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment could not be added"));
    }

    confession.comments.push(newComment._id);
    confession.save();

    user[0].confessionComments.push(newComment._id);
    user[0].save();

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("comment added successfully", newComment));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAllConfessionComments = async (req, res) => {
  try {
    const confessionComments = await Comment.find({
      confession: { $exists: true },
    }).sort({
      createdAt: -1,
    });

    if (confessionComments) {
      return res
        .status(HTTP_STATUS.OK)
        .send(
          success(
            "all confession comments fetched successfully",
            confessionComments
          )
        );
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("confession comments could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getAllConfessionCommentsByConfessionId = async (req, res) => {
  try {
    const { confessionId } = req.params;
    const confessionComments = await Comment.find({
      confession: confessionId,
    })
      .populate("user", "name image")
      .sort({
        createdAt: -1,
      });

    if (confessionComments) {
      return res
        .status(HTTP_STATUS.OK)
        .send(
          success(
            "all confession comments fetched successfully",
            confessionComments
          )
        );
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("confession comments could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const deleteConfessionComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("commentId and userId are required"));
    }

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment does not exist"));
    }

    if (comment.user.toString() !== userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("You are not authorized to delete this comment"));
    }

    const confession = await Confession.findById(comment.confession);

    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession does not exist"));
    }

    const index = confession.comments.indexOf(commentId);
    if (index > -1) {
      confession.comments.splice(index, 1);
    }

    const user = await User.findById(comment.user);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("user does not exist"));
    }

    const userIndex = user.confessionComments.indexOf(commentId);
    if (userIndex > -1) {
      user.confessionComments.splice(userIndex, 1);
    }

    const deletedComment = await Comment.deleteOne({ _id: commentId });
    await confession.save();
    await user.save();

    if (!deletedComment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment could not be deleted"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("comment deleted successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const addCommentToPodcast = async (req, res) => {
  try {
    // const validation = validationResult(req).array();
    // // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the review", validation[0].msg));
    // }

    if (!req.body.podcastId || !req.body.comment) {
      return res.send(failure("podcastId and comment fields are required"));
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

    const userId = req.user._id;

    const { podcastId, comment } = req.body;

    const podcast = await Podcast.findById({ _id: podcastId });

    if (!podcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast not found"));
    }

    console.log("Creating new comment...");
    const newComment = await Comment.create({
      podcast: podcastId,
      user: userId,
      comment,
    });

    if (!newComment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment could not be added"));
    }

    podcast.comments.push(newComment._id);
    podcast.save();

    user[0].podcastComments.push(newComment._id);
    user[0].save();

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("comment added successfully", newComment));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAllPodcastComments = async (req, res) => {
  try {
    const podcastComments = await Comment.find({
      podcast: { $exists: true },
    }).sort({
      createdAt: -1,
    });

    if (podcastComments) {
      return res
        .status(HTTP_STATUS.OK)
        .send(
          success("all podcast comments fetched successfully", podcastComments)
        );
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("podcast comments could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const getAllPodcastCommentsByPodcastId = async (req, res) => {
  try {
    const { podcastId } = req.params;
    const podcastComments = await Comment.find({
      podcast: podcastId,
    })
      .populate("user", "name image")
      .sort({
        createdAt: -1,
      });

    if (podcastComments) {
      return res
        .status(HTTP_STATUS.OK)
        .send(
          success("all podcast comments fetched successfully", podcastComments)
        );
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(failure("podcast comments could not be fetched"));
  } catch (error) {
    console.log(error);
    return res.status(400).send(`internal server error`);
  }
};

const deletePodcastComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("commentId and userId are required"));
    }

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment does not exist"));
    }

    if (comment.user.toString() !== userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("You are not authorized to delete this comment"));
    }

    const podcast = await Podcast.findById(comment.podcast);

    if (!podcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast does not exist"));
    }

    const index = podcast.comments.indexOf(commentId);
    if (index > -1) {
      podcast.comments.splice(index, 1);
    }

    const user = await User.findById(comment.user);

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("user does not exist"));
    }

    const userIndex = user.podcastComments.indexOf(commentId);
    if (userIndex > -1) {
      user.podcastComments.splice(userIndex, 1);
    }

    const deletedComment = await Comment.deleteOne({ _id: commentId });
    await podcast.save();
    await user.save();

    if (!deletedComment) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comment could not be deleted"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("comment deleted successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = {
  addCommentToConfession,
  getAllConfessionComments,
  getAllConfessionCommentsByConfessionId,
  deleteConfessionComment,

  addCommentToPodcast,
  getAllPodcastComments,
  getAllPodcastCommentsByPodcastId,
  deletePodcastComment,
};
