require("dotenv").config();

const mongoose = require("mongoose");
const { randomInt } = require("node:crypto");

const Crypto = require("./models/Crypto");
const Quote = require("./models/Quote");

// These dates match the historical period already used
// by the other nine cryptocurrencies.
const START_DATE = "2026-09-27";
const END_DATE = "2026-10-26";

function getFirstCotation(name) {
    return name.charCodeAt(0) + randomInt(0, 11);
}

function getCotationFor(name) {
    const direction = randomInt(0, 100) > 40 ? 1 : -1;

    const characterCode = randomInt(0, 100) > 49
        ? name.charCodeAt(0)
        : name.charCodeAt(name.length - 1);

    return direction * characterCode * (randomInt(1, 11) * 0.01);
}

function toDecimal128(value) {
    return mongoose.Types.Decimal128.fromString(
        value.toFixed(8)
    );
}

function getUtcDate(dateString) {
    return new Date(`${dateString}T00:00:00.000Z`);
}

async function repairBitcoinQuotes() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB.");

    const bitcoin = await Crypto.findOne({ symbol: "BTC" });

    if (!bitcoin) {
        throw new Error("Bitcoin (BTC) was not found.");
    }

    const startDate = getUtcDate(START_DATE);
    const endDate = getUtcDate(END_DATE);

    const existingQuotes = await Quote.find({
        crypto: bitcoin._id,
        quoteDate: {
            $gte: startDate,
            $lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
        }
    }).sort({ quoteDate: 1, _id: 1 });

    // Group existing quotations by UTC calendar day.
    const quotesByDay = new Map();

    for (const quote of existingQuotes) {
        const day = quote.quoteDate.toISOString().slice(0, 10);

        if (!quotesByDay.has(day)) {
            quotesByDay.set(day, []);
        }

        quotesByDay.get(day).push(quote);
    }

    let price = null;
    let inserted = 0;

    for (
        let currentDate = new Date(startDate);
        currentDate <= endDate;
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    ) {
        const day = currentDate.toISOString().slice(0, 10);
        const existingDayQuotes = quotesByDay.get(day);

        if (existingDayQuotes?.length) {
            // Preserve all existing records and use the latest
            // quotation of that day as the next day's starting price.
            const latestQuote = existingDayQuotes[
                existingDayQuotes.length - 1
            ];

            price = Number(latestQuote.price.toString());

            console.log(`Preserved ${day}: €${price}`);
            continue;
        }

        if (price === null) {
            price = getFirstCotation(bitcoin.name);
        } else {
            price += getCotationFor(bitcoin.name);
        }

        // Never store a zero or negative quotation.
        price = Math.max(0.00000001, price);

        await Quote.create({
            crypto: bitcoin._id,
            price: toDecimal128(price),
            quoteDate: new Date(currentDate)
        });

        inserted++;

        console.log(`Inserted ${day}: €${price}`);
    }

    console.log("\nBitcoin history repair finished.");
    console.log(`New quotations inserted: ${inserted}`);
    console.log(`Existing quotations preserved: ${existingQuotes.length}`);
}

repairBitcoinQuotes()
    .catch((error) => {
        console.error("Repair failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });