const mongoose = require("mongoose");
const { Department } = require("./models/department.model.js");
const { Employee } = require("./models/employee.model.js");

const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/hrms";

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected for Seeding");
        return seedData();
    })
    .catch((err) => {
        console.error(" MongoDB connection error:", err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear existing data
        await Promise.all([
            Department.deleteMany(),
            Employee.deleteMany(),
        ]);
        console.log(" Cleared existing data");

        // ─────────────────────────────────────────────
        // Departments (7)
        // ─────────────────────────────────────────────
        const departments = await Department.insertMany([
            { name: "Software Engineering Department", head: "Alice Johnson", budget: 500000 },
            { name: "AI & Research Department", head: "Dr. Mark Lee", budget: 450000 },
            { name: "Cybersecurity Department", head: "Sara Williams", budget: 300000 },
            { name: "Project Management Office (PMO)", head: "James Carter", budget: 250000 },
            { name: "Sales & Business Development", head: "Emily Davis", budget: 400000 },
            { name: "Marketing & Branding", head: "Chris Brown", budget: 200000 },
            { name: "Administration & Finance", head: "Nancy White", budget: 350000 },
        ]);
        console.log("🏢 Departments inserted:", departments.length);

        // ─────────────────────────────────────────────
        // Admin Employees (3 users)
        // ─────────────────────────────────────────────
        const adminUsers = [
            {
                fullName: "Alice Johnson",
                email: "alice@company.com",
                phone: "+1-555-0101",
                department: departments[0]._id,
            },
            {
                fullName: "Mark Lee",
                email: "mark@company.com",
                phone: "+1-555-0102",
                department: departments[1]._id,
            },
            {
                fullName: "Sara Williams",
                email: "sara@company.com",
                phone: "+1-555-0103",
                department: departments[2]._id,
            },
        ];

        for (const adminData of adminUsers) {
            const admin = new Employee({
                fullName: adminData.fullName,
                email: adminData.email,
                role: "admin",
                department: adminData.department,
                status: "active",
                joinDate: new Date("2020-01-15"),
                salary: 95000,
                phone: adminData.phone,
            });
            await Employee.register(admin, "admin123");
        }

        const employees = await Employee.find();
        console.log(" Admin users inserted:", employees.length);

        console.log("\n Seed complete!");
        console.log("──────────────────────────────────────────────────");
        console.log("  Admin 1 → alice@company.com  / admin123");
        console.log("  Admin 2 → mark@company.com   / admin123");
        console.log("  Admin 3 → sara@company.com   / admin123");
        console.log("──────────────────────────────────────────────────");

        process.exit(0);
    } catch (err) {
        console.error(" Seed failed:", err);
        process.exit(1);
    }
};