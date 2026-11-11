const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
sender:{
    type:mongoose.Schema.Types.ObjectId,
ref: 'User'
} , 
caseId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: "Case"
} , 
teamId:{
type : mongoose.Schema.Types.ObjectId,
ref:"Team"
} , 
text:{
    type:String,
    required:true    
}},{timestamps:true})

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;