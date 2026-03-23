const LeaveRequest = require("../models/leaveRequest.model");
const { Employee } = require("../models/employee.model");
const { Department } = require("../models/department.model");
const { Attendance } = require("../models/attendance.model");
const { Project } = require("../models/project.model");
const { Holiday } = require("../models/holiday.model");
const Notification = require("../models/notification.model");
const { getSriLankaTime } = require('./srilankantime')
function getLastTenWeekHours(hours) {
    return hours.slice().reduce((sum, h) => sum + h, 0);
}
function attendanceStatuscount(attendance) {
    let present = 0, absent = 0, late = 0, half_day = 0;

    attendance.forEach((a) => {
        switch (a.status?.toLowerCase()) {
            case "present": present++; break;
            case "absent": absent++; break;
            case "late": late++; break;
            case "half-day": half_day++; break;
        }
    });

    return { present, absent, late, half_day };
}
async function getatandencePRG() {
    const now = getSriLankaTime();

    const year = now.getFullYear();
    const mon = String(now.getMonth() + 1).padStart(2, "0");
    const start = new Date(Date.UTC(year, mon - 1, 1));
    const end = new Date(Date.UTC(year, mon, 1));
    const lastStart = new Date(Date.UTC(year, mon - 2, 1));
    const lastEnd = new Date(Date.UTC(year, mon - 1, 1));

    const [records, lastRecords] = await Promise.all([
        Attendance.find({ date: { $gte: start, $lt: end } }),
        Attendance.find({ date: { $gte: lastStart, $lt: lastEnd } }),
    ]);

    const total = records.length;
    const present = records.filter(r => ["present", "late", "half-day"].includes(r.status)).length;
    const lastPresent = lastRecords.filter(r => ["present", "late", "half-day"].includes(r.status)).length;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
    const lastRate = lastRecords.length > 0 ? ((lastPresent / lastRecords.length) * 100).toFixed(1) : "0.0";
    const change = (Number(rate) - Number(lastRate)).toFixed(1);
    const changeNum = Number(change);

    const record = {
        rate: `${rate}%`,
        change: `${changeNum > 0 ? "+" : ""}${change}% vs last month`,
        changeType: changeNum >= 0 ? "positive" : "negative",
        thisMonthCount: records.length,
        lastMonthCount: lastRecords.length,
    };
    return record;
}
async function getAtandence() {
    const today = getSriLankaTime();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let activeemployee = await Attendance.find({
        date: { $gte: today, $lt: tomorrow }
    }).populate({
        path: 'employeeId',
        populate: { path: 'department' }
    });
    activeemployee = addstatus(activeemployee, "active");

    let on_leave = await LeaveRequest.find({
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today }
    }).populate({
        path: 'employeeId',
        populate: { path: 'department' }
    });
    on_leave = addstatus(on_leave, "on-leave");

    const activeAndLeaveIds = [
        ...activeemployee.map(a => a.employeeId._id.toString()),
        ...on_leave.map(l => l.employeeId._id.toString())
    ];

    const remaining = await Employee.find({
        _id: { $nin: activeAndLeaveIds },
        accType: "employee"
    }).populate('department');

    const remaining_employees = remaining.map(emp => ({
        employeeId: emp,
        status: "inactive"
    }));

    return [remaining_employees, on_leave, activeemployee];
}
function addstatus(records, status) {
    return records.map(record => ({
        ...record.toObject(),
        todayDtatus: status
    }));
}
module.exports = {
    addstatus,
    getAtandence,
    getatandencePRG,
    attendanceStatuscount,
    getLastTenWeekHours
}