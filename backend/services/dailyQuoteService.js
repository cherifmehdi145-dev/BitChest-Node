const { randomInt } = require("node:crypto");

const mongoose = require("mongoose");
const Crypto = require("../models/Crypto");
const Quote = require("../models/Quote");

const MIN_PRICE = 0.00000001;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Professor's original initial-price formula.
function getFirstCotation(name) {
    return name.charCodeAt(0) + randomInt(0, 11);
}

// Professor's original daily price-variation formula.
function getCotationFor(name) {
    const direction = randomInt(0, 100) > 40 ? 1 : -1;

    const characterCode = randomInt(0, 100) > 49
        ? name.charCodeAt(0)
        : name.charCodeAt(name.length - 1);

    return direction * characterCode * (randomInt(1, 11) * 0.01);
}

// Convert any date into midnight UTC.
function getUtcDay(date) {
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));
}

function toDecimal128(value) {
    return mongoose.Types.Decimal128.fromString(
        value.toFixed(8)
    );
}

// Generate missing quotations for one cryptocurrency.
async function updateCryptoQuotes(crypto, today) {
    const latestQuote = await Quote.findOne({
        crypto: crypto._id
    }).sort({
        quoteDate: -1,
        _id: -1
    });

    let previousPrice = latestQuote
        ? Number(latestQuote.price.toString())
        : null;

    let currentDay = latestQuote
        ? getUtcDay(latestQuote.quoteDate)
        : today;

    if (latestQuote) {
        currentDay = new Date(
            currentDay.getTime() + ONE_DAY_MS
        );
    }

    let created = 0;
    let preserved = 0;

    while (currentDay <= today) {
        const nextDay = new Date(
            currentDay.getTime() + ONE_DAY_MS
        );

        // Check for an existing quote on this UTC day,
        // including quotes entered manually by an administrator.
        const existingQuote = await Quote.findOne({
            crypto: crypto._id,
            quoteDate: {
                $gte: currentDay,
                $lt: nextDay
            }
        }).sort({
            quoteDate: -1,
            _id: -1
        });

        if (existingQuote) {
            previousPrice = Number(
                existingQuote.price.toString()
            );

            preserved++;
            currentDay = nextDay;
            continue;
        }

        let price = previousPrice === null
            ? getFirstCotation(crypto.name)
            : previousPrice + getCotationFor(crypto.name);

        // Never save zero or negative prices.
        price = Math.max(MIN_PRICE, price);

        try {
            await Quote.create({
                crypto: crypto._id,
                price: toDecimal128(price),
                quoteDate: currentDay,
                quoteDay: currentDay
            });

            previousPrice = price;
            created++;

            console.log(
                `[Daily quotes] ${crypto.symbol}: ` +
                `${currentDay.toISOString().slice(0, 10)} ` +
                `= ${price.toFixed(8)}`
            );
        } catch (error) {
            // Another process may have inserted this day's
            // automatic quote at the same time.
            if (error.code !== 11000) {
                throw error;
            }

            const concurrentQuote = await Quote.findOne({
                crypto: crypto._id,
                quoteDay: currentDay
            });

            if (!concurrentQuote) {
                throw error;
            }

            previousPrice = Number(
                concurrentQuote.price.toString()
            );

            preserved++;
        }

        currentDay = nextDay;
    }

    return { created, preserved };
}

// Update all cryptocurrencies through the current UTC day.
async function updateDailyQuotes() {
    const today = getUtcDay(new Date());

    const cryptos = await Crypto.find().sort({
        name: 1
    });

    let totalCreated = 0;
    let totalPreserved = 0;

    for (const crypto of cryptos) {
        const result = await updateCryptoQuotes(
            crypto,
            today
        );

        totalCreated += result.created;
        totalPreserved += result.preserved;
    }

    console.log("\nDaily quotation update finished.");
    console.log(`New quotations: ${totalCreated}`);
    console.log(`Existing daily quotations preserved: ${totalPreserved}`);

    return {
        created: totalCreated,
        preserved: totalPreserved
    };
}

module.exports = {
    updateDailyQuotes,
    getFirstCotation,
    getCotationFor
};