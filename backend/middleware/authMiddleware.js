const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
const authorization = req.headers.authorization;

if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
        message: "Authentication required."
    });
}

const token = authorization.slice(7).trim();

if (!token) {
    return res.status(401).json({
        message: "Authentication required."
    });
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm the account still exists and is active.
    const user = await User.findOne({
        _id: decoded.sub,
        isActive: true
    }).select("_id roles mustChangePassword");

    if (!user) {
        return res.status(401).json({
            message: "Account is inactive or no longer exists."
        });
    }

    req.user = {
        id: user._id.toString(),
        roles: user.roles,
        mustChangePassword: user.mustChangePassword === true
    };

    return next();
} catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError") {
        return res.status(401).json({
            message: "Invalid or expired authentication token."
        });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
        message: "An unexpected authentication error occurred."
    });
}

}

function requireRole(role) {
return function (req, res, next) {
if (!req.user || !req.user.roles.includes(role)) {
return res.status(403).json({
message: "You do not have permission to access this resource."
});
}

    return next();
};

}

function requirePasswordChanged(req, res, next) {
if (req.user && req.user.mustChangePassword) {
return res.status(403).json({
message: "You must change your password before accessing this resource.",
code: "PASSWORD_CHANGE_REQUIRED"
});
}

return next();

}

module.exports = {
authenticateToken,
requireRole,
requirePasswordChanged
};
