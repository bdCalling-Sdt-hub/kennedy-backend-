const AboutUs = require("../model/aboutUs.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const addAboutUs = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Content is required for About Us."));
    }

    let about = await AboutUs.findOne();
    if (!about) {
      about = await AboutUs.create({
        content,
      });

      await about.save();

      return res
        .status(HTTP_STATUS.OK)
        .send(success("About Us added successfully", about));
    }
    about.content = content;
    await about.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("About Us updated successfully", about));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAboutUs = async (req, res) => {
  try {
    const aboutUs = await AboutUs.findOne();

    if (!aboutUs) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No about us found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("about us fetched successfully", aboutUs));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = { addAboutUs, getAboutUs };
