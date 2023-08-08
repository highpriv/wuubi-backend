const Message = require("../models/Message");
const Users = require("../models/User");
const saveMessage = async (senderId, receiverId, message) => {
  try {
    if (senderId === receiverId || !senderId || !receiverId || !message) {
      throw new Error(
        "Sender, receiver and message are required. Also you can not send message to yourself."
      );
    }

    const sender = await Users.findById(senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    const receiver = await Users.findById(receiverId);
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    let newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message: message,
    });
    await newMessage.save();
    
    return {
      ...newMessage._doc,
      senderInfo: {
        username: sender.username,
        avatar: sender.avatar,
        name: sender.name,
        lastname: sender.lastname,
      },
    };
  } catch (error) {
    throw error;
  }
};

const getMessagesBetweenUsers = async (req, res, next) => {
  const receiverId = req.params.receiverId;
  try {
    let messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    })
      .populate("sender", "_id username avatar name lastname")
    
      messages = messages.map((message) => {
        return {
          ...message._doc,
          sender: message.sender._id,
          senderInfo: {
            username: message.sender.username,
            avatar: message.sender.avatar,
            name: message.sender.name,
            lastname: message.sender.lastname,
          },
        };
      });


    return res.json(messages);
  } catch (error) {
    throw error;
  }
};

const getConversations = async (req, res, next) => {
  const userId = req.user._id;

  const findUser = await Users.findById(userId);
  if (!findUser) {
    throw new Error("User not found");
  }

  try {
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: findUser._id }, { receiver: findUser._id }],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", findUser._id] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$lastMessage",
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "sender",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "receiver",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: { $arrayElemAt: ["$user._id", 0] },
            name: { $arrayElemAt: ["$user.name", 0] },
            lastname: { $arrayElemAt: ["$user.lastname", 0] },
            username: { $arrayElemAt: ["$user.username", 0] },
          },
          otherUser: {
            _id: { $arrayElemAt: ["$otherUser._id", 0] },
            name: { $arrayElemAt: ["$otherUser.name", 0] },
            lastname: { $arrayElemAt: ["$otherUser.lastname", 0] },
            username: { $arrayElemAt: ["$otherUser.username", 0] },
          },
          message: 1,
          createdAt: 1,
        },
      },
    ]);

    
    
    return res.json(conversations);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveMessage,
  getMessagesBetweenUsers,
  getConversations,
};
