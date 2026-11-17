const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        crypto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crypto",
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: ["BUY", "SELL"]
        },

        quantity: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            validate: {
                validator: function (value) {
                    return value != null &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) > 0;
                },
                message: "Transaction quantity must be greater than zero."
            }
        },

        pricePerUnit: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            validate: {
                validator: function (value) {
                    return value != null &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) > 0;
                },
                message: "Price per unit must be greater than zero."
            }
        },

        totalAmount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            validate: {
                validator: function (value) {
                    return value != null &&
                        Number.isFinite(Number(value.toString())) &&
                        Number(value.toString()) > 0;
                },
                message: "Transaction total must be greater than zero."
            }
        },

        createdAt: {
            type: Date,
            default: Date.now,
            immutable: true
        }
    },
    {
        timestamps: false
    }
);

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
