const router = require("express").Router();
const Case = require("../models/Case");
const isAdmin = require("../middleware/isAdmin");
const verifyToken = require("../middleware/verifyToken");
const Suspect = require("../models/Suspect");
const Evidence = require("../models/Evidence");
const upload = require("../middleware/upload");
const jwt = require("jsonwebtoken");

const PLAYER_STATUSES = ["open", "solved"];

function isAdminRequest(req) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        return Boolean(token && jwt.verify(token, process.env.JWT_SECRET).isAdmin);
    } catch {
        return false;
    }
}

router.post("/", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try{
        const { title, description, location, incidentDate, difficulty, status  } = req.body;

        const newCase = await Case.create({
            title,
            description,
            location,
            incidentDate,
            difficulty,
            status,
            imageUrl: req.file ? req.file.path : undefined
        });

        res.status(201).json(newCase);
    } catch (err) {
        console.log(err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        if (err.code === 11000) {
            return res.status(409).json({ message: "Case title already exists" });
        }
        res.status(500).json({ message: err.message });
    }
})

router.get("/", async (req, res) => {
    try {
        const filter = isAdminRequest(req) ? {} : { status: { $in: PLAYER_STATUSES } };
        const cases = await Case.find(filter);
        res.status(200).json(cases);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})

// public, like the cases list, so visitors can look at a case before signing in
router.get("/:Cid", async (req, res) => {
    try {
        const { Cid } = req.params;
        const foundCase = await Case.findById(Cid);
        // a draft or closed case doesn't exist as far as players can tell
        if (!foundCase || (!isAdminRequest(req) && !PLAYER_STATUSES.includes(foundCase.status))) {
            return res.status(404).json({ message: "Case not found" });
        }
        const suspects = await Suspect.find({ case: Cid });
        const evidence = await Evidence.find({ caseId: Cid });
        res.status(200).json({ case: foundCase, suspects: suspects, evidence: evidence });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})

router.put("/:Cid", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { Cid } = req.params;
        const update = { ...req.body };
        // form data sends "no solution suspect" as an empty string
        if (update.solutionSuspect === '') update.solutionSuspect = null;
        // only replace the picture if a new one was uploaded
        delete update.imageUrl;
        if (req.file) update.imageUrl = req.file.path;

        const updatedCase = await Case.findByIdAndUpdate(
            Cid,
            update,
            { new: true })
        if (!updatedCase) {
            return res.status(404).json({ message: "Case not found" });
        }
        return res.json(updatedCase);
    }catch(err){
        console.log(err)
        res.status(500).json({ message: err.message });
    }
})

router.delete("/:Cid", verifyToken, isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const deletedCase = await Case.findByIdAndDelete(Cid);
        res.status(200).json(deletedCase);
    } catch (err) {
        console.log(err);
    }
})

router.post("/:Cid/suspects", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { Cid } = req.params;
        const { name, relation, motive, alibi, relationTell, motiveTell, alibiTell } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: "Suspect photo is required" });
        }

        const newSuspect = await Suspect.create({
            name,
            relation,
            motive,
            alibi,
            relationTell,
            motiveTell,
            alibiTell,
            imageUrl: req.file.path,
            case: Cid
        });

        res.status(201).json(newSuspect);
    } catch (err) {
        console.log(err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
});


router.put("/:Cid/suspects/:sId", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { Cid, sId } = req.params;
        const { name, relation, motive, alibi, relationTell, motiveTell, alibiTell } = req.body;
        const update = { name, relation, motive, alibi, relationTell, motiveTell, alibiTell };
        // only replace the image if a new one was uploaded
        if (req.file) {
            update.imageUrl = req.file.path;
        }
        const suspect = await Suspect.findOneAndUpdate(
            { _id: sId, case: Cid },
            update,
            { new: true, runValidators: true }
        );
        if (!suspect) {
            return res.status(404).json({ message: "Suspect not found" });
        }
        res.status(200).json(suspect);
    } catch (err) {
        console.log(err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message });
    }
})

router.delete("/:Cid/suspects/:sId", verifyToken, isAdmin, async (req, res) => {
    try {
        const { Cid, sId } = req.params;
        const suspect = await Suspect.findOneAndDelete({ _id: sId, case: Cid });
        if (!suspect) {
            return res.status(404).json({ message: "Suspect not found" });
        }
        res.status(200).json(suspect);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})




module.exports = router;
