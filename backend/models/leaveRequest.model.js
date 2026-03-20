const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["vacation", "sick", "personal"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

leaveRequestSchema.pre("save", async function () {
  if (this.endDate < this.startDate) {
    throw new Error("endDate must be after startDate");
  }
});

leaveRequestSchema.index({ employeeId: 1 });
leaveRequestSchema.index({ status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
