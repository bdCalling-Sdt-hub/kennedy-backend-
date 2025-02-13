const Chat = require("../model/chat.model");
const User = require("../model/user.model");
const { success, failure } = require("../utilities/common");
const HTTP_STATUS = require("../constants/statusCodes");

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const loggedInUserId = req.params.id;
    if (!userId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide user id you want to connect with"));
    }
    let isChat = await Chat.find({
      //   isGroupChat: false,
      $and: [
        // { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: loggedInUserId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    if (isChat.length)
      return res.status(HTTP_STATUS.OK).send(success("Chat found", isChat[0]));

    const chatData = {
      chatName: "sender",
      //   users: [req.user._id, userId],
      users: [loggedInUserId, userId],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );
    res.status(HTTP_STATUS.OK).send(success("Chat created", fullChat));
  } catch (error) {
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const fetchChats = async (req, res) => {
  try {
    const loggedInUserId = req.params.id;
    // Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    // Chat.find({ users: { $elemMatch: { $eq: loggedInUserId } } })
    //   .populate("users", "-password")
    //   // .populate("groupAdmin", "-password")
    //   .populate("latestMessage")
    //   .sort({ updatedAt: -1 })
    //   .then(async (results) => {
    //     results = await User.populate(results, {
    //       path: "latestMessage.sender",
    //       select: "name pic email",
    //     });
    //     res.status(HTTP_STATUS.OK).send(results);
    //   });
    let isChat = await Chat.find({
      users: { $elemMatch: { $eq: loggedInUserId } },
    })
      .populate("users", "-password")
      // .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    if (isChat.length)
      return res
        .status(HTTP_STATUS.OK)
        .send(success("All Chats found", isChat));
    return res.status(HTTP_STATUS.OK).send(failure("No chats found"));
  } catch (error) {
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

module.exports = { accessChat, fetchChats };
