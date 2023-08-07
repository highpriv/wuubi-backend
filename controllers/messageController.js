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

    const newMessage = new Message({
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

const getMessagesBetweenUsers = async (user1Id, user2Id) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1Id, receiver: user2Id },
        { sender: user2Id, receiver: user1Id },
      ],
    }).sort({ createdAt: 1 });
    return messages;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveMessage,
  getMessagesBetweenUsers,
};
