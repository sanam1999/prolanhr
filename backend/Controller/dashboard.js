const { f200, f400, f404, f500 } = require('../utils/res')
const { getAtandence, getatandencePRG, } = require('../utils/helper')
const LeaveRequest = require("../models/leaveRequest.model");
const { Employee } = require("../models/employee.model");
const { Department } = require("../models/department.model");
const { Attendance } = require("../models/attendance.model");
const { Project } = require("../models/project.model");
const { getSriLankaTime } = require('../utils/srilankantime')
module.exports.admin = async (req, res) => {
    try {
        const department = await Department.find({});
        let dpt = department.map((d) => ({
            id: d._id,
            name: d.name,
            employeeCount: d.employees.length
        }));
        const employeeCount = department.reduce(
            (total, d) => total + d.employees.length,
            0
        );
        const record = await getatandencePRG();
        const leaveReqCount = await LeaveRequest.find({ status: "pending" }).countDocuments();
        const [remaining_employees, on_leave, activeemployee] = await getAtandence();
        const roleCounts = await Employee.aggregate([
            {
                $group: {
                    _id: "$role",
                    rolecount: { $sum: 1 }
                }
            },
        ]);
        let statusData = [
            { name: "Active", value: activeemployee.length },
            { name: "On Leave", value: on_leave.length },
            { name: "Inactive", value: remaining_employees.length }
        ];
        return f200({
            employeeCount,
            departmentCount: department.length,
            departments: dpt,
            attendance: record,
            pendingLeaveRequests: leaveReqCount,
            roleCounts,
            employeeStatus: statusData
        }, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.employee = async (req, res) => {
    const { id } = req.params;

    if (!id) return f400(null, "Employee ID is required", res);

    try {
        const employee = await Employee.findById(id).populate('department');
        if (!employee) return f404("Employee not found", res);

        const projects = await Project.find({ employeeid: id });
        const today1 = getSriLankaTime();

        const attendances = await Attendance.find({
            employeeId: id,
        });
        const leave = today1.setHours(0, 0, 0, 0); // start of today

        const tomorrow = new Date(today1);
        tomorrow.setDate(tomorrow.getDate() + 1); // start of tomorrow

        let status = await Attendance.find({
            employeeId: id,
            date: {
                $gte: today1,
                $lt: tomorrow
            }
        });
        if (status.length === 0 || status[0].status === "absent") {
            status = "absent";
        } else {
            status = "active";

        }


        const AVATAR_COLORS = ["#bbf7d0", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981"];
        const DAY_LABELS = { 1: "M", 2: "T", 3: "W", 4: "T", 5: "F" };

        const getInitials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        const getAvatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

        let workingDays = 0;
        let absentDays = 0;
        let onLeaveDays = 0;
        let lateDays = 0;
        let totalHours = 0;
        const calendarMap = {};
        attendances.forEach(a => {
            const dateKey = new Date(a.date).toISOString().slice(0, 10);


            if (a.status === "present") {
                workingDays++;
                totalHours += a.workHours ?? 0;
                calendarMap[dateKey] = "present";
            } else if (a.status === "late") {
                workingDays++;
                lateDays++;
                totalHours += a.workHours ?? 0;
                calendarMap[dateKey] = "late";
            } else if (a.status === "absent") {
                absentDays++;
                calendarMap[dateKey] = "absent";
            } else if (a.status === "on-leave" || a.status === "leave") {
                onLeaveDays++;
                calendarMap[dateKey] = "leave";
            }
        });

        const totalRecorded = workingDays + absentDays + onLeaveDays;
        const attendanceRate = totalRecorded > 0
            ? parseFloat(((workingDays / totalRecorded) * 100).toFixed(1)) : 0;
        const avgHoursPerDay = workingDays > 0
            ? parseFloat((totalHours / workingDays).toFixed(1)) : 0;

        const attendanceCalendar = Object.entries(calendarMap)
            .map(([date, status]) => ({ date, status }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const today = getSriLankaTime();
        const last10WorkingDays = [];
        const current = new Date(today);

        while (last10WorkingDays.length < 10) {
            const dow = current.getDay();
            if (dow >= 1 && dow <= 5) {
                last10WorkingDays.unshift(new Date(current));
            }
            current.setDate(current.getDate() - 1);
        }

        const attendanceLookup = {};
        attendances.forEach(a => {
            const key = new Date(a.date).toISOString().slice(0, 10);
            attendanceLookup[key] = a.workHours ?? 0;
        });

        const weeklyHours = last10WorkingDays.map(date => {
            const key = date.toISOString().slice(0, 10);
            return {
                date,
                day: DAY_LABELS[date.getDay()],
                hours: attendanceLookup[key] ?? 0,
            };
        });

        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => p.progress === 100).length;

        return f200({
            employee: {
                id: employee._id,
                name: employee.fullName,
                role: employee.role,
                department: employee.department?.name ?? "—",
                avatar: getInitials(employee.fullName),
                avatarColor: getAvatarColor(employee.fullName),
                joinDate: employee.joinDate,
                status: status,
            },
            attendanceSummary: {
                workingDays,
                absentDays,
                onLeaveDays,
                lateDays,
                avgHoursPerDay,
                attendanceRate,
            },
            projectSummary: {
                totalProjects,
                completedProjects,
                totalWorkingHours: parseFloat(totalHours.toFixed(1)),
                attendanceRate,
            },
            weeklyHours,
            attendanceCalendar,
        }, res);

    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};