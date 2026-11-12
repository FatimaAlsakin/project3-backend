const router = require("express").Router();
const Notes = require("../models/Note")
const User = require("../models/User")
const Board = require("../models/Board")
const verifyToken = require("../middleware/verifyToken")
const { noteRoomFor } = require("../socket")

router.post('/:cID',verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const newNotes = await Notes.create({
            content: req.body.content,
            userId:req.user._id,
            caseId:  req.params.cID,
        })
        await newNotes.populate('userId', 'username')

        const io = req.app.get("io")
        io.to(await noteRoomFor(req.user._id, req.params.cID)).emit("note:created", newNotes)

        res.status(201).json(newNotes)
    }catch(err){
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})



router.get('/:cID', verifyToken, async (req,res)=>{
    try{
        const currentUser = await User.findById(req.user._id)
        let authorIds = [req.user._id]
        if (currentUser?.teamId) {
            const teamMembers = await User.find({ teamId: currentUser.teamId }).select('_id')
            authorIds = teamMembers.map(member => member._id)
        }
        const allnotes = await Notes.find({caseId: req.params.cID, userId: { $in: authorIds }}).populate('userId', 'username')
        res.status(200).json(allnotes);
    
    }catch(err){
        console.log(err)
    }
})



router.get('/:cID/:nId', verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const note = await Notes.findById(req.params.nId)
        res.status(200).json(note)
    }catch(err){
        console.log(err)
    }
})


router.put("/:nID",verifyToken,async (req,res)=>{
    try{
         const notesEdit = await Notes.findById(req.params.nID);
         if (!notesEdit) return res.status(404).json({message:'Note not found'})
         if ( notesEdit.userId== req.user._id){
        const updatedNotes = await Notes.findByIdAndUpdate(req.params.nID, req.body, {new:true}).populate('userId', 'username')

        const io = req.app.get("io")
        io.to(await noteRoomFor(req.user._id, updatedNotes.caseId)).emit("note:updated", updatedNotes)

        res.json(updatedNotes)}
        else{
             return res.status(403).json({message:'You cannot update this Notes'})
        }

    }catch(err){
        console.log(err);
        res.status(500).json({ message: err.message })
    }
})

router.delete("/:nID", verifyToken,async (req,res)=>{
     try{
 const foundNotes = await Notes.findById(req.params.nID);
         if (!foundNotes) return res.status(404).json({message:'Note not found'})
         if ( foundNotes.userId== req.user._id) {
        const deletedNotes = await Notes.findByIdAndDelete(req.params.nID)

        const noteId = String(req.params.nID)
        await Board.updateMany(
            { caseId: foundNotes.caseId },
            {
                $unset: { [`positions.${noteId}`]: "" },
                $pull: { strings: { $or: [{ a: noteId }, { b: noteId }] } }
            }
        )

        const io = req.app.get("io")
        io.to(await noteRoomFor(req.user._id, deletedNotes.caseId)).emit("note:deleted", { _id: deletedNotes._id })

        res.json(deletedNotes)}
        else{
             return res.status(403).json({message:'You cannot delete this Notes'})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({ message: err.message })
    }
})

module.exports = router;
