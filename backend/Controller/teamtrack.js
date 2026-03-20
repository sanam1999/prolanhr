const { f200, f400, f404, f500 } = require('../utils/res')
const { getAtandence, attendanceStatuscount, getLastTenWeekHours } = require('../utils/helper')

const { Employee } = require("../models/employee.model");
const { Attendance } = require("../models/attendance.model");
const { Project } = require("../models/project.model");

module.exports.getTeamTrackEmployees = async (req, res) => {
    try {
        const [remaining_employees, on_leave, activeemployee] = await getAtandence()
        const allEmployees = [
            ...on_leave,
            ...activeemployee,
            ...remaining_employees
        ].map(record => ({
            _id: record.employeeId._id,
            name: record.employeeId.fullName,
            avatar: record.employeeId.avatar,
            role: record.employeeId.role,
            department: record.employeeId.department.name,
            status: record.todayDtatus || record.status,
            task: record.logs?.[0]?.log ?? null
        }));
        const uniqueEmployees = Object.values(
            allEmployees.reduce((acc, emp) => {
                acc[emp._id.toString()] = emp;
                return acc;
            }, {})
        );

        return f200(uniqueEmployees, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.getEmployeeLogData = async (req, res) => {
    try {
        console.log("dsfsdfsdfsd")
        const _id = req.params._id
        if (!_id) return f400(null, "ID is required", res);
        const logdatas = await Attendance.find({ employeeId: _id }).sort({ date: 1 });

        const formatTime = (isoString) => {
            if (!isoString) return "-";
            const d = new Date(isoString);
            let hours = d.getUTCHours();
            const minutes = String(d.getUTCMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "pm" : "am";
            hours = hours % 12 || 12;
            return `${hours}.${minutes} ${ampm}`;
        };

        const formatDate = (isoString) => {
            const d = new Date(isoString);
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(d.getUTCDate()).padStart(2, "0");
            return `${yyyy}/${mm}/${dd}`;
        };

        const formatted = logdatas.map((entry) => ({
            date: formatDate(entry.date),
            entryTime: formatTime(entry.checkIn),
            leaveTime: formatTime(entry.checkOut),
            tasks: entry.logs.map((l) => ({
                time: formatTime(l.time),
                desc: l.log,
            })),
        }));
        return f200(formatted, res)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
module.exports.getEmployeeStatistics = async (req, res) => {
    console.log("sdfsdf")
    try {
        const { _id } = req.params;
        if (!_id) return f400(null, "Employee ID is required", res);

        const employee = await Employee.findById(_id).populate("department");
        if (!employee) return f404("Employee not found", res);

        const projects = await Project.find({ employeeid: _id });
        const attendance = await Attendance.find({ employeeId: _id });
        const { present, absent, late, half_day } = attendanceStatuscount(attendance);
        const rawHours = employee.hours.slice(-10);
        const weeklyHours = Array(10).fill(0).map((_, i) => {
            const offset = 10 - rawHours.length;
            return i >= offset ? rawHours[i - offset] : 0;
        });
        const totalHours = getLastTenWeekHours(employee.hours);
        const totalWorkingDays = employee.day.filter((d, i) => {
            return new Date(d) >= new Date(employee.joinDate) && employee.hours[i] > 0;
        }).length;
        const completeProject = projects.reduce((count, p) => {
            return p.progress === 100 ? count + 1 : count;
        }, 0);

        return f200({
            name: employee.fullName,
            deparment: employee.department.name,
            totalproject: projects.length,
            weeklyHours: weeklyHours,
            totalHours: totalHours,
            totalwaorkingday: totalWorkingDays,
            present, absent, late, half_day, completeProject,
            status: employee.status,
            projects: projects.map(p => ({
                label: p.name,
                pct: p.progress,
            })),
        }, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};

