const router = require("express").Router();
const solveAttempt= require("../models/SolveAttempt")
const Case = require("../models/Case")
const User = require("../models/User")
const verifyToken = require("../middleware/verifyToken")

async function myAttemptsFilter(userId) {
    const currentUser = await User.findById(userId)
    return currentUser?.teamId ? { teamId: currentUser.teamId } : { submitedBy: userId }
}

router.get('/solved', verifyToken, async (req, res) => {
    try {
        const filter = await myAttemptsFilter(req.user._id)
        const solvedCaseIds = await solveAttempt.distinct('caseId', { ...filter, isCorrect: true })
        res.status(200).json(solvedCaseIds)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})

router.get('/:cID/status', verifyToken, async (req, res) => {
    try {
        const filter = await myAttemptsFilter(req.user._id)
        const correctAttempt = await solveAttempt.findOne({ ...filter, caseId: req.params.cID, isCorrect: true })
        res.status(200).json({ solved: Boolean(correctAttempt) })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})


router.get('/', verifyToken,async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const allAttepms = await solveAttempt.find({ teamId: req.user.teamId})
        res.status(200).json(allAttepms)
    }catch(err){
        console.log(err)
    }
})



router.get('/:cID', verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const viewAttemps = await solveAttempt.findById(req.params.cID)
        res.status(200).json(viewAttemps)
    }catch(err){
        console.log(err)
    }
})


router.post('/:cID',verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        if (!req.body.susbectId) {
            return res.status(400).json({ message: "Pick a suspect to accuse" })
        }

        const foundCase = await Case.findById(req.params.cID)
        if (!foundCase) {
            return res.status(404).json({ message: "Case not found" })
        }

        const filter = await myAttemptsFilter(req.user._id)
        const alreadySolved = await solveAttempt.findOne({ ...filter, caseId: req.params.cID, isCorrect: true })
        if (alreadySolved) {
            return res.status(400).json({ message: "Your team already solved this case" })
        }

        const isCorrect = String(foundCase.solutionSuspect) === String(req.body.susbectId)

        const newAttempt  = await solveAttempt.create({
            submitedBy: req.user._id,
            susbectId: req.body.susbectId,
            caseId:  req.params.cID,
            teamId: filter.teamId || null,
            isCorrect
        })
        res.status(201).json(newAttempt)
    }catch(err){
        console.log(err)
    }
})

module.exports = router;

