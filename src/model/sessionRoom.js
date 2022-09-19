const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    user_id: { type: String, default: "" },
    room_id: { type: String, default: "" },
    uid: { type: String, default: "" },
    code: { type: String, default: "" },
    roomname: { type: String, default: "" },
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    option: { type: Object, default: null },
    key: { type: String, default: "" },
    meeting_id: { type: String, default: "", unique: true },
    setting: { type: Object, default: null },
    member: { type: Array, default: null },
    vender: { type: String, default: "jitsi" },
    urlInvite: { type: String, default: "" },
    presenter: { type: String, default: "" },
    timelastuser: { type: String, default: "" },
    record: { type: String, default: "0" },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "Session_room" }
);

module.exports = mongoose.model("Session_room", Schema);
