const router = require("express").Router()
const Team = require("../models/Team")
const User = require("../models/User")
const verifyToken = require("../middleware/verifyToken")


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
            { teamId: createTeam._id },
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
            { teamId: joinTeam._id },
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
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { teamId: null },
            { new: true }
        )
        res.json(user)

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

module.exports = router;
