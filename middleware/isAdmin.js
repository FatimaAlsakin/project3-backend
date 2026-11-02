const isAdmin = (req, res, next) => {
    if (!req.user) return res.redirect("/auth/sign-in");
    if (req.user.isAdmin) return next();
    res.redirect("/");
};

module.exports = isAdmin;
