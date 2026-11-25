const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();


router.post("/register", async (req, res) => {
    try {
        const firstName = typeof req.body.firstName === "string"
            ? req.body.firstName.trim()
            : "";

        const lastName = typeof req.body.lastName === "string"
            ? req.body.lastName.trim()
            : "";

        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (firstName.length > 100 || lastName.length > 100) {
            return res.status(400).json({
                message: "Names cannot exceed 100 characters."
            });
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email address already exists."
            });
        }

        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            roles: ["ROLE_CLIENT"],
            mustChangePassword: false,
            isActive: true
        });

        await newUser.save();

        return res.status(201).json({
            message: "Your account has been created successfully. You can now sign in."
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email address already exists."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "An unexpected error occurred during registration."
        });
    }
});

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
