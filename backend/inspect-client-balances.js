require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({ roles: "ROLE_CLIENT" })
        .select("firstName lastName euroBalance createdAt")
        .lean();

    console.log(users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        balance: user.euroBalance?.toString(),
        createdAt: user.createdAt
    })));

    await mongoose.disconnect();
}

main().catch(async error => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
});
