const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
authenticateToken,
requireRole,
requirePasswordChanged
} = require("../middleware/authMiddleware");

const router = express.Router();

const clientFields =
"_id firstName lastName email roles euroBalance mustChangePassword isActive createdAt";

function serializeClient(client) {
return {
id: client._id.toString(),
firstName: client.firstName,
lastName: client.lastName,
email: client.email,
roles: client.roles,
euroBalance: client.euroBalance.toString(),
mustChangePassword: client.mustChangePassword,
isActive: client.isActive,
createdAt: client.createdAt
};
}

/**

GET /api/users/clients

List active client accounts with pagination.

Administrator only.
*/
router.get(
"/clients",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_ADMIN"),
async (req, res) => {
try {
const page = Math.max(
1,
Number.parseInt(req.query.page, 10) || 1
);

     const limit = Math.min(
         100,
         Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
     );

     const filter = {
         roles: "ROLE_CLIENT",
         isActive: true
     };

     const [clients, total] = await Promise.all([
         User.find(filter)
             .select(clientFields)
             .sort({ createdAt: -1, _id: -1 })
             .skip((page - 1) * limit)
             .limit(limit)
             .lean(),

         User.countDocuments(filter)
     ]);

     return res.json({
         clients: clients.map(serializeClient),
         pagination: {
             page,
             limit,
             total,
             totalPages: Math.ceil(total / limit)
         }
     });
 } catch (error) {
     console.error(
         "Client list retrieval failed:",
         error.message
     );

     return res.status(500).json({
         message: "Unable to retrieve client accounts."
     });
 }

}
);

/**

GET /api/users/clients/

Retrieve one active client's details.

Administrator only.
*/
router.get(
"/clients/:id",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_ADMIN"),
async (req, res) => {
try {
const { id } = req.params;

     if (!/^[a-fA-F0-9]{24}$/.test(id)) {
         return res.status(400).json({
             message: "Invalid client ID."
         });
     }

     const client = await User.findOne({
         _id: id,
         roles: "ROLE_CLIENT",
         isActive: true
     })
         .select(clientFields)
         .lean();

     if (!client) {
         return res.status(404).json({
             message: "Client account not found."
         });
     }

     return res.json({
         client: serializeClient(client)
     });
 } catch (error) {
     console.error(
         "Client details retrieval failed:",
         error.message
     );

     return res.status(500).json({
         message: "Unable to retrieve client details."
     });
 }

}
);

/**

POST /api/users/clients

Create a client account.

Administrator only.
*/
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

     const password =
         typeof req.body.password === "string"
             ? req.body.password
             : "";

     if (!firstName || !lastName || !email || !password) {
         return res.status(400).json({
             message:
                 "First name, last name, email, and password are required."
         });
     }

     if (firstName.length > 100 || lastName.length > 100) {
         return res.status(400).json({
             message: "Names must not exceed 100 characters."
         });
     }

     if (
         email.length > 254 ||
         !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
     ) {
         return res.status(400).json({
             message: "A valid email address is required."
         });
     }

     if (
         password.length < 8 ||
         Buffer.byteLength(password, "utf8") > 72
     ) {
         return res.status(400).json({
             message:
                 "Password must contain at least 8 characters and not exceed 72 UTF-8 bytes."
         });
     }

     const existing = await User.findOne({ email }).select("_id");

     if (existing) {
         return res.status(409).json({
             message: "That email address is already registered."
         });
     }

     const client = new User({
         firstName,
         lastName,
         email,
         password,
         roles: ["ROLE_CLIENT"],
         mustChangePassword: false,
         isActive: true
     });

     await client.save();

     return res.status(201).json({
         message: "Client created successfully.",
         client: serializeClient(client)
     });
 } catch (error) {
     if (error.code === 11000) {
         return res.status(409).json({
             message: "That email address is already registered."
         });
     }

     if (error.name === "ValidationError") {
         return res.status(400).json({
             message:
                 "The submitted client information is invalid."
         });
     }

     console.error("Client creation failed:", error.message);

     return res.status(500).json({
         message: "Unable to create the client account."
     });
 }

}
);

/**

DELETE /api/users/clients/

Deactivate a client account without deleting financial history.

Administrator only.
*/
router.delete(
    "/clients/:id",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_ADMIN"),
async (req, res) => {
try {
const { id } = req.params;

     if (!/^[a-fA-F0-9]{24}$/.test(id)) {
         return res.status(400).json({
             message: "Invalid client ID."
         });
     }

     const client = await User.findOne({
         _id: id,
         roles: "ROLE_CLIENT",
         isActive: true
     });

     if (!client) {
         return res.status(404).json({
             message: "Active client account not found."
         });
     }

     client.isActive = false;
     await client.save();

     return res.json({
         message:
             "Client deactivated successfully. Financial history has been preserved.",
         client: {
             id: client._id.toString(),
             isActive: client.isActive
         }
     });
 } catch (error) {
     console.error("Client deactivation failed:", error.message);

     return res.status(500).json({
         message: "Unable to deactivate the client account."
     });
 }

}
);

