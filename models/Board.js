const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Case",
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    positions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    strings: [{
        a: { type: String, required: true },
        b: { type: String, required: true },
        _id: false
    }]
}, { timestamps: true, minimize: false })

boardSchema.index({ caseId: 1, teamId: 1, userId: 1 }, { unique: true })

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
