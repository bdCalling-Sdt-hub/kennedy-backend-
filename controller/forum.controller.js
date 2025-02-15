const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Forum = require("../model/forum.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");
const Comment = require("../model/comment.model");
const fs = require("fs");
const path = require("path");

const addPost = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please Login to add post"));
    }
    const { post } = req.body;

    const newForum = new Forum({
      post: post || "no text added",
      user: req.user._id,
    });

    if (!newForum) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("post could not be added"));
    }

    if (req.files && req.files["audioFile"]) {
      let audioFileName = "";
      if (req.files.audioFile[0]) {
        // Add public/uploads link to the image file

        audioFileName = `public/uploads/audios/${req.files.audioFile[0].filename}`;
        newForum.audioPost = audioFileName;
      }
    }
    await newForum.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("post added successfully", newForum));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding post", err.message));
  }
};

const addCommentToPost = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please Login to add comment"));
    }
    const { comment } = req.body;
    const { postId } = req.params;

    const forum = await Forum.findById(postId);
    if (!forum) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("Post not found"));
    }

    const newComment = new Comment({
      comment: comment,
      forum: postId,
      user: req.user._id,
    });

    if (!newComment) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("comment could not be added"));
    }

    await newComment.save();
    forum.forumComments.push(newComment._id);
    await forum.save();

    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("comment added successfully", newComment));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding comment", err.message));
  }
};

const getAllCommentsOfAForum = async (req, res) => {
  try {
    if (!req.params.forumId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide forum id"));
    }
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ forum: req.params.forumId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "name  image",
      })
      .sort({ createdAt: -1 });

    const count = await Comment.countDocuments({ forum: req.params.forumId });

    if (!comments) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("comments not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all comments", {
        result: comments,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching comments", error.message));
  }
};

const updatePostById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide post id"));
    }

    const post = await Forum.findById(req.params.id);
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("post not found"));
    }
    // console.log("files", req.files);
    // console.log("files", req.files["audioFile"]);

    // remove previous file from storage if new file is added
    if (req.files && req.files["audioFile"]) {
      if (post.audioPost) {
        try {
          fs.unlinkSync(path.join(__dirname, "..", post.audioPost));
        } catch (err) {
          console.error(err);
        }
      }

      let audioFileName = "";
      if (req.files.audioFile[0]) {
        // Add public/uploads link to the image file

        audioFileName = `public/uploads/audios/${req.files.audioFile[0].filename}`;
        post.audioPost = audioFileName;
      }
    }

    await post.save();

    const updatedForum = await Forum.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedForum) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("post not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated forum", updatedForum));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllPosts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const skip = (page - 1) * limit;
    const posts = await Forum.find()
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "name  image",
      })
      .populate({
        path: "forumComments",
        populate: {
          path: "user",
          select: "name  image",
        },
      })
      .sort({ createdAt: -1 });

    const count = await Forum.countDocuments();

    if (!posts) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("posts not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all posts", {
        result: posts,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching posts", error.message));
  }
};

const getPostById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide post id"));
    }
    const post = await Forum.findById(req.params.id)
      .populate("user")
      .populate({
        path: "forumComments",
        populate: {
          path: "user",
          select: "name  image",
        },
      });
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("post not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received post", post));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching post", error.message));
  }
};

const getPostByUserId = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please Login to get post"));
    }
    const posts = await Forum.find({ user: req.user._id }).populate("user");

    const count = await Forum.countDocuments({ user: req.user._id });

    if (!posts) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("posts not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all posts", {
        result: posts,
        count,
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching posts", error.message));
  }
};

const deletePostById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide post id"));
    }
    const post = await Forum.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("post not found"));
    }

    if (post.audioPost) {
      try {
        fs.unlinkSync(path.join(__dirname, "..", post.audioPost));
      } catch (err) {
        console.error(err);
      }
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted post", post));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting post", error.message));
  }
};

module.exports = {
  addPost,
  addCommentToForum: addCommentToPost,
  getAllPosts,
  getAllCommentsOfAForum,
  getPostById,
  getPostByUserId,
  updatePostById,
  deletePostById,
};
