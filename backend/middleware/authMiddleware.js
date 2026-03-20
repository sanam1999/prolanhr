const { Employee } = require("../models/employee.model");
const jwt = require("jsonwebtoken");
const whoIs = async (req, res, next) => {
    try {
        const email = req.body.email;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const employee = await Employee.findOne({ email });
        if (!employee) {
            return next()
        }

        const requestUrl = req.get('referer');
        const websiteUrl = process.env.WEBSITE_URL;
        const adminUrl = process.env.ADMIN_URL;

        // ✅ Better URL matching (handles trailing slashes)
        const isFromWebsite = requestUrl?.startsWith(websiteUrl);
        const isFromAdmin = requestUrl?.startsWith(adminUrl);

        if (isFromWebsite && employee.accType === "employee") {
            return next();
        }

        if (isFromAdmin && employee.accType === "admin") {
            return next();
        }

        return res.status(402).json({
            message: "Unauthorized - Access denied"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};



const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] ?? req.query.token;

        if (!token) {
            return res.status(402).json({
                message: "No token provided. Please log in.",
                code: "NO_TOKEN"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token has expired. Please log in again.",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token.",
                code: "INVALID_TOKEN"
            });
        }

        return res.status(401).json({
            message: "Authentication failed.",
            code: "AUTH_FAILED"
        });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(402).json({
            message: "User not authenticated.",
            code: "NOT_AUTHENTICATED"
        });
    }

    if (req.user.accType === "admin") {
        return next();
    }

    return res.status(402).json({
        message: "Admin access required. Unauthorized.",
        code: "FORBIDDEN"
    });
};

const isEmployee = (req, res, next) => {
    if (!req.user) {
        return res.status(402).json({
            message: "User not authenticated.",
            code: "NOT_AUTHENTICATED"
        });
    }

    if (req.user.accType === "employee") {
        return next();
    }
    return res.status(402).json({
        message: "Employee access required. Unauthorized.",
        code: "FORBIDDEN"
    });
};


module.exports = {
    authMiddleware,
    isAdmin,
    isEmployee,
    whoIs
};