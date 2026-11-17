const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
    const rl = readline.createInterface({ input, output });

    try {
        const email = (await rl.question("Administrator email: "))
            .trim()
            .toLowerCase();
        const password = await rl.question("Enter a NEW password (at least 8 characters): ");

        if (!email || password.length < 8) {
            throw new Error("A valid email and a password of at least 8 characters are required.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ email });

        if (!user || !user.roles.includes("ROLE_ADMIN")) {
            throw new Error("No administrator account found for that email.");
        }

        user.password = password;
        await user.save();

        console.log("Administrator password updated successfully.");
    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => {});
    }
}

main().catch((error) => {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
});
