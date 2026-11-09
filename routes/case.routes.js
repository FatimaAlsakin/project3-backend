const router = require("express").Router();
const Case = require("../models/Case");
const isAdmin = require("../middleware/isAdmin");
const verifyToken = require("../middleware/verifyToken");
const Suspect = require("../models/Suspect");
const Evidence = require("../models/Evidence");
const upload = require("../middleware/upload");

router.post("/", verifyToken, isAdmin, async (req, res) => {
    try{
        const { title, description, location, incidentDate, difficulty, status  } = req.body;

        const newCase = await Case.create({
            title,
            description,
            location,
            incidentDate,
            difficulty,
            status
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
        const cases = await Case.find();
        res.status(200).json(cases);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})

router.get("/:Cid",verifyToken, async (req, res) => {
    try {
        const { Cid } = req.params;
        const foundCase = await Case.findById(Cid);
        if (!foundCase) {
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

router.put("/:Cid", verifyToken, isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const updatedCase = await Case.findByIdAndUpdate(
            Cid, 
            req.body,
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
