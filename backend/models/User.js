const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        password: {
            type: String,
            required: true,
            select: false,
            minlength: 8
        },

        roles: {
            type: [{
                type: String,
                enum: ["ROLE_ADMIN", "ROLE_CLIENT"]
            }],
            default: ["ROLE_CLIENT"],
            validate: {
                validator: function (roles) {
                    return roles.length > 0;
                },
                message: "A user must have at least one role."
            }
        },

        euroBalance: {
            type: mongoose.Schema.Types.Decimal128,
            default: () => mongoose.Types.Decimal128.fromString("500.00")
        },

        mustChangePassword: {
    type: Boolean,
    default: false
},

isActive: {
    type: Boolean,
    default: true
}
    },
    {
        timestamps: true
    }
);


userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);


