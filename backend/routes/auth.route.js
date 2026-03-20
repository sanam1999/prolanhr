// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Employee } = require("../models/employee.model");
const { sendLoginOTPEmail, sendPasswordResetOTPEmail, sendLoginNotificationEmail, } = require('../utils/mailer');
const { whoIs } = require('../middleware/authMiddleware')
const otpStore = new Map();

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit
}

function signToken(employee) {
    return jwt.sign(
        {
            id: employee._id,
            email: employee.email,
            name: employee.fullName,
            accType: employee.accType,
            role: employee.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );
}

// ─── Middleware: verify JWT ───────────────────────────────────────────────────
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access token required" });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token" });
        req.user = payload;
        next();
    });
}

router.post("/login", whoIs, (req, res, next) => {


    passport.authenticate("local", { session: false }, async (err, employee, info) => {
        if (err) return next(err);
        if (!employee) {
            return res.status(401).json({ message: info?.message || "Invalid email or password" });
        }

        try {
            const otp = generateOTP();
            otpStore.set(employee.email, {
                otp,
                expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
                purpose: "login",
                employeeId: employee._id.toString(),
            });

            sendLoginOTPEmail(employee.email, otp);

            res.json({
                message: "OTP sent to your email",
                email: employee.email, // return email so frontend can display it
            });
        } catch (mailErr) {
            console.error("Mail error:", mailErr);
            res.status(500).json({ message: "Failed to send OTP email" });
        }
    })(req, res, next);
});

router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "email and otp are required" });

        const record = otpStore.get(email);
        if (!record || record.purpose !== "login") {
            return res.status(400).json({ message: "No pending OTP for this email" });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: "OTP has expired. Please login again." });
        }
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Incorrect OTP" });
        }

        otpStore.delete(email);

        const employee = await Employee.findById(record.employeeId).populate("department");
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        const token = signToken(employee);
        sendLoginNotificationEmail(employee.email, employee.fullName);
        res.json({
            message: "Login successful",
            token,
            user: {
                id: employee._id,
                name: employee.fullName,
                email: employee.email,
                role: employee.role,
                accType: employee.accType,
                avatar: employee.avatar,
                department: employee.department?.name,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/resend-otp", async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) return res.status(400).json({ message: "email and purpose are required" });

        const employee = await Employee.findOne({ email });
        if (!employee) return res.status(404).json({ message: "No account found with this email" });

        const otp = generateOTP();
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            purpose,
            employeeId: employee._id.toString(),
        });

        sendPasswordResetOTPEmail(email, otp)
        res.json({ message: "OTP resent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {

        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const employee = await Employee.findOne({ email });
        // Always return 200 to avoid email enumeration
        if (!employee) return res.json({ message: "If this email exists, a reset code was sent" });

        const otp = generateOTP();

        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            purpose: "reset",
            employeeId: employee._id.toString(),
        });
        sendPasswordResetOTPEmail(email, otp);

        res.json({ message: "Reset code sent to your email", email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "email, otp, and newPassword are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const record = otpStore.get(email);
        if (!record || record.purpose !== "reset") {
            return res.status(400).json({ message: "No pending reset request for this email" });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        if (record.otp !== otp) {
            return res.status(400).json({ message: "Incorrect OTP" });
        }

        otpStore.delete(email);

        // passport-local-mongoose provides setPassword()
        const employee = await Employee.findById(record.employeeId);
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        await employee.setPassword(newPassword);
        await employee.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/me", authenticateToken, async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.id)
            .select("-hash -salt")
            .populate("department");
        if (!employee) return res.status(404).json({ message: "Not found" });
        res.json({ user: employee });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = { router, authenticateToken };