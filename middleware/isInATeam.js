const User = require("../models/User");

const isInATeam = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Not signed in" });

        const currentUser = await User.findById(req.user._id);
        if (!currentUser?.teamId) {
            return res.status(403).json({ message: "Must be in a team" });
        }

        req.teamId = currentUser.teamId;
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = isInATeam;
