const mongoose = require ("mongoose")

const teamSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true
    }, 
    description: {
        type: String
    },
    totalMembers: {
        type: Number,
        default: 0
    },
    maxMembers: {
        type: Number,
        required: true
    },

    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }


},{timestamps: true})

const Team = mongoose.model("Team", teamSchema)

module.exports = Team