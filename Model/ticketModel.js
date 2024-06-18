const { Schema, model } = require("mongoose");

const ticketSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  ticketNo: { type: String,required:true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  assignedTo: { 
    type:Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedMember:{type: Schema.Types.String,ref:"User",default:null},
  status: {
    type: String,
    enum: ["open", "closed", "inprogress"],
    default: "open",
  },
  image: { type: String },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comments", default: null }],
},{timestamps:true});

module.exports=model("Ticket",ticketSchema)
