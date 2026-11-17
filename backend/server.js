require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const walletRoutes = require("./routes/walletRoutes");

const app = express();
const PORT = process.env.PORT || 5101;

app.use(cors({
origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
res.json({
status: "ok",
application: "BitChest API",
database: mongoose.connection.readyState === 1
? "connected"
: "disconnected"
});
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cryptos", cryptoRoutes);
app.use("/api/wallet", walletRoutes);

async function startServer() {
try {
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
throw new Error("JWT_SECRET is missing or too short.");
}

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
        console.log(
            `BitChest API running at http://localhost:${PORT}`
        );
    });
} catch (error) {
    console.error("Failed to start BitChest API:", error.message);
    process.exit(1);
}

}

startServer();
