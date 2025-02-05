const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Forum = require("../model/forum.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");
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
    console.log("files", req.files);
    console.log("files", req.files["audioFile"]);

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

    const updatedConfession = await Forum.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedConfession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated confession", updatedConfession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Forum.find();

    const count = await Forum.countDocuments();

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

const getPostById = async (req, res) => {
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
    const posts = await Forum.find({ user: req.user._id });

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
  getAllPosts,
  getPostById,
  getPostByUserId,
  updatePostById,
  deletePostById,
};
