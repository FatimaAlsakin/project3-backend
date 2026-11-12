const router = require("express").Router();
const mongoose = require("mongoose");
const Board = require("../models/Board");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

const isItemId = (id) => typeof id === "string" && /^[\w-]{1,64}$/.test(id);

async function boardOwner(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.cId)) {
            return res.status(404).json({ message: "Case not found" });
        }
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) return res.status(401).json({ message: "Not signed in" });

        req.boardFilter = currentUser.teamId
            ? { caseId: req.params.cId, teamId: currentUser.teamId }
            : { caseId: req.params.cId, userId: currentUser._id };
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

function findOrCreateBoard(filter) {
    return Board.findOneAndUpdate(filter, { $setOnInsert: filter }, { upsert: true, returnDocument: "after" });
}

router.get("/:cId", verifyToken, boardOwner, async (req, res) => {
    try {
        const board = await Board.findOne(req.boardFilter).lean();
        res.status(200).json({
            positions: board?.positions || {},
            strings: board?.strings || []
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

router.put("/:cId/positions/:itemId", verifyToken, boardOwner, async (req, res) => {
    try {
        const { itemId } = req.params;
        const x = Number(req.body.x);
        const y = Number(req.body.y);
        if (!isItemId(itemId) || !Number.isFinite(x) || !Number.isFinite(y)) {
            return res.status(400).json({ message: "Invalid position" });
        }

        await findOrCreateBoard(req.boardFilter);
        await Board.updateOne(req.boardFilter, { $set: { [`positions.${itemId}`]: { x, y } } });
        res.status(200).json({ itemId, x, y });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

router.post("/:cId/strings", verifyToken, boardOwner, async (req, res) => {
    try {
        const { a, b } = req.body;
        if (!isItemId(a) || !isItemId(b) || a === b) {
            return res.status(400).json({ message: "Invalid string" });
        }

        await findOrCreateBoard(req.boardFilter);
        // only add it if this pair isn't tied yet (in either direction)
        await Board.updateOne(
            { ...req.boardFilter, strings: { $not: { $elemMatch: { $or: [{ a, b }, { a: b, b: a }] } } } },
            { $push: { strings: { a, b } } }
        );
        res.status(201).json({ a, b });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete("/:cId/strings", verifyToken, boardOwner, async (req, res) => {
    try {
        await Board.updateOne(req.boardFilter, { $set: { strings: [] } });
        res.status(200).json({ message: "Strings cleared" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

router.delete("/:cId/strings/:a/:b", verifyToken, boardOwner, async (req, res) => {
    try {
        const { a, b } = req.params;
        await Board.updateOne(req.boardFilter, {
            $pull: { strings: { $or: [{ a, b }, { a: b, b: a }] } }
        });
        res.status(200).json({ a, b });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
