const mongoose = require("mongoose");
const { Department } = require("./department.model.js");
const { Employee } = require("./employee.model.js");


const MONGO_URI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/hrms";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(" MongoDB Connected for Seeding");
    return seedData();
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
    process.exit(1);
  });

const registerAndAssign = async (employeeData, password) => {
  const emp = new Employee(employeeData);
  await Employee.register(emp, password);
  await Department.findByIdAndUpdate(employeeData.department, {
    $push: { employees: emp._id },
  });
  return emp;
};

const generateMonthDays = (joinDate) => {
  const days = [];
  const hours = [];
  const today = getSriLankaTime();
  const join = new Date(joinDate);
  join.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);

    days.push(new Date(d));

    if (d < join) {
      hours.push(0);
      continue;
    }

    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      hours.push(0);
      continue;
    }

    const roll = Math.random();
    if (roll < 0.05) hours.push(0);
    else if (roll < 0.10) hours.push(4.5);
    else if (roll < 0.20) hours.push(8.0);
    else hours.push(parseFloat((8 + Math.random()).toFixed(1)));
  }

  return { days, hours };
};

const seedData = async () => {
  try {

    // ── 7 Departments ────────────────────────────────────────────────────────
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

    const [softwareEng, aiResearch] = departments;

    // ── Employee 1 ───────────────────────────────────────────────────────────
    const emp1Join = new Date("2022-06-01");
    const emp1 = await registerAndAssign({
      fullName: "Bob Martinez",
      email: "shresthasanam288@gmail.com",
      accType: "employee",
      department: softwareEng._id,
      status: "active",
      joinDate: emp1Join,
      salary: 1800000,
      phone: "+94-77-555-0101",
      role: "Software Engineer",
      ...generateMonthDays(emp1Join),
    }, "Employee@1234");

    // ── Employee 2 ───────────────────────────────────────────────────────────
    const emp2Join = new Date("2023-03-15");
    const emp2 = await registerAndAssign({
      fullName: "Charlie Davis",
      email: "shresthasanam1999@gmail.com",
      accType: "admin",
      department: aiResearch._id,
      status: "active",
      joinDate: emp2Join,
      salary: 2000000,
      phone: "+94-77-555-0102",
      role: "Backend Developer",
      ...generateMonthDays(emp2Join),
    }, "Employee@1234");

    // ── Employee 3 ───────────────────────────────────────────────────────────
    const emp3Join = new Date("2023-09-20");
    const emp3 = await registerAndAssign({
      fullName: "Diana Smith",
      email: "diana@company.com",
      accType: "employee",
      department: softwareEng._id,
      status: "active",
      joinDate: emp3Join,
      salary: 1900000,
      phone: "+94-77-555-0103",
      role: "Frontend Developer",
      ...generateMonthDays(emp3Join),
    }, "Employee@1234");
    console.log("👤 Employees inserted: 3");

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("\n🎉 Seed complete!");
    console.log("────────────────────────────────────────────────────────────────");
    console.log(`  Departments    : ${departments.length}`);
    console.log(`  Employees      : 3`);
    console.log("────────────────────────────────────────────────────────────────");
    console.log("  Employee 1 → bob@company.com       / Employee@1234");
    console.log("  Employee 2 → charlie@company.com   / Employee@1234");
    console.log("  Employee 3 → diana@company.com     / Employee@1234");
    console.log("────────────────────────────────────────────────────────────────");

    process.exit(0);
  } catch (err) {
    console.error(" Seed failed:", err);
    process.exit(1);
  }
};
