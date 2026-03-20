const mongoose = require("mongoose");
const passportLocalMongoose =
  require("passport-local-mongoose").default ||
  require("passport-local-mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    joinDate: {
      type: Date,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default:
        "https://st.depositphotos.com/1537427/3571/v/450/depositphotos_35716051-stock-illustration-user-icon-vector.jpg",
    },

    role: {
      type: String,
      default: "employee",
    },

    accType: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    day: [
      {
        type: Date
      }
    ],
    hours: [
      {
        type: Number
      }
    ]
  },
  { timestamps: true }
);

employeeSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ accType: 1 });

module.exports = {
  Employee: mongoose.model("Employee", employeeSchema),
};