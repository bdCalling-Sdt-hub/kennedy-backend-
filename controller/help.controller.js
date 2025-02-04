const Help = require("../model/help.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const addHelp = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Content is required for Help."));
    }

    let help = await Help.findOne();
    if (!help) {
      help = await Help.create({
        content,
      });

      await help.save();

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Help added successfully", help));
    }
    help.content = content;
    await help.save();

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Help updated successfully", help));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getHelp = async (req, res) => {
  try {
    const helps = await Help.findOne();

    if (!helps) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("No help found."));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("help fetched successfully", helps));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = { addHelp, getHelp };
