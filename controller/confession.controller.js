const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Confession = require("../model/confession.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");

const addConfession = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User not logged in"));
    }

    const { title, authorName, description } = req.body;

    const newConfession = new Confession({
      title,
      authorName,
      description,
    });

    if (!newConfession) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("podcast could not be added"));
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the image file

        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        newConfession.podcastVideo = videoFileName;
      }
    }
    await newConfession.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("podcast added successfully", newConfession));
  } catch (err) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding podcast", err.message));
  }
};

const updatePodcastById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide podcast id"));
    }
    const podcast = await Confession.findById(req.params.id);
    if (!podcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast not found"));
    }
    console.log("files", req.files);
    console.log("files", req.files["videoFile"]);

    if (req.files && req.files["videoFile"]) {
      let imageFileName = "";
      if (req.files.videoFile[0]) {
        // Add public/uploads link to the image file

        imageFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        podcast.podcastVideo = imageFileName;
      }
    }

    await podcast.save();

    const updatedPodcast = await Confession.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedPodcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated podcast", updatedPodcast));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllPodcasts = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    const podcasts = await Confession.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Confession.countDocuments(query);

    if (!podcasts) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcasts not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all podcasts", {
        result: podcasts,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching podcasts", error.message));
  }
};

const getPodcastById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide podcast id"));
    }
    const podcast = await Confession.findById(req.params.id);
    if (!podcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received podcast", podcast));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching podcast", error.message));
  }
};

const deletePodcastById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const podcast = await Confession.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!podcast) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("podcast not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted podcast", podcast));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting podcast", error.message));
  }
};

const disableServiceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Confession.findByIdAndUpdate(
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
    const service = await Confession.findByIdAndUpdate(
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
  addPodcast: addConfession,
  getAllPodcasts,
  getPodcastById,
  updatePodcastById,
  deletePodcastById,
};
