const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase:true
    },
    hashedPassword: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    teamId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },
    teamHistory: [{
      team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date, default: null },
      _id: false
    }]
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
