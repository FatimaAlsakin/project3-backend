const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
   title:{ 
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    overview: {
        type: String,
    },
    victim: {
        name: { type: String },
        age: { type: Number, min: 0 },
        occupation: { type: String },
        maritalStatus: { type: String },
        knownFor: { type: String },
        personality: { type: String },
        background: { type: String },
        imageUrl: { type: String },
    },
    witnesses: [{
        name: { type: String, required: true },
        age: { type: Number, min: 0 },
        role: { type: String },
        statement: { type: String },
        imageUrl: { type: String },
    }],
    location: {
        type: String,
        required: true,
   },
   incidentDate: {
        type: Date,
        required: true,
   },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "draft",
    },
    solutionSuspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suspect",
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

const Case = mongoose.model("Case", caseSchema);

module.exports = Case;
