const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
            console.error("JWT_SECRET is missing or too short.");
            return res.status(500).json({
                message: "Authentication is not configured correctly."
            });
        }

const user = await User.findOne({ email, isActive: true }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                roles: user.roles,
                mustChangePassword: user.mustChangePassword
            },
            process.env.JWT_SECRET,
            {
                subject: user._id.toString(),
                expiresIn: "2h"
            }
        );

        return res.json({
            message: user.mustChangePassword
                ? "Login successful. You must change your password."
                : "Login successful.",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            message: "An unexpected error occurred during login."
        });
    }
});

module.exports = router;
