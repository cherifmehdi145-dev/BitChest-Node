require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Transaction = require("./models/Transaction");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({
        firstName: "hela",
        lastName: "cherif",
        roles: "ROLE_CLIENT"
    }).select("_id firstName lastName euroBalance");

    if (!user) {
        console.log("Client not found.");
        return;
    }

    console.log("Client balance:", user.euroBalance.toString());

    const transactions = await Transaction.find({ user: user._id })
        .sort({ createdAt: 1, _id: 1 })
        .select("type quantity pricePerUnit totalAmount createdAt")
        .lean();

    console.log("Transactions:");
    console.log(transactions.map(t => ({
        type: t.type,
        quantity: t.quantity?.toString(),
        pricePerUnit: t.pricePerUnit?.toString(),
        totalAmount: t.totalAmount?.toString(),
        createdAt: t.createdAt
    })));
}

main()
    .catch(error => console.error(error.message))
    .finally(() => mongoose.disconnect());
