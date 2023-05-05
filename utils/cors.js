// ? Exports.
const cors = require("cors");

// ? Constant.
const WHITE_LIST = require("../data/cors.json");

module.exports = cors({
  origin: function (origin, callback) {
    if (!origin || origin == "null") return callback(null, true);
    if (WHITE_LIST.indexOf(origin) === -1) {
      return callback(
        new Error(
          "The CORS policy for this site does not allow access from the specified Origin. Your Origin : " +
            origin
        ),
        false
      );
    }

    return callback(null, true);
  },
  credentials: true,
});
