const isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not signed in" });
    if (req.user.isAdmin) return next();
    res.status(403).json({ message: "Admins only" });
};

module.exports = isAdmin;
