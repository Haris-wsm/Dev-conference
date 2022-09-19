const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    user_id: { type: String, default: "" },
    meeting_id: { type: String, default: "" },
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    uid: { type: String, default: "" },
    date: { type: String, default: "" },
    end_date: { type: String, default: "" },
    start_time: { type: String, default: "" },
    end_time: { type: String, default: "" },
    setting: { type: Object, default: null },
    member: { type: Array, default: null },
    attendee: { type: String, default: "1" },
    file_id: { type: Array },
    vender: { type: String, default: "jitsi" },
    record: { type: String, default: "0" },
    ip: { type: String, default: "" },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "History_rooms" }
);

module.exports = mongoose.model("History_rooms", Schema);
