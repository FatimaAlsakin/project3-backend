const router = require("express").Router();
const Case = require("../models/Case");
const isAdmin = require("../middleware/isAdmin");
const Suspect = require("../models/Suspect");

router.post("/", isAdmin, async (req, res) => {
    try{
        const { title, description, location, incidentDate, difficulty, status  } = req.body;
        const suspects = await Suspect.Create({
            name,
            relation,
            motive,
            alibi,
            case: newCase._id
        });

        const newCase = await Case.create({
            title,
            description,
            location,
            incidentDate,
            difficulty,
            status,
            solutionSuspect: suspects._id
        });

        res.status(201).json(newCase);
    } catch (err) {
    console.log(err);
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

router.get("/:Cid", async (req, res) => {
    try {
        const { Cid } = req.params;
        const foundCase = await Case.findById(Cid);
        const suspects = await Suspect.find({ case: Cid });
        if (!foundCase) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json({ case: foundCase, suspects: suspects });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})

router.put("/:Cid", isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const updatedCase = await Case.findByIdAndUpdate(
            Cid, 
            req.body,
            { new: true })
        return res.json(updatedCase);
    }catch(err){
        console.log(err)
    }
})

router.delete("/:Cid", isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const deletedCase = await Case.findByIdAndDelete(Cid);
        res.status(200).json(deletedCase);
    } catch (err) {
        console.log(err);
    }
})

router.post("/:Cid/suspects", isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const { name, relation, motive, alibi } = req.body;

        const newSuspect = await Suspect.create({
            name,
            relation,
            motive,
            alibi,
            case: Cid
        });

        res.status(201).json(newSuspect);
    } catch (err) {
        console.log(err);
    }
});


router.put("/:Cid/suspects",isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const suspects = await Suspect.findByIdAndUpdate(Cid, req.body, { new: true });
        res.status(200).json(suspects);
    } catch (err) {
        console.log(err);
    }   
})

router.delete("/:Cid/suspects",isAdmin, async (req, res) => {
    try {
        const { Cid } = req.params;
        const suspects = await Suspect.findByIdAndDelete(Cid);
        res.status(200).json(suspects);
    } catch (err) {
        console.log(err);
    }   
})




module.exports = router;
