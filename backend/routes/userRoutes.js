const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
    authenticateToken,
    requireRole,
    requirePasswordChanged,
} = require("../middleware/authMiddleware");

const router = express.Router();

function serializeClient(client) {
    return {
        id: client._id.toString(),
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        roles: client.roles,
        euroBalance: client.euroBalance?.toString() ?? "0",
        mustChangePassword: client.mustChangePassword,
        isActive: client.isActive,
        createdAt: client.createdAt,
    };
}

function isValidEmail(email) {
    return (
        typeof email === "string" &&
        email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

// Change the password for the authenticated user.
// This route remains accessible when a password change is mandatory.
router.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const currentPassword =
            typeof req.body.currentPassword === "string"
                ? req.body.currentPassword
                : "";

        const newPassword =
            typeof req.body.newPassword === "string"
                ? req.body.newPassword
                : "";

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required.",
            });
        }

        if (
            newPassword.length < 8 ||
            Buffer.byteLength(newPassword, "utf8") > 72
        ) {
            return res.status(400).json({
                message:
                    "The new password must be at least 8 characters and no more than 72 UTF-8 bytes.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "The new password must differ from the current password.",
            });
        }

        const user = await User.findOne({
            _id: req.user.id,
            isActive: true,
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "User not found or inactive.",
            });
        }

        const passwordMatches = await user.comparePassword(currentPassword);

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Current password is incorrect.",
            });
        }

        user.password = newPassword;
        user.mustChangePassword = false;

        await user.save();

        const secret = process.env.JWT_SECRET;

        if (typeof secret !== "string" || secret.length < 64) {
            return res.status(500).json({
                message: "Authentication configuration error.",
            });
        }

        const token = jwt.sign(
            {
                sub: user._id.toString(),
                roles: user.roles,
                mustChangePassword: false,
            },
            secret,
            { expiresIn: "2h" }
        );

        return res.status(200).json({
            message: "Password changed successfully.",
            token,
            user: {
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword,
            },
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            message: "An unexpected error occurred.",
        });
    }
});

// List active clients. Administrators only.
router.get(
    "/clients",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    async (req, res) => {
        try {
            const clients = await User.find({
                roles: "ROLE_CLIENT",
                isActive: true,
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                clients: clients.map(serializeClient),
            });
        } catch (error) {
            console.error("List clients error:", error);

            return res.status(500).json({
                message: "An unexpected error occurred.",
            });
        }
    }
);

// Get one active client. Administrators only.
router.get(
    "/clients/:id",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    async (req, res) => {
        try {
            if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid client ID.",
                });
            }

            const client = await User.findOne({
                _id: req.params.id,
                roles: "ROLE_CLIENT",
                isActive: true,
            });

            if (!client) {
                return res.status(404).json({
                    message: "Client not found.",
                });
            }

            return res.status(200).json({
                client: serializeClient(client),
            });
        } catch (error) {
            console.error("Get client error:", error);

            return res.status(500).json({
                message: "An unexpected error occurred.",
            });
        }
    }
);

// Create a client and generate a one-time temporary password.
// Administrators only.
router.post(
    "/clients",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    async (req, res) => {
        try {
            const firstName =
                typeof req.body.firstName === "string"
                    ? req.body.firstName.trim()
                    : "";

            const lastName =
                typeof req.body.lastName === "string"
                    ? req.body.lastName.trim()
                    : "";

            const email =
                typeof req.body.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "";

            if (!firstName || !lastName || !email) {
                return res.status(400).json({
                    message: "First name, last name, and email are required.",
                });
            }

            if (firstName.length > 100 || lastName.length > 100) {
                return res.status(400).json({
                    message: "Names must not exceed 100 characters.",
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({
                    message: "Please provide a valid email address.",
                });
            }

            const existingUser = await User.findOne({ email }).select("_id");

            if (existingUser) {
                return res.status(409).json({
                    message: "An account with this email already exists.",
                });
            }

            const temporaryPassword = crypto
                .randomBytes(18)
                .toString("base64url");

            const client = new User({
                firstName,
                lastName,
                email,
                password: temporaryPassword,
                roles: ["ROLE_CLIENT"],
                mustChangePassword: true,
                isActive: true,
            });

            await client.save();

            return res.status(201).json({
                message:
                    "Client created successfully. Provide the temporary password to the client securely.",
                client: serializeClient(client),
                temporaryPassword,
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "An account with this email already exists.",
                });
            }

            if (error.name === "ValidationError") {
                return res.status(400).json({
                    message: "The supplied client data is invalid.",
                });
            }

            console.error("Create client error:", error);

            return res.status(500).json({
                message: "An unexpected error occurred.",
            });
        }
    }
);

// Update an active client's profile. Administrators only.
router.patch(
    "/clients/:id",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    async (req, res) => {
        try {
            if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid client ID.",
                });
            }

            const allowedFields = ["firstName", "lastName", "email"];
            const suppliedFields = Object.keys(req.body);

            if (
                suppliedFields.length === 0 ||
                suppliedFields.some((field) => !allowedFields.includes(field))
            ) {
                return res.status(400).json({
                    message:
                        "Provide at least one permitted field: firstName, lastName, or email.",
                });
            }

            const client = await User.findOne({
                _id: req.params.id,
                roles: "ROLE_CLIENT",
                isActive: true,
            });

            if (!client) {
                return res.status(404).json({
                    message: "Client not found.",
                });
            }

            if (Object.prototype.hasOwnProperty.call(req.body, "firstName")) {
                if (
                    typeof req.body.firstName !== "string" ||
                    !req.body.firstName.trim() ||
                    req.body.firstName.trim().length > 100
                ) {
                    return res.status(400).json({
                        message: "First name must contain 1–100 characters.",
                    });
                }

                client.firstName = req.body.firstName.trim();
            }

            if (Object.prototype.hasOwnProperty.call(req.body, "lastName")) {
                if (
                    typeof req.body.lastName !== "string" ||
                    !req.body.lastName.trim() ||
                    req.body.lastName.trim().length > 100
                ) {
                    return res.status(400).json({
                        message: "Last name must contain 1–100 characters.",
                    });
                }

                client.lastName = req.body.lastName.trim();
            }

            if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
                if (typeof req.body.email !== "string") {
                    return res.status(400).json({
                        message: "Please provide a valid email address.",
                    });
                }

                const email = req.body.email.trim().toLowerCase();

                if (!isValidEmail(email)) {
                    return res.status(400).json({
                        message: "Please provide a valid email address.",
                    });
                }

                const existingUser = await User.findOne({
                    email,
                    _id: { $ne: client._id },
                }).select("_id");

                if (existingUser) {
                    return res.status(409).json({
                        message: "An account with this email already exists.",
                    });
                }

                client.email = email;
            }

            await client.save();

            return res.status(200).json({
                message: "Client updated successfully.",
                client: serializeClient(client),
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "An account with this email already exists.",
                });
            }

            if (error.name === "ValidationError") {
                return res.status(400).json({
                    message: "The supplied client data is invalid.",
                });
            }

            console.error("Update client error:", error);

            return res.status(500).json({
                message: "An unexpected error occurred.",
            });
        }
    }
);

