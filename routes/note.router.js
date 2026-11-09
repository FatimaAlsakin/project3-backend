const router = require("express").Router();
const Notes = require("../models/Note")
const verifyToken = require("../middleware/verifyToken")

router.post('/:cID',verifyToken, async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const newNotes = await Notes.create({
            content: req.body.content,
            userId:req.user._id,
            caseId:  req.params.cID,
        })
        res.status(201).json(newNotes)
    }catch(err){
        console.log(err)
    }
})



router.get('/:cID', async (req,res)=>{
    try{
        // Logged in user is ALWAYS req.user
        const allnotes = await Notes.find()
        res.status(200).json(allnotes)
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
         if ( notesEdit.userId== req.user._id){
        const updatedNotes = await Notes.findByIdAndUpdate(req.params.nID, req.body, {new:true})
        res.json(updatedNotes)}
        else{
             return res.status(403).json({message:'You cannot update this Notes'})
        }

    }catch(err){
        console.log(err);

    }
})

router.delete("/:nID", verifyToken,async (req,res)=>{
     try{
 const foundNotes = await Notes.findById(req.params.nID);
         if ( foundNotes.userId== req.user._id) {
        const deletedNotes = await Notes.findByIdAndDelete(req.params.nID)
        res.json(deletedNotes)}
        else{
             return res.status(403).json({message:'You cannot delete this Notes'})
        }
    }catch(err){
        console.log(err);
    }
})


router.get('/:cID', verifyToken, async (req, res) => {
    try {
        const allnotes = await Notes.find({caseId: req.params.cID}).populate('userId')
        res.status(200).json(allnotes);
    } catch (err) {
        console.log(err)
    }
});



module.exports = router;
