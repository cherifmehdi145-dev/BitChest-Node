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
        }
    },
    {
        timestamps: true
    }
);

quoteSchema.index({ crypto: 1, quoteDate: -1 });

module.exports = mongoose.model("Quote", quoteSchema);
