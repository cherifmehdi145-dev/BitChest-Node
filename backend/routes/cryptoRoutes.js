const express = require("express");
const mongoose = require("mongoose");

const Crypto = require("../models/Crypto");
const Quote = require("../models/Quote");
const Holding = require("../models/Holding");
const Transaction = require("../models/Transaction");

const {
    authenticateToken,
    requireRole,
    requirePasswordChanged
} = require("../middleware/authMiddleware");

const router = express.Router();

function isValidDate(value) {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

// Public: list cryptocurrencies and their latest prices.
router.get("/", async (req, res) => {
    try {
        const cryptos = await Crypto.find()
            .sort({ name: 1 })
            .lean();

        const results = await Promise.all(
            cryptos.map(async (crypto) => {
                const latestQuote = await Quote.findOne({
                    crypto: crypto._id
                })
                    .sort({ quoteDate: -1, _id: -1 })
                    .lean();

                return {
                    id: crypto._id,
                    name: crypto.name,
                    symbol: crypto.symbol,
                    imageFilename: crypto.imageFilename,
                    latestPrice: latestQuote
                        ? latestQuote.price.toString()
                        : null,
                    quoteDate: latestQuote
                        ? latestQuote.quoteDate
                        : null
                };
            })
        );

        res.json({ cryptos: results });
    } catch (error) {
        console.error("Failed to list cryptocurrencies:", error.message);
        res.status(500).json({
            message: "Failed to retrieve cryptocurrencies."
        });
    }
});

// Public: get a cryptocurrency and its quote history.
router.get("/:id/quotes", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid cryptocurrency ID."
            });
        }

        const crypto = await Crypto.findById(req.params.id).lean();

        if (!crypto) {
            return res.status(404).json({
                message: "Cryptocurrency not found."
            });
        }

        const quotes = await Quote.find({
            crypto: crypto._id
        })
            .sort({ quoteDate: 1, _id: 1 })
            .lean();

        res.json({
            crypto: {
                id: crypto._id,
                name: crypto.name,
                symbol: crypto.symbol
            },
            quotes: quotes.map((quote) => ({
                price: quote.price.toString(),
                quoteDate: quote.quoteDate
            }))
        });
    } catch (error) {
        console.error("Failed to retrieve quote history:", error.message);
        res.status(500).json({
            message: "Failed to retrieve quote history."
        });
    }
});

// All management routes below require an administrator whose password
// change requirement has been completed.
router.use(
    authenticateToken,
    requireRole("ROLE_ADMIN"),
    requirePasswordChanged
);

// Administrator: create a cryptocurrency.
router.post("/", async (req, res) => {
    try {
        const {
            name,
            symbol,
            imageFilename = null
        } = req.body || {};

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                message: "Name is required and must not exceed 100 characters."
            });
        }

        if (
            typeof symbol !== "string" ||
            !symbol.trim() ||
            symbol.trim().length > 20
        ) {
            return res.status(400).json({
                message: "Symbol is required and must not exceed 20 characters."
            });
        }

        if (
            imageFilename !== null &&
            (typeof imageFilename !== "string" ||
                imageFilename.trim().length > 255)
        ) {
            return res.status(400).json({
                message: "Image filename must be at most 255 characters or null."
            });
        }

        const normalizedSymbol = symbol.trim().toUpperCase();

        const existingCrypto = await Crypto.findOne({
            symbol: normalizedSymbol
        });

        if (existingCrypto) {
            return res.status(409).json({
                message: "A cryptocurrency with this symbol already exists."
            });
        }

        const crypto = await Crypto.create({
            name: name.trim(),
            symbol: normalizedSymbol,
            imageFilename: imageFilename
                ? imageFilename.trim()
                : null
        });

        return res.status(201).json({
            message: "Cryptocurrency created successfully.",
            crypto: {
                id: crypto._id,
                name: crypto.name,
                symbol: crypto.symbol,
                imageFilename: crypto.imageFilename
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A cryptocurrency with this symbol already exists."
            });
        }

        console.error("Failed to create cryptocurrency:", error.message);
        return res.status(500).json({
            message: "Failed to create cryptocurrency."
        });
    }
});

