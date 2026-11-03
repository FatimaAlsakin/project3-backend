const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
 
    content: {
      type: String,
      required: true,
      
    } , 

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    } , 
    caseId : {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Case"
    }


})

const Notes = mongoose.model("Notes", noteSchema);

module.exports = Notes;