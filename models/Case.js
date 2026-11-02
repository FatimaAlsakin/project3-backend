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
      enum: ["draft", "open", "solved", "closed"],
      default: "draft",
    },
    solutionSuspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suspect",
    },
  },
  { timestamps: true },
);

const Case = mongoose.model("Case", caseSchema);

module.exports = User;
