const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
    {
        crypto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crypto",
            required: true
        },

        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            validate: {
                validator: function (value) {
                    return value != null &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) > 0;
                },
                message: "Quote price must be greater than zero."
            }
        },

        quoteDate: {
            type: Date,
            required: true
        },

        // UTC calendar day used by the automatic daily price updater.
        // Existing historical and manually entered quotes may omit it.
        quoteDay: {
            type: Date,
            default: undefined
        }
    },
    {
        timestamps: true
    }
);

// Supports retrieving a cryptocurrency's historical quotations.
quoteSchema.index({ crypto: 1, quoteDate: -1 });

// Prevents duplicate automatically generated quotations
// for the same cryptocurrency and UTC calendar day.
// Existing quotes without quoteDay are not affected.
quoteSchema.index(
    { crypto: 1, quoteDay: 1 },
    {
        unique: true,
        partialFilterExpression: {
            quoteDay: { $type: "date" }
        }
    }
);

module.exports = mongoose.model("Quote", quoteSchema);