// Administrator: add a price quote.
router.post("/:id/quotes", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid cryptocurrency ID."
            });
        }

        const { price, quoteDate } = req.body || {};

        if (
            price === undefined ||
            price === null ||
            !String(price).trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            return res.status(400).json({
                message: "Price must be a number greater than zero."
            });
        }

        if (!isValidDate(quoteDate)) {
            return res.status(400).json({
                message: "A valid quoteDate is required."
            });
        }

        const crypto = await Crypto.findById(req.params.id);

        if (!crypto) {
            return res.status(404).json({
                message: "Cryptocurrency not found."
            });
        }

        const quote = await Quote.create({
            crypto: crypto._id,
            price: mongoose.Types.Decimal128.fromString(String(price)),
            quoteDate: new Date(quoteDate)
        });

        return res.status(201).json({
            message: "Price quote created successfully.",
            quote: {
                id: quote._id,
                cryptoId: crypto._id,
                symbol: crypto.symbol,
                price: quote.price.toString(),
                quoteDate: quote.quoteDate
            }
        });
    } catch (error) {
        console.error("Failed to create price quote:", error.message);
        return res.status(500).json({
            message: "Failed to create price quote."
        });
    }
});

// Administrator: update cryptocurrency details.
router.patch("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid cryptocurrency ID."
            });
        }

        const allowedFields = ["name", "symbol", "imageFilename"];
        const updates = {};
        const body = req.body || {};
        const suppliedFields = Object.keys(body);

        if (
            suppliedFields.length === 0 ||
            suppliedFields.some((field) => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                message: "Provide at least one supported field: name, symbol, or imageFilename."
            });
        }

        if (Object.prototype.hasOwnProperty.call(body, "name")) {
            if (
                typeof body.name !== "string" ||
                !body.name.trim() ||
                body.name.trim().length > 100
            ) {
                return res.status(400).json({
                    message: "Name is required and must not exceed 100 characters."
                });
            }

            updates.name = body.name.trim();
        }

        if (Object.prototype.hasOwnProperty.call(body, "symbol")) {
            if (
                typeof body.symbol !== "string" ||
                !body.symbol.trim() ||
                body.symbol.trim().length > 20
            ) {
                return res.status(400).json({
                    message: "Symbol is required and must not exceed 20 characters."
                });
            }

            updates.symbol = body.symbol.trim().toUpperCase();
        }

        if (Object.prototype.hasOwnProperty.call(body, "imageFilename")) {
            const imageFilename = body.imageFilename;

            if (
                imageFilename !== null &&
                (typeof imageFilename !== "string" ||
                    imageFilename.trim().length > 255)
            ) {
                return res.status(400).json({
                    message: "Image filename must be at most 255 characters or null."
                });
            }

            updates.imageFilename = imageFilename
                ? imageFilename.trim()
                : null;
        }

        const crypto = await Crypto.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!crypto) {
            return res.status(404).json({
                message: "Cryptocurrency not found."
            });
        }

        return res.json({
            message: "Cryptocurrency updated successfully.",
            crypto: {
                id: crypto._id,
                name: crypto.name,
                symbol: crypto.symbol,
                imageFilename: crypto.imageFilename
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A cryptocurrency with this symbol already exists."
            });
        }

        console.error("Failed to update cryptocurrency:", error.message);
        return res.status(500).json({
            message: "Failed to update cryptocurrency."
        });
    }
});

// Administrator: delete only if no holdings or transactions exist.
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid cryptocurrency ID."
            });
        }

        const crypto = await Crypto.findById(req.params.id);

        if (!crypto) {
            return res.status(404).json({
                message: "Cryptocurrency not found."
            });
        }

        const [holdingExists, transactionExists] = await Promise.all([
            Holding.exists({ crypto: crypto._id }),
            Transaction.exists({ crypto: crypto._id })
        ]);

        if (holdingExists || transactionExists) {
            return res.status(409).json({
                message: "This cryptocurrency cannot be deleted because it has holdings or transaction history."
            });
        }

        await Quote.deleteMany({ crypto: crypto._id });
        await crypto.deleteOne();

        return res.json({
            message: "Cryptocurrency and its quote history deleted successfully."
        });
    } catch (error) {
        console.error("Failed to delete cryptocurrency:", error.message);
        return res.status(500).json({
            message: "Failed to delete cryptocurrency."
        });
    }
});

module.exports = router;