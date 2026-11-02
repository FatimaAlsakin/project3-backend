const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['image'],
        required: true
    },
    details: {
        type: String,
        required: true,
        trim: true
    },
    foundAt: {
        type: String
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Case",
        required: true
    },
    suspectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Suspect",
        default: null
    }

})

const Evidence = mongoose.model("Evidence", evidenceSchema)

module.exports = Evidence