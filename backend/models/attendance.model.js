const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent","on-leave", "late", "half-day"],
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: false,
    },
    logs: [
      {
        log: {
          type: String,
          maxlength: 300
        },
        time: {
          type: Date,
        }
      }
    ],
    workHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = { Attendance: mongoose.model("Attendance", attendanceSchema) };