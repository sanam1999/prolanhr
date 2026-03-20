const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["national", "religious", "optional", "other"],
            required: true,
        },
    },
    { timestamps: true }
);


holidaySchema.index({ type: 1 });

module.exports = { Holiday: mongoose.model("Holiday", holidaySchema) };




