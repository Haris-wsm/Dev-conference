const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    // id : { type:String,unique: true,min: 1 },
    oneid: { type: String, default: null },
    // limitmeeting : { type:String, default: 0 },
    created_at: { type: Date, default: Date.now() },
  },
  { collection: "DeleteUser" }
);

module.exports = mongoose.model("DeleteUser", Schema);
