const mongoose = require("mongoose");

var Schema = new mongoose.Schema(
  {
    name: { type: String, default: "user" },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "Roles" }
);

module.exports = mongoose.model("Roles", Schema);
