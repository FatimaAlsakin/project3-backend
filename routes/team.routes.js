const router = require("express").Router()
const Team = require("../models/Team")
const User = require("../models/User")
const verifyToken = require("../middleware/verifyToken")
const solveAttempt = require("../models/SolveAttempt")


//List all teams
router.get("/", verifyToken, async (req, res) => {
    try {
        const allTeams = await Team.find().populate("createdBy", "username");
        for (const team of allTeams) {
            team.totalMembers = await User.countDocuments({ teamId: team._id })
        }
        res.json(allTeams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

//Current user team and members
router.get("/my-team", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)

        if (!currentUser.teamId) {
            return res.status(404).json({
                message: "You are not in a team" 
            })
        }

        const myTeam = await Team.findById(currentUser.teamId).populate("createdBy", "username")

        if (!myTeam) {
            return res.status(404).json({
                message: "Team not found" 
            })
        }
        
        const teamMembers = await User.find({ teamId: myTeam._id }).select("username")

        res.json({ team: myTeam, members: teamMembers })

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

//Create a new team
router.post("/", verifyToken, async (req, res) => {
    try {
        const { name, description, maxMembers } = req.body;
        const currentUser = await User.findById(req.user._id)
        if (currentUser.teamId) {
            return res.status(400).json({
                message: "You are already in a team. Leave your current team before creating a new one."
            })
        }
        const existingTeam = await Team.findOne({ name });
        if (existingTeam) {
            return res.status(400).json({
                message: "A team with this name already exists."
            })
        }
        const createTeam = await Team.create({ 
            name, 
            description,
            maxMembers,
            createdBy: req.user._id 
        })


        await User.findByIdAndUpdate(
            req.user._id,
            {
                teamId: createTeam._id,
                $push: { teamHistory: { team: createTeam._id, joinedAt: new Date() } }
            },
            { new: true }
        )

        res.status(201).json(createTeam);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

//Join a team 
router.put("/:tId/join", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        if (currentUser.teamId) {
            return res.status(400).json({
                message: "You are already in a team. Leave your current team before joining a new one."
            })
        }
        const joinTeam = await Team.findById(req.params.tId)
        if (!joinTeam) {
            return res.status(404).json({ message: "Team not found" })
        }
        const totalMembers = await User.countDocuments({ teamId: joinTeam._id })
        if (totalMembers >= joinTeam.maxMembers) {
            return res.status(400).json({ message: "Team is full" })
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                teamId: joinTeam._id,
                $push: { teamHistory: { team: joinTeam._id, joinedAt: new Date() } }
            },
            { new: true }
        )

        res.json(user)

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})


//Leave a team
router.put("/leave", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)
        if (currentUser.teamId) {
            const openEntry = currentUser.teamHistory.find((entry) =>
                String(entry.team) === String(currentUser.teamId) && !entry.leftAt
            )
            if (openEntry) {
                openEntry.leftAt = new Date()
            } else {
                currentUser.teamHistory.push({ team: currentUser.teamId, joinedAt: null, leftAt: new Date() })
            }
        }
        currentUser.teamId = null
        const user = await currentUser.save()
        res.json(user)

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})


function attemptTime(attempt) {
    return attempt._id.getTimestamp()
}

async function casesSolvedDuring(teamId, windows) {
    const correctAttempts = await solveAttempt.find({ teamId, isCorrect: true })
        .populate("caseId", "title description difficulty imageUrl")
        .populate("submitedBy", "username")

    const solved = new Map()
    for (const attempt of correctAttempts) {
        if (!attempt.caseId) continue
        const at = attemptTime(attempt)
        const duringMembership = windows.some(({ from, to }) => (!from || at >= from) && (!to || at <= to))
        if (duringMembership && !solved.has(String(attempt.caseId._id))) {
            solved.set(String(attempt.caseId._id), {
                case: attempt.caseId,
                solvedBy: attempt.submitedBy?.username || null,
                solvedAt: at
            })
        }
    }
    return [...solved.values()].sort((a, b) => b.solvedAt - a.solvedAt)
}

router.get("/dashboard", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        const windowsByTeam = new Map()
        function addWindow(teamId, from, to) {
            const key = String(teamId)
            if (!windowsByTeam.has(key)) windowsByTeam.set(key, [])
            windowsByTeam.get(key).push({ from, to })
        }

        for (const entry of user.teamHistory) {
            addWindow(entry.team, entry.joinedAt, entry.leftAt)
        }

        const currentKey = user.teamId ? String(user.teamId) : null
        if (currentKey && !user.teamHistory.some((entry) => String(entry.team) === currentKey && !entry.leftAt)) {
            addWindow(user.teamId, null, null)
        }

        const ownAttempts = await solveAttempt.find({ submitedBy: user._id, teamId: { $ne: null } }).select("teamId")
        const untracked = new Map()
        for (const attempt of ownAttempts) {
            const key = String(attempt.teamId)
            if (windowsByTeam.has(key)) continue
            const at = attemptTime(attempt)
            const range = untracked.get(key) || { from: at, to: at }
            untracked.set(key, { from: at < range.from ? at : range.from, to: at > range.to ? at : range.to })
        }
        for (const [teamId, range] of untracked) addWindow(teamId, range.from, range.to)

        let currentTeam = null
        const pastTeams = []
        for (const [teamId, windows] of windowsByTeam) {
            const team = await Team.findById(teamId).select("name description maxMembers")
            const solvedCases = await casesSolvedDuring(teamId, windows)

            if (teamId === currentKey) {
                const members = await User.find({ teamId }).select("username")
                currentTeam = { team, members, solvedCases }
            } else {
                const leftAt = windows.reduce((latest, w) => (w.to && (!latest || w.to > latest) ? w.to : latest), null)
                pastTeams.push({ team, leftAt, solvedCases })
            }
        }
        pastTeams.sort((a, b) => (b.leftAt || 0) - (a.leftAt || 0))

        res.json({ currentTeam, pastTeams })

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})



module.exports = router;
