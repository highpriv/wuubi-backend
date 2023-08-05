const Message = require("../models/Message");

const saveMessage = async (senderId, receiverId, message) => {
  try {
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message: message,
    });
    await newMessage.save();
    return newMessage;
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
