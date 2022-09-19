const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    username: { type: String, default: null },
    email: { type: String, default: "", unique: true },
    business: { type: Array, default: null },
  },
  { collection: "Business" }
);

module.exports = mongoose.model("Business", Schema);
