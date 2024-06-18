const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["resident", "admin", "maintainence", "owner", "superadmin"],
      message: "{role is not supported}",
    },
    subrole: { type: String,default:null },
    profile:{type:String,default:null}
  },
  { timestamps: true }
);

module.exports = model("User", UserSchema);
