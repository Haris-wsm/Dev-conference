const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    user_id: { type: String, default: "" },
    name: { type: String, default: "", required: true },
    uid: { type: String, default: "", unique: true },
    last_session: { type: Date, default: null },
    key: { type: String, default: "" },
    vender: { type: String, default: "jitsi" },
    setting: { type: Object, default: null },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "Rooms" }
);

module.exports = mongoose.model("Rooms", Schema);
