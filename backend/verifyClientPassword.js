require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findById(
            "6adba4b46136eeb4660257fe"
        ).select("+password");

        if (!user) {
            console.log("Test client found:", false);
            return;
        }

        console.log("Test client found:", true);
        console.log(
            "Password hash stored:",
            typeof user.password === "string" &&
            user.password.startsWith("$2")
        );
        console.log(
            "Password hash length:",
            user.password?.length ?? 0
        );
    } catch (error) {
        console.log("Check failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
