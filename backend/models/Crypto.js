const mongoose = require("mongoose");

const cryptoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        symbol: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 20
        },

        imageFilename: {
            type: String,
            default: null,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

cryptoSchema.index({ symbol: 1 }, { unique: true });

module.exports = mongoose.model("Crypto", cryptoSchema);
