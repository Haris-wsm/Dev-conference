const mongoose = require("mongoose");

var Schema = new mongoose.Schema(
  {
    username: { type: String, default: "" },
    email: { type: String, default: "", required: true },
    name: { type: String, default: "", required: true },
    lastname: { type: String, default: "", required: true },
    phonenumber: { type: String, default: "", required: true },
    company: { type: String, default: "", required: true },
    oneid: { type: String, default: null, unique: true },
    room_id: { type: String, default: "", required: true },
    role: { type: String, default: "" },
    avatar_profile: { type: String, default: null },
    verifyemail: { type: Boolean, default: false },
    license: { type: Date, default: null },
    limit: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "Users" }
);

module.exports = mongoose.model("Users", Schema);
