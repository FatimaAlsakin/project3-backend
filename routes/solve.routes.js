const router = require("express").Router();
const mongoose = require("mongoose")
const solveAttempt= require("../models/SolveAttempt")
const Case = require("../models/Case")
const Suspect = require("../models/Suspect")
const User = require("../models/User")
const verifyToken = require("../middleware/verifyToken")

async function myAttemptsFilter(userId) {
    const currentUser = await User.findById(userId)
    return currentUser?.teamId ? { teamId: currentUser.teamId } : { submitedBy: userId }
}

function maxAttemptsFor(suspectCount) {
    return Math.max(1, Math.ceil(suspectCount / 2))
}

async function caseProgress(filter, foundCase) {
    const maxAttempts = maxAttemptsFor(await Suspect.countDocuments({ case: foundCase._id }))
    const [solvedAttempt, wrongAttempts, accusedSuspects] = await Promise.all([
        solveAttempt.exists({ ...filter, caseId: foundCase._id, isCorrect: true }),
        solveAttempt.countDocuments({ ...filter, caseId: foundCase._id, isCorrect: false }),
        solveAttempt.distinct('susbectId', { ...filter, caseId: foundCase._id, isCorrect: false })
    ])
    const solved = Boolean(solvedAttempt)
    const attemptsLeft = Math.max(0, maxAttempts - wrongAttempts)
    const failed = !solved && attemptsLeft === 0
    const answer = solved || failed ? await caseAnswer(foundCase) : null
    return { solved, failed, attemptsLeft, maxAttempts, answer, accusedSuspects: accusedSuspects.map(String) }
}

async function caseAnswer(foundCase) {
    if (!foundCase.solutionSuspect) return null
    return Suspect.findById(foundCase.solutionSuspect).select('name imageUrl')
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

router.get('/failed', verifyToken, async (req, res) => {
    try {
        const filter = await myAttemptsFilter(req.user._id)
        const [wrongCounts, solvedCaseIds] = await Promise.all([
            solveAttempt.aggregate([
                { $match: { ...filter, ...(filter.submitedBy && { submitedBy: new mongoose.Types.ObjectId(String(filter.submitedBy)) }), isCorrect: false } },
                { $group: { _id: '$caseId', wrong: { $sum: 1 } } }
            ]),
            solveAttempt.distinct('caseId', { ...filter, isCorrect: true })
        ])
        const solved = new Set(solvedCaseIds.map(String))
        const existing = new Set((await Case.distinct('_id', { _id: { $in: wrongCounts.map((c) => c._id) } })).map(String))
        const suspectCounts = await Suspect.aggregate([
            { $match: { case: { $in: wrongCounts.map((c) => c._id) } } },
            { $group: { _id: '$case', count: { $sum: 1 } } }
        ])
        const maxById = new Map(suspectCounts.map((c) => [String(c._id), maxAttemptsFor(c.count)]))

        const failedCaseIds = wrongCounts
            .filter(({ _id, wrong }) => existing.has(String(_id)) && !solved.has(String(_id)) && wrong >= (maxById.get(String(_id)) || 1))
            .map(({ _id }) => _id)
        res.status(200).json(failedCaseIds)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})

router.get('/:cID/status', verifyToken, async (req, res) => {
    try {
        const foundCase = await Case.findById(req.params.cID).select('solutionSuspect')
        if (!foundCase) {
            return res.status(404).json({ message: "Case not found" })
        }
        const filter = await myAttemptsFilter(req.user._id)
        res.status(200).json(await caseProgress(filter, foundCase))
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})


router.get('/', verifyToken,async (req,res)=>{
    try{
        const filter = await myAttemptsFilter(req.user._id)
        const allAttepms = await solveAttempt.find(filter)
        res.status(200).json(allAttepms)
    }catch(err){
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})



router.get('/:cID', verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const viewAttemps = await solveAttempt.findById(req.params.cID)
        res.status(200).json(viewAttemps)
    }catch(err){
        console.log(err)
        res.status(500).json({ message: err.message })
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
        if (!req.user.isAdmin && foundCase.status !== "open") {
            return res.status(403).json({ message: "This case is not open for solving" })
        }

        const filter = await myAttemptsFilter(req.user._id)
        const progress = await caseProgress(filter, foundCase)
        if (progress.solved) {
            return res.status(400).json({ message: "Your team already solved this case" })
        }
        if (progress.failed) {
            return res.status(403).json({ message: "No attempts left for this case" })
        }
        if (progress.accusedSuspects.includes(String(req.body.susbectId))) {
            return res.status(400).json({ message: "Your team already accused this suspect. Pick someone else." })
        }

        const isCorrect = String(foundCase.solutionSuspect) === String(req.body.susbectId)

        const newAttempt  = await solveAttempt.create({
            submitedBy: req.user._id,
            susbectId: req.body.susbectId,
            caseId:  req.params.cID,
            teamId: filter.teamId || null,
            isCorrect
        })
        const attemptsLeft = isCorrect ? progress.attemptsLeft : progress.attemptsLeft - 1
        const answer = isCorrect || attemptsLeft === 0 ? await caseAnswer(foundCase) : null
        const accusedSuspects = isCorrect
            ? progress.accusedSuspects
            : [...progress.accusedSuspects, String(req.body.susbectId)]
        res.status(201).json({ ...newAttempt.toObject(), attemptsLeft, maxAttempts: progress.maxAttempts, answer, accusedSuspects })
    }catch(err){
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})

module.exports = router;