// Deactivate a client without deleting their transaction history.
router.delete(
    "/clients/:id",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    async (req, res) => {
        try {
            if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
                return res.status(400).json({
                    message: "Invalid client ID.",
                });
            }

            const client = await User.findOneAndUpdate(
                {
                    _id: req.params.id,
                    roles: "ROLE_CLIENT",
                    isActive: true,
                },
                { $set: { isActive: false } },
                { new: true, runValidators: true }
            );

            if (!client) {
                return res.status(404).json({
                    message: "Client not found or already inactive.",
                });
            }

            return res.status(200).json({
            message: "Client account successfully removed from active management. Financial records preserved.",
            client: serializeClient(client),
            });
        } catch (error) {
            console.error("Deactivate client error:", error);

            return res.status(500).json({
                message: "An unexpected error occurred.",
            });
        }
    }
);

// Retrieve the authenticated user's own profile.
router.get(
    "/me",
    authenticateToken,
    requirePasswordChanged,
    async (req, res) => {
        try {
            const user = await User.findOne({
                _id: req.user.id,
                isActive: true,
            });

            if (!user) {
                return res.status(404).json({
                    message: "User profile not found.",
                });
            }

            return res.status(200).json({
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    roles: user.roles,
                },
            });
        } catch (error) {
            console.error("Get own profile error:", error);

            return res.status(500).json({
                message: "Unable to retrieve your profile.",
            });
        }
    }
);

// Update the authenticated user's own profile.
router.patch(
    "/me",
    authenticateToken,
    requirePasswordChanged,
    async (req, res) => {
        try {
            const firstName =
                typeof req.body.firstName === "string"
                    ? req.body.firstName.trim()
                    : "";

            const lastName =
                typeof req.body.lastName === "string"
                    ? req.body.lastName.trim()
                    : "";

            const email =
                typeof req.body.email === "string"
                    ? req.body.email.trim().toLowerCase()
                    : "";

            if (!firstName || !lastName || !email) {
                return res.status(400).json({
                    message: "First name, last name and email are required.",
                });
            }

            if (firstName.length > 100 || lastName.length > 100) {
                return res.status(400).json({
                    message: "Names cannot exceed 100 characters.",
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({
                    message: "Please provide a valid email address.",
                });
            }

            const existingEmail = await User.findOne({
                email,
                _id: { $ne: req.user.id },
            });

            if (existingEmail) {
                return res.status(409).json({
                    message: "This email address is already in use.",
                });
            }

            const user = await User.findOne({
                _id: req.user.id,
                isActive: true,
            });

            if (!user) {
                return res.status(404).json({
                    message: "User profile not found.",
                });
            }

            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email;

            await user.save();

            return res.status(200).json({
                message: "Your profile has been updated successfully.",
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    roles: user.roles,
                },
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    message: "This email address is already in use.",
                });
            }

            console.error("Update own profile error:", error);

            return res.status(500).json({
                message: "Unable to update your profile.",
            });
        }
    }
);

// Protected client area.
router.get(
    "/client-area",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_CLIENT"),
    (req, res) => {
        return res.status(200).json({
            message: "Client access granted.",
            user: {
                id: req.user.id,
                roles: req.user.roles,
                mustChangePassword: req.user.mustChangePassword,
            },
        });
    }
);

// Protected administrator area.
router.get(
    "/admin-area",
    authenticateToken,
    requirePasswordChanged,
    requireRole("ROLE_ADMIN"),
    (req, res) => {
        return res.status(200).json({
            message: "Administrator access granted.",
            user: {
                id: req.user.id,
                roles: req.user.roles,
                mustChangePassword: req.user.mustChangePassword,
            },
        });
    }
);

module.exports = router;
module.exports = router;