const router = require("express").Router();
const solveAttempt= require("../models/SolveAttempt")
const verifyToken = require("../middleware/verifyToken")




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
        const newAttempt  = await solveAttempt.create({
            submitedBy: req.user._id,
            susbectId: req.body.susbectId,
            caseId:  req.params.cID,
            teamId: req.user._id , 
            isCorrect: req.body.isCorrect
         
        })
        res.status(201).json(newAttempt)
    }catch(err){
        console.log(err)
    }
})

module.exports = router;