/**

GET /api/users/me

Retrieve the authenticated user's profile.
*/
router.get("/me", authenticateToken, async (req, res) => {
try {
const user = await User.findById(req.user.id);

 if (!user) {
     return res.status(404).json({
         message: "User account not found."
     });
 }

 return res.json({
     user: {
         id: user._id.toString(),
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         roles: user.roles,
         euroBalance: user.euroBalance.toString(),
         mustChangePassword: user.mustChangePassword
     }
 });

} catch (error) {
console.error("Current-user lookup failed:", error.message);

 return res.status(500).json({
     message: "Unable to retrieve the current user."
 });

}
});

/**

POST /api/users/change-password

Change the authenticated user's password.
*/
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
         message:
             "Current password and new password are required."
     });
 }

 if (newPassword.length < 8) {
     return res.status(400).json({
         message:
             "The new password must contain at least 8 characters."
     });
 }

 if (Buffer.byteLength(newPassword, "utf8") > 72) {
     return res.status(400).json({
         message:
             "The new password must not exceed 72 UTF-8 bytes."
     });
 }

 if (currentPassword === newPassword) {
     return res.status(400).json({
         message:
             "The new password must differ from the current password."
     });
 }

 const user = await User.findById(req.user.id).select("+password");

 if (!user) {
     return res.status(404).json({
         message: "User account not found."
     });
 }

 const passwordMatches =
     await user.comparePassword(currentPassword);

 if (!passwordMatches) {
     return res.status(401).json({
         message: "Current password is incorrect."
     });
 }

 user.password = newPassword;
 user.mustChangePassword = false;

 await user.save();

 const token = jwt.sign(
     {
         roles: user.roles,
         mustChangePassword: false
     },
     process.env.JWT_SECRET,
     {
         subject: user._id.toString(),
         expiresIn: "2h"
     }
 );

 return res.json({
     message: "Password changed successfully.",
     token,
     user: {
         id: user._id.toString(),
         mustChangePassword: user.mustChangePassword
     }
 });

} catch (error) {
console.error("Password change failed:", error.message);

 return res.status(500).json({
     message: "Unable to change the password."
 });

}
});

/**

GET /api/users/client-area

Client-only protected route.
*/
router.get(
"/client-area",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_CLIENT"),
(req, res) => {
return res.json({
message: "Client access granted."
});
}
);

/**

PATCH /api/users/clients/

Update an active client's name and email.

Administrator only.
*/
router.patch(
"/clients/:id",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_ADMIN"),
async (req, res) => {
try {
const { id } = req.params;

     if (!/^[a-fA-F0-9]{24}$/.test(id)) {
         return res.status(400).json({
             message: "Invalid client ID."
         });
     }

     const updates = {};
     const allowedFields = ["firstName", "lastName", "email"];

     for (const field of allowedFields) {
         if (
             Object.prototype.hasOwnProperty.call(req.body, field)
         ) {
             if (typeof req.body[field] !== "string") {
                 return res.status(400).json({
                     message: `${field} must be a string.`
                 });
             }

             const value = req.body[field].trim();

             if (!value) {
                 return res.status(400).json({
                     message: `${field} cannot be empty.`
                 });
             }

             updates[field] =
                 field === "email" ? value.toLowerCase() : value;
         }
     }

     if (Object.keys(updates).length === 0) {
         return res.status(400).json({
             message:
                 "Provide at least one field: firstName, lastName, or email."
         });
     }

     if (
         (updates.firstName && updates.firstName.length > 100) ||
         (updates.lastName && updates.lastName.length > 100)
     ) {
         return res.status(400).json({
             message: "Names must not exceed 100 characters."
         });
     }

     if (
         updates.email &&
         (
             updates.email.length > 254 ||
             !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
         )
     ) {
         return res.status(400).json({
             message: "A valid email address is required."
         });
     }

     const client = await User.findOne({
         _id: id,
         roles: "ROLE_CLIENT",
         isActive: true
     });

     if (!client) {
         return res.status(404).json({
             message: "Active client account not found."
         });
     }

     if (updates.email && updates.email !== client.email) {
         const existing = await User.findOne({
             email: updates.email,
             _id: { $ne: client._id }
         }).select("_id");

         if (existing) {
             return res.status(409).json({
                 message: "That email address is already registered."
             });
         }
     }

     if (updates.firstName !== undefined) {
         client.firstName = updates.firstName;
     }

     if (updates.lastName !== undefined) {
         client.lastName = updates.lastName;
     }

     if (updates.email !== undefined) {
         client.email = updates.email;
     }

     await client.save();

     return res.json({
         message: "Client updated successfully.",
         client: serializeClient(client)
     });
 } catch (error) {
     if (error.code === 11000) {
         return res.status(409).json({
             message: "That email address is already registered."
         });
     }

     if (error.name === "ValidationError") {
         return res.status(400).json({
             message:
                 "The submitted client information is invalid."
         });
     }

     console.error("Client update failed:", error.message);

     return res.status(500).json({
         message: "Unable to update the client account."
     });
 }

}
);

/**

GET /api/users/admin-area

Administrator-only protected route.
*/
router.get(
"/admin-area",
authenticateToken,
requirePasswordChanged,
requireRole("ROLE_ADMIN"),
(req, res) => {
return res.json({
message: "Administrator access granted."
});
}
);

module.exports = router;