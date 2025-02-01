const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Forum = require("../model/forum.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");

const addPost = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please Login to add post"));
    }
    const { post, audioPost } = req.body;

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

    if (req.files && req.files["audioFile"]) {
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

const getAllConfessions = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    const confessions = await Forum.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Forum.countDocuments(query);

    if (!confessions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confessions not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all confessions", {
        result: confessions,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching confessions", error.message));
  }
};

const getConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Forum.findById(req.params.id);
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching confession", error.message));
  }
};

const deleteConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const confession = await Forum.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting confession", error.message));
  }
};

const approveConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Forum.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully approved confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error approving confession", error.message));
  }
};

const cancelConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Forum.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully rejected confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error rejecting confession", error.message));
  }
};

const disableServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Forum.findByIdAndUpdate(
      req.params.id,
      { isDisabled: true },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully disabled service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error disabling service", error.message));
  }
};

const enableServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Forum.findByIdAndUpdate(
      req.params.id,
      { isDisabled: false },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully enabled service", service));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error enabling service", error.message));
  }
};

module.exports = {
  addPost,
  getAllConfessions,
  getConfessionById,
  updatePostById,
  deleteConfessionById,
  approveConfessionById,
  cancelConfessionById,
};
