const express = require("express");
const router = express.Router();
const Middlewares = require("../middlewares");
const { messageController } = require("../controllers");

router.get(
    "/conversations",
    Middlewares.authenticateMiddleware,
    messageController.getConversations
  );

router.get(
  "/:receiverId",
  Middlewares.authenticateMiddleware,
  messageController.getMessagesBetweenUsers
);



module.exports = router;
