const { f200, f201, f400,  f404, f500 } = require('../utils/res')
const { addstatus, getAtandence, } = require('../utils/helper')
const LeaveRequest = require("../models/leaveRequest.model");
const { Employee } = require("../models/employee.model");
const { Department } = require("../models/department.model");
const { Attendance } = require("../models/attendance.model");
const { Project } = require("../models/project.model");
const {  sendWelcomeEmail, } = require('../utils/mailer.js')
const { v4: uuidv4 } = require("uuid");


module.exports.getemployee = async (req, res) => {
    try {
        const [remaining_employees, on_leave, activeemployee] = await getAtandence()
        const allEmployees = [
            ...on_leave,
            ...activeemployee,
            ...remaining_employees
        ].map(record => ({
            _id: record.employeeId._id,
            fullName: record.employeeId.fullName,
            email: record.employeeId.email,
            phone: record.employeeId.phone,
            avatar: record.employeeId.avatar,
            role: record.employeeId.role,
            department: record.employeeId.department.name,
            status: record.todayDtatus || record.status, // ← Fix typo: todayDtatus → todayStatus
            joinDate: record.employeeId.joinDate,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
        }));

        const uniqueEmployees = Object.values(
            allEmployees.reduce((acc, emp) => {
                acc[emp._id.toString()] = emp;
                return acc;
            }, {})
        );

        if (!uniqueEmployees?.length) return f400(null, "Employee record is empty", res);
        return f200(uniqueEmployees, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};

module.exports.postemplyee = async (req, res) => {
    try {
        const { name, email, department, salary, phone, role, joinDate } = req.body;

        // Validation
        if (!name || !email || !department || !role) {
            return f400(null, "name, email, department and role are required", res);
        }

        // Check if email already exists
        const existingUser = await Employee.findOne({ email: email });
        if (existingUser) {
            return f400(null, "Email already exists", res); // ← Changed "Username" to "Email"
        }

        // Find department
        const deptRecord = await Department.findOne({ name: department });
        if (!deptRecord) {
            return f404("Department not found", res);
        }

        // Generate password
        const code = uuidv4().slice(0, 5).toUpperCase();
        const tempPassword = `Prolab@${code}`;

        // Create employee
        const employee = new Employee({
            fullName: name,
            email: email,
            accType: "employee",
            department: deptRecord._id,
            status: "active",
            salary: salary || 0, // ← Add default value
            phone: phone || "", // ← Add default value
            role: role,
            joinDate: joinDate || new Date(),
        });

        // Register employee with password
        const registerUser = await Employee.register(employee, tempPassword);

        // Add employee to department
        await Department.findByIdAndUpdate(
            deptRecord._id,
            { $push: { employees: registerUser._id } },
            { new: true }
        );

        sendWelcomeEmail(email, name, tempPassword);
        return f200(registerUser, res);
    } catch (error) {
        console.error(error); // ← Changed from console.log to console.error
        return f500("Server error", res);
    }
};

module.exports.getDepartmentEmployeesWithStatus = async (req, res) => {
    try {
        const { _id } = req.params;
        if (!_id) return f400(null, "Department ID is required", res);

        const employees = await Department.findById({ _id: _id }).populate("employees");
        if (!employees) return f404("Department not found", res);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const employeeIds = employees.employees.map(emp => emp._id);

        let activeemployee = await Attendance.find({
            date: { $gte: today, $lt: tomorrow },
            employeeId: { $in: employeeIds }
        }).populate({
            path: 'employeeId',
            populate: { path: 'department' }
        });
        activeemployee = addstatus(activeemployee, "active");

        let on_leave = await LeaveRequest.find({
            status: "approved",
            startDate: { $lte: today },
            endDate: { $gte: today },
            employeeId: { $in: employeeIds }
        }).populate({
            path: 'employeeId',
            populate: { path: 'department' }
        });
        on_leave = addstatus(on_leave, "on-leave");

        const activeAndLeaveIds = [
            ...activeemployee.map(a => a.employeeId._id.toString()),
            ...on_leave.map(l => l.employeeId._id.toString())
        ];

        const remaining = employees.employees.filter(
            emp => !activeAndLeaveIds.includes(emp._id.toString())
        );

        const remaining_employees = remaining.map(emp => ({
            employeeId: emp,
            status: "inactive"
        }));

        const allEmployees = [
            ...on_leave,
            ...activeemployee,
            ...remaining_employees
        ].map(record => ({
            _id: record.employeeId._id,
            fullName: record.employeeId.fullName,
            email: record.employeeId.email,
            phone: record.employeeId.phone,
            avatar: record.employeeId.avatar,
            role: record.employeeId.role,
            department: record.employeeId.department.name,
            status: record.todayDtatus || record.status,
            joinDate: record.employeeId.joinDate,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
        }));
        const uniqueEmployees = Object.values(
            allEmployees.reduce((acc, emp) => {
                acc[emp._id.toString()] = emp;
                return acc;
            }, {})
        );

        return f200(Array.from(uniqueEmployees), res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.deleteEmployee = async (req, res) => {
    try {
        const employeeId = req.params._id;

        if (!employeeId) return f400(null, "Invalid employee ID format", res);

        const deletedUser = await Employee.findByIdAndDelete(employeeId);
        if (!deletedUser) return f404("Employee not found", res);

        await Promise.all([
            Department.updateMany(
                { employees: employeeId },
                { $pull: { employees: employeeId } }
            ),
            Project.updateMany(
                { employeeid: employeeId },
                { $pull: { employeeid: employeeId } }
            ),
            Attendance.deleteMany({ employeeId: employeeId }),
            LeaveRequest.deleteMany({ employeeId: employeeId }),
        ]);

        return f200({ message: "Employee deleted successfully" }, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.getEmployeesByDepartment = async (req, res) => {
    try {
        const id = req.params._id;
        if (!id) return f400(null, "Department ID is required", res);

        const deptExists = await Department.findById(id);
        if (!deptExists) return f404("Department not found", res);

        const employee = await Employee.find({ department: id, accType: "employee" });
        if (!employee.length) return f404("No employees found in this department", res);

        return f200(employee, res);
    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};
module.exports.getAllEmployees = async (req, res) => {
    const employees = await Employee.find({ accType: "employee" }).populate('department')
    return f200(employees, res);
};

