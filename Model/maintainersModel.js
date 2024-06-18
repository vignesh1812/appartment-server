const { Schema, model } = require("mongoose");

const maintainerSchema=new Schema({
    role:{
        type:String,
        required:true
    }
})

module.exports=model("Maintainer",maintainerSchema);