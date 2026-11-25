require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const walletRoutes = require("./routes/walletRoutes");

const Quote = require("./models/Quote");
const { updateDailyQuotes } = require("./services/dailyQuoteService");

const app = express();
const PORT = process.env.PORT || 5101;

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

// Retry failed quotation updates after one minute.
async function runQuoteUpdateWithRetry() {
    try {
        await updateDailyQuotes();
    } catch (error) {
        console.error(
            "Daily quotation update failed:",
            error.message
        );

        console.log("Retrying quotation update in one minute.");

        setTimeout(() => {
            runQuoteUpdateWithRetry();
        }, ONE_MINUTE_MS);
    }
}

// Schedule the next update at midnight UTC.
function scheduleNextDailyQuoteUpdate() {
    const now = new Date();

    const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
    ));

    const delay = nextMidnight.getTime() - now.getTime();

    console.log(
        `Next automatic quotation update: ${nextMidnight.toISOString()}`
    );

    setTimeout(async () => {
        await runQuoteUpdateWithRetry();
        scheduleNextDailyQuoteUpdate();
    }, Math.min(delay, ONE_DAY_MS));
}

async function startServer() {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
            throw new Error("JWT_SECRET is missing or too short.");
        }

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully.");

        // Ensure the unique daily quotation index exists.
        await Quote.init();

        console.log("Quotation database indexes are ready.");

        // Catch up missing quotations when the backend starts.
        await runQuoteUpdateWithRetry();

        // Schedule automatic updates at midnight UTC.
        scheduleNextDailyQuoteUpdate();

        app.listen(PORT, () => {
            console.log(
                `BitChest API running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Failed to start BitChest API:",
            error.message
        );

        process.exit(1);
    }
}

startServer();