// ? Main Modules
require("dotenv").config();

const createError = require("http-errors");
const http = require("http");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");
const { saveMessage } = require("./controllers/messageController");
const socketIO = require("socket.io");

const cors = require("./utils/cors");
const rateLimit = require("./utils/rate-limit");

// ? Express application.
const app = express();

// ? Create a server using http module for socket

const server = http.createServer(app);

mongoose.connect(process.env.MongoDBURI, {
  useNewUrlParser: true,
});

require("./cron-jobs/resetDailyView");

app.use(cors);
app.set("view engine", "ejs"); // ? Template engine tipi.

app.use((req, res, next) => {
  res.locals.errors = [];
  next();
});

// Start socket.io server
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("New client connected!");

  socket.on("privateMessage", async ({ senderId, receiverId, message }) => {
    try {
      const newMessage = await saveMessage(senderId, receiverId, message);

      io.to(senderId).emit("privateMessage", newMessage);
      io.to(receiverId).emit("privateMessage", newMessage);
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected!");
  });
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

server.listen(3000, () => console.log("Server is running"));

module.exports = app;
