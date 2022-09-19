const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    user_id: { type: String, default: "", unique: true },
    OTP: { type: String, default: "" },
    conter_OTP: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now() },
    updated_at: { type: Date, default: Date.now() },
  },
  { collection: "Session_OTP" }
);

module.exports = mongoose.model("Session_OTP", Schema);
