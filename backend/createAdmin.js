const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
    const rl = readline.createInterface({ input, output });

    try {
        const firstName = (await rl.question("Administrator first name: ")).trim();
        const lastName = (await rl.question("Administrator last name: ")).trim();
        const email = (await rl.question("Administrator email: ")).trim().toLowerCase();
        const password = await rl.question("Choose a password (at least 8 characters): ");

        if (!firstName || !lastName || !email || password.length < 8) {
            throw new Error("Names, email, and a password of at least 8 characters are required.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const existing = await User.findOne({ email });

        if (existing) {
            throw new Error("That email address is already registered.");
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            roles: ["ROLE_ADMIN"],
            mustChangePassword: false
        });

        await user.save();

        console.log("Administrator created successfully.");
        console.log("Account ID:", user._id.toString());
        console.log("Email:", user.email);
        console.log("Role:", user.roles.join(", "));
    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => {});
    }
}

main().catch((error) => {
    console.error("Administrator creation failed:", error.message);
    process.exitCode = 1;
});
