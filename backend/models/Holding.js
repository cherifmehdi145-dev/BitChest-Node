const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        crypto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crypto",
            required: true
        },

        quantity: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            default: () => mongoose.Types.Decimal128.fromString("0"),
            validate: {
                validator: function (value) {
                    if (value == null) {
                        return false;
                    }

                    const quantity = Number(value.toString());

                    return Number.isFinite(quantity) && quantity >= 0;
                },
                message: "Holding quantity cannot be negative."
            }
        },

        // Remaining acquisition cost for this holding.
        // Null means the historical cost basis has not yet been verified.
        costBasis: {
            type: mongoose.Schema.Types.Decimal128,
            default: null,
            validate: {
                validator: function (value) {
                    if (value == null) {
                        return true;
                    }

                    const cost = Number(value.toString());

                    return Number.isFinite(cost) && cost >= 0;
                },
                message: "Cost basis cannot be negative."
            }
        }
    },
    {
        timestamps: true
    }
);

holdingSchema.index(
    { user: 1, crypto: 1 },
    { unique: true }
);

module.exports = mongoose.model("Holding", holdingSchema);
