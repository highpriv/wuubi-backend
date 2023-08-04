// ? Main Modules
require("dotenv").config();

const createError = require("http-errors");
const http = require("http");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");

const cors = require("./utils/cors");
const rateLimit = require("./utils/rate-limit");

// ? Express application.
const app = express();

mongoose.connect(process.env.MongoDBURI, {
  useNewUrlParser: true,
});

// ? Socket

const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

const activeSockets = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("identifyUser", (userId) => {
    activeSockets.set(userId, socket);
  });

  socket.on("newMessage", (data) => {
    const { content, recipientUserId } = data;
    const senderUserId = getUserIdFromSocket(socket);

    if (activeSockets.has(recipientUserId)) {
      const recipientSocket = activeSockets.get(recipientUserId);
      recipientSocket.emit("newMessage", { content, senderUserId, messageId });
    }

    socket.on("disconnect", () => {
      console.log("A user disconnected");
      activeSockets.forEach((value, key) => {
        if (value === socket) {
          activeSockets.delete(key);
        }
      });
    });

    function getUserIdFromSocket(socket) {
      // get userID from socket object token
    }
  });
});

require("./cron-jobs/resetDailyView");

app.use(cors);
app.set("view engine", "ejs"); // ? Template engine tipi.

app.use((req, res, next) => {
  res.locals.errors = [];
  next();
});

app.use(rateLimit);
app.use(helmet(require("./data/helmet.json")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/", require("./routes"));

app.use(function (req, res, next) {
  next(createError(404, "Not Found " + req.originalUrl));
});

app.listen(3000, () => console.log("Server is running"));

module.exports = app;
