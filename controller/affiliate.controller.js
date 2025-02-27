const Affiliate = require("../model/affiliate.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const getAllAffiliates = async (req, res) => {
  try {
    let affiliates = await Affiliate.find();
    if (!affiliates) {
      res.status(HTTP_STATUS.NOT_FOUND).send(failure("No affiliates found."));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Affiliates fetched successfully", affiliates));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};
const getOneAffiliateById = async (req, res) => {
  try {
    const { id } = req.params;
    let affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No affiliate found."));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Affiliate fetched successfully", affiliate));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAffiliateByCode = async (req, res) => {
  try {
    const { affiliateCode } = req.params;
    let affiliate = await Affiliate.findOne({ affiliateCode });
    if (!affiliate) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No affiliate found."));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Affiliate fetched successfully", affiliate));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const getAffiliateByUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("please login"));
    }
    let affiliates = await Affiliate.find({ user: req.user._id });
    if (!affiliates) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No affiliates found."));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Affiliates fetched successfully", affiliates));
  } catch (error) {
    console.log(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = {
  getAllAffiliates,
  getOneAffiliateById,
  getAffiliateByCode,
  getAffiliateByUser,
};
