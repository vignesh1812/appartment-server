const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userRole: {
      type: String,
      enum: ["maintainence", "superadmin", "admin", "resident","owner"],
      required: true,
    },
    subRole: { type: String, default: null },

    content: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model("Comments", commentSchema);
