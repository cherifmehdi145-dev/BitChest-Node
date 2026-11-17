require("dotenv").config();

const mongoose = require("mongoose");
const { randomInt } = require("node:crypto");

const Crypto = require("./models/Crypto");
const Quote = require("./models/Quote");

const cryptocurrencies = [
    ["Bitcoin", "BTC", "bitcoin.png"],
    ["Ethereum", "ETH", "ethereum.png"],
    ["Ripple", "XRP", "ripple.png"],
    ["Bitcoin Cash", "BCH", "bitcoin-cash.png"],
    ["Cardano", "ADA", "cardano.png"],
    ["Litecoin", "LTC", "litecoin.png"],
    ["NEM", "XEM", "nem.png"],
    ["Stellar", "XLM", "stellar.png"],
    ["IOTA", "IOTA", "iota.png"],
    ["Dash", "DASH", "dash.png"]
];

// Matches the professor's getFirstCotation() formula.
function getFirstCotation(name) {
    return name.charCodeAt(0) + randomInt(0, 11);
}

// Matches the professor's getCotationFor() formula.
function getCotationFor(name) {
    const direction = randomInt(0, 100) > 40 ? 1 : -1;

    const characterCode = randomInt(0, 100) > 49
        ? name.charCodeAt(0)
        : name.charCodeAt(name.length - 1);

    return direction * characterCode * (randomInt(1, 11) * 0.01);
}

function toDecimal128(value) {
    return mongoose.Types.Decimal128.fromString(value.toFixed(8));
}

async function seedCryptos() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing from the backend environment.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    let createdCryptos = 0;
    let existingCryptos = 0;
    let createdQuotes = 0;
    let skippedQuoteHistories = 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const [name, symbol, imageFilename] of cryptocurrencies) {
        let crypto = await Crypto.findOne({ symbol });

        if (!crypto) {
            crypto = await Crypto.create({
                name,
                symbol,
                imageFilename
            });

            createdCryptos++;
            console.log(`Created cryptocurrency: ${name} (${symbol})`);
        } else {
            existingCryptos++;
            console.log(`Preserved existing cryptocurrency: ${name} (${symbol})`);

            // Preserve existing metadata; only fill an absent image filename.
            if (!crypto.imageFilename && imageFilename) {
                crypto.imageFilename = imageFilename;
                await crypto.save();
            }
        }

        const existingQuote = await Quote.exists({ crypto: crypto._id });

        if (existingQuote) {
            skippedQuoteHistories++;
            console.log(`Preserved existing quote history: ${symbol}`);
            continue;
        }

        let price = getFirstCotation(name);
        const quotes = [];

        // Generate 30 daily quotations, including today.
        for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
            if (daysAgo !== 29) {
                price += getCotationFor(name);
            }

            // Keep prices strictly positive, as required by the data model.
            price = Math.max(0.00000001, price);

            const quoteDate = new Date(today);
            quoteDate.setUTCDate(quoteDate.getUTCDate() - daysAgo);

            quotes.push({
                crypto: crypto._id,
                price: toDecimal128(price),
                quoteDate
            });
        }

        await Quote.insertMany(quotes);
        createdQuotes += quotes.length;

        console.log(`Created ${quotes.length} quotes for ${symbol}.`);
    }

    console.log("\nSeeding finished.");
    console.log(`New cryptocurrencies: ${createdCryptos}`);
    console.log(`Existing cryptocurrencies preserved: ${existingCryptos}`);
    console.log(`New quotes created: ${createdQuotes}`);
    console.log(`Existing quote histories preserved: ${skippedQuoteHistories}`);
}

seedCryptos()
    .catch((error) => {
        console.error("Seeding failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });