const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Board = require("../models/Board");
const Notes = require("../models/Note");
const verifyToken = require("../middleware/verifyToken");

router.get("/:cId", verifyToken, async (req, res) => {
    try {
        const caseId = req.params.cId;
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            return res.status(404).json({ message: "Case not found" });
        }

        const currentUser = await User.findById(req.user._id);
        if (!currentUser) return res.status(401).json({ message: "Not signed in" });
        const teamId = currentUser.teamId;

        const boardFilter = teamId ? { caseId, teamId } : { caseId, userId: currentUser._id };
        const authorIds = teamId
            ? (await User.find({ teamId }).select("_id")).map(member => member._id)
            : [currentUser._id];

        const [messages, board, notes] = await Promise.all([
            teamId
                ? Chat.find({ caseId, teamId }).populate("sender", "username").sort({ createdAt: 1 })
                : null,
            Board.findOne(boardFilter).lean(),
            Notes.find({ caseId, userId: { $in: authorIds } }).populate("userId", "username"),
        ]);

        res.status(200).json({
            inTeam: Boolean(teamId),
            messages,
            board: {
                positions: board?.positions || {},
                strings: board?.strings || []
            },
            notes
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
