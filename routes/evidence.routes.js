const router = require("express").Router()
const Evidence = require("../models/Evidence")
const verifyToken = require("../middleware/verifyToken")
const isAdmin = require ("../middleware/isAdmin")


//Add evidence to the case 
router.post("/:cId", verifyToken, isAdmin, async (req, res) => {
    try {
        const { label, title, type, details, foundAt, suspectId, isLocked } = req.body
        const newEvidence = new Evidence({
            label,
            title,
            type,
            details,
            foundAt,
            suspectId,
            isLocked,
            caseId: req.params.cId
        })
        await newEvidence.save()
        return res.status(201).json(newEvidence)

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// Edit evedence
router.put("/:eId", verifyToken, isAdmin, async (req, res) => {
    try {
        const { label, title, type, details, foundAt, suspectId } = req.body
        const updatedEvidence = await Evidence.findByIdAndUpdate(
            req.params.eId,
            { label, title, type, details, foundAt, suspectId },
            { new: true }
        )
        if (!updatedEvidence) {
            return res.status(404).json({ message: "Evidence not found" })
        }

        return res.json(updatedEvidence)
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

//Lock or unlock evidence
router.put("/:eId/toggle-lock", verifyToken, isAdmin, async (req, res) => {
    try {
        const evidence = await Evidence.findById(req.params.eId)
        if (!evidence) {
            return res.status(404).json({ message: "Evidence not found" })
        }

        evidence.isLocked = !evidence.isLocked
        await evidence.save()

        return res.json(evidence)
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

//Delete evidence
router.delete("/:eId", verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedEvidence = await Evidence.findByIdAndDelete(req.params.eId)
        if (!deletedEvidence) {
            return res.status(404).json({
                 message: "Evidence not found" 
                })
        }

        return res.json({ message: "Evidence deleted successfully" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})



module.exports = router
