const mongoose = require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");



//passport username and password khud define kr dega 
const userSchema=new Schema({
    email:{
        type:String,
        },
  likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  }
]

    })
    userSchema.plugin(passportLocalMongoose);
    module.exports=mongoose.model("User",userSchema);