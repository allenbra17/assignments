const router = require("express").Router();
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { UserModel } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
    let { username, passwordHash } = req.body.user;
    try {
        const User = await UserModel.create({
            username,
            passwordHash: bcrypt.hashSync(passwordHash, 13),
        });

        let token = jwt.sign({id: User.id}, process.env.JWT_SECRET, {expiresIn: 60 * 60 * 24});

        res.status(201).json({
            message: "User successfully registered",
            user: User,
            sessionToken: token
        });
    } catch (err) {
        if (err instanceof UniqueConstraintError) {
            res.status(409).json({
                message: "username already in use",
            });
        } else {
        res.status(500).json({
            message: "Failed to register user",
        });
    }}
});

router.post("/login", async (req, res) => {
    let { username, passwordHash } = req.body.user;
    try {
        const loginUser = await UserModel.findOne({
        where: {
            username: username,
        },
    });
    if (loginUser) {
        let passwordHashComparison = await bcrypt.compare(passwordHash, loginUser.passwordHash);
        if (passwordHashComparison) {
        let token = jwt.sign({id: loginUser.id}, process.env.JWT_SECRET, {expiresIn: 60 * 60 * 24});
        res.status(200).json({
            user: loginUser,
            message: "Successfully logged in",
            sessionToken: token            
        });

    } else {
        res.status(401).json({
            message: "Incorrect user or passwordHash"
        })
    }
    }else {
        res.status(401).json({
            message: "Incorrect user or passwordHash"
        });
    }
    } catch (err) {
        res.status(500).json({
            message: "Login Failed",
        });
    }
});

module.exports = router;