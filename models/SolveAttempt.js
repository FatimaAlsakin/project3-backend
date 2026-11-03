const mongoose = require("mongoose");

const solveAttemptSchema = new mongoose.Schema({
submitedBy:{
    type:mongoose.Schema.Types.ObjectId,
ref: 'User'
} , 
susbectId:{
    type:mongoose.Schema.Types.ObjectId, 
    ref:"Susbect"
} , 
caseId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: "Case"
} , 
teamId:{
type : mongoose.Schema.Types.ObjectId,
ref:"Team"
} , 
isCorrect:{
    type:Boolean , 
        default: false
}
    
})

const solveAttempt = mongoose.model("solveAttempt", solveAttemptSchema);

module.exports = solveAttempt;