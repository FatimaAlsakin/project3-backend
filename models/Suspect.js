const mongoose = require("mongoose");

const suspectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    relation: {
        type: String,
        required: true
    },
    motive: {
        type: String,
        required: true
    },
    alibi: {
        type: String,
        required: true
    },
    case: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Case",
        required: true
    }
  },
  { timestamps: true },
);

const Suspect = mongoose.model("Suspect", suspectSchema);

module.exports = Suspect;
