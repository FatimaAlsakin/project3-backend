const router = require("express").Router()
const Evidence = require("../models/Evidence")
const verifyToken = require("../middleware/verifyToken")
const isAdmin = require ("../middleware/isAdmin")
const upload = require("../middleware/upload")


//Add evidence to the case
router.post("/:cId", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { label, title, type, details, foundAt, suspectId, suspectResponse, responseTell } = req.body
        const imageUrl = req.file ? req.file.path : req.body.imageUrl
        if (!imageUrl) {
            return res.status(400).json({ message: "Evidence image is required" })
        }
        const newEvidence = new Evidence({
            label,
            title,
            type,
            imageUrl,
            details,
            foundAt,
            suspectId: suspectId || null,
            suspectResponse,
            responseTell,
            caseId: req.params.cId
        })
        await newEvidence.save()

        const io = req.app.get("io")
        io.to(`case:${req.params.cId}`).emit("evidence:created", newEvidence)
        
        return res.status(201).json(newEvidence)

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// Edit evedence
router.put("/:eId", verifyToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { label, title, type, details, foundAt, suspectId, suspectResponse, responseTell } = req.body
        const update = { label, title, type, details, foundAt, suspectId: suspectId || null, suspectResponse, responseTell }
        // only replace the image if a new one was uploaded
        if (req.file) {
            update.imageUrl = req.file.path
        }
        const updatedEvidence = await Evidence.findByIdAndUpdate(
            req.params.eId,
            update,
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
