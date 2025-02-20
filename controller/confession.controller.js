const fs = require("fs");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");
const Confession = require("../model/confession.model");
const User = require("../model/user.model");
const Nootification = require("../model/notification.model");
const { emailWithNodemailerGmail } = require("../config/email.config");

const addConfession = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("User not logged in"));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const { title, authorName, description } = req.body;

    const newConfession = new Confession({
      user: req.user._id,
      title,
      authorName,
      description,
    });

    if (!newConfession) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("confession could not be added"));
    }

    user.confessionsUploaded.push(newConfession._id);
    await user.save();

    console.log("req.files", req.files);
    console.log("req.filesaudioFile", req.files["audioFile"]);

    if (req.files && req.files["audioFile"]) {
      let audioFileName = "";
      if (req.files.audioFile[0]) {
        // Add public/uploads link to the image file

        audioFileName = `public/uploads/audios/${req.files.audioFile[0].filename}`;
        newConfession.confessionAudioUrl = audioFileName;
      }
    }
    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        videoFileName = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        newConfession.confessionVideoUrl = videoFileName;
      }
    }
    await newConfession.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("confession added successfully", newConfession));
  } catch (err) {
    console;
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("error adding confession", err.message));
  }
};

const updateConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }

    if (req.files && req.files["audioFile"]) {
      let audioFileName = "";
      if (req.files.audioFile[0]) {
        const audioFilePath = `public/uploads/audios/${req.files.audioFile[0].filename}`;
        if (confession.confessionAudioUrl) {
          const filePath = confession.confessionAudioUrl.split("/").pop();
          const oldFilePath = `public/uploads/audios/${filePath}`;
          try {
            await fs.promises.unlink(oldFilePath);
          } catch (error) {
            console.log("error deleting old file", error);
          }
        }
        audioFileName = audioFilePath;
        confession.confessionAudioUrl = audioFilePath;
      }
    }

    if (req.files && req.files["videoFile"]) {
      let videoFileName = "";
      if (req.files.videoFile[0]) {
        const videoFilePath = `public/uploads/videos/${req.files.videoFile[0].filename}`;
        if (confession.confessionVideoUrl) {
          const filePath = confession.confessionVideoUrl.split("/").pop();
          const oldFilePath = `public/uploads/videos/${filePath}`;
          try {
            await fs.promises.unlink(oldFilePath);
          } catch (error) {
            console.log("error deleting old file", error);
          }
        }
        videoFileName = videoFilePath;
        confession.confessionVideoUrl = videoFilePath;
      }
    }

    await confession.save();

    const updatedConfession = await Confession.findByIdAndUpdate(
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
    const status = req.query.status;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query = { isDeleted: false };
    if (status) {
      query.status = status;
    }

    const confessions = await Confession.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Confession.countDocuments(query);

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

const getConfessionByUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("please log in"));
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("user not found"));
    }
    const confessions = await Confession.find({ user: req.user._id });
    if (!confessions) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confessions not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received confessions", confessions));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching confessions", error.message));
  }
};

const deleteConfessionById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const confession = await Confession.findByIdAndRemove(req.params.id);
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }

    const rootPath = process.cwd();
    if (
      confession.confessionVideoUrl &&
      fs.existsSync(`${rootPath}/${confession.confessionVideoUrl}`)
    ) {
      await fs.promises.unlink(`${rootPath}/${confession.confessionVideoUrl}`);
    }
    if (
      confession.confessionAudioUrl &&
      fs.existsSync(`${rootPath}/${confession.confessionAudioUrl}`)
    ) {
      await fs.promises.unlink(`${rootPath}/${confession.confessionAudioUrl}`);
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

const approveConfession = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }

    confession.status = "approved";
    await confession.save();

    const user = await User.findById(confession.user);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const notification = new Nootification({
      uploader: user._id,
      admin: req.user._id,
      confession: confession._id,
      status: "approved",
      message: `Your confession "${confession.title}" has been approved`,
      type: "confession",
    });
    await notification.save();

    const emailData = {
      email: user.email,
      subject: "Confession approved",
      html: `
        <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
          <h6 style="font-size: 16px; color: #333;">Hello, ${
            user.name || "User"
          }</h6>
          <p style="font-size: 14px; color: #555;">Your confession "${
            confession.title
          }" has been approved.</p>
          <p style="font-size: 14px; color: #555;">Thank you for sharing your confession.</p>
        </div>
      `,
    };
    await emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully approved confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error approving confession", error.message));
  }
};

const cancelConfession = async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide confession id"));
    }
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("confession not found"));
    }

    confession.status = "cancelled";
    await confession.save();

    const user = await User.findById(confession.user);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    const notification = new Nootification({
      uploader: user._id,
      admin: req.user._id,
      confession: confession._id,
      status: "cancelled",
      message: `Your confession "${confession.title}" has been cancelled`,
      type: "confession",
    });
    await notification.save();

    const emailData = {
      email: user.email,
      subject: "Confession cancelled",
      html: `
        <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
          <h6 style="font-size: 16px; color: #333;">Hello, ${
            user.name || "User"
          }</h6>
          <p style="font-size: 14px; color: #555;">Your confession "${
            confession.title
          }" has been cancelled.</p>
          <p style="font-size: 14px; color: #555;">Thank you for sharing your confession.</p>
        </div>
      `,
    };
    await emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully rejected confession", confession));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error rejecting confession", error.message));
  }
};

module.exports = {
  addConfession,
  getAllConfessions,
  getConfessionById,
  getConfessionByUser,
  updateConfessionById,
  deleteConfessionById,
  approveConfession,
  cancelConfession,
};
