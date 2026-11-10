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
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        required: true,
        trim: true
    },
    foundAt: {
        type: String
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
    },
    // what the linked suspect says when asked about this evidence (optional)
    suspectResponse: {
        type: String,
        default: ""
    },
    // their body language when answering (optional)
    responseTell: {
        type: String,
        default: ""
    }

})

const Evidence = mongoose.model("Evidence", evidenceSchema)

module.exports = Evidence