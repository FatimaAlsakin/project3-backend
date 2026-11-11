const router = require("express").Router();
const isInATeam = require("../middleware/isInATeam");
const verifyToken = require("../middleware/verifyToken");
const Chat = require("../models/Chat");

router.post("/:cId", verifyToken, isInATeam, async (req, res) => {
    try {
        if (!req.body.text || !req.body.text.trim()) {
            return res.status(400).json({ message: "Text is required" });
        }
        const newChat = await Chat.create({
            sender: req.user._id,
            caseId: req.params.cId,
            teamId: req.teamId,
            text: req.body.text.trim()
        });
        await newChat.populate("sender", "username");

        res.status(201).json(newChat);
    } catch (err) {
        console.log(err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
});

router.get("/:cId", verifyToken, isInATeam, async (req, res) => {
    try {
        const chats = await Chat.find({ caseId: req.params.cId, teamId: req.teamId })
            .populate("sender", "username")
            .sort({ createdAt: 1 });
        res.status(200).json(chats);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
