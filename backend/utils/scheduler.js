// utility/scheduler.js
const { Employee } = require("../models/employee.model");
const { Attendance } = require("../models/attendance.model");
const Notification = require("../models/notification.model.js");
const LeaveRequest = require("../models/leaveRequest.model");
const { eventEmitter } = require("../routes/notification"); //  make sure this is imported
const cron = require('node-cron');

const {
    sendCheckInReminderEmail,
    sendTaskReminder10AM,
    sendTaskReminder12PM,
    sendTaskReminder2PM,
    sendCheckOutReminderEmail,
} = require('./mailer');


async function findEmployees() {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["present", "late", "half-day"] },
    }).populate({
        path: "employeeId",
        match: { accType: "employee", status: "active" },
        select: "email fullName",
    });



    const activeEmployees = todayAttendance
        .filter(record => record.employeeId !== null)
        .map(record => ({
            employeeEmail: record.employeeId.email,
            employeeName: record.employeeId.fullName,
            _id: record.employeeId._id,
        }));

    const allEmployeeDocs = await Employee.find(
        { accType: "employee", status: "active" },
        { email: 1, fullName: 1 }
    );

    const allEmployees = allEmployeeDocs.map(emp => ({
        employeeEmail: emp.email,
        employeeName: emp.fullName,
        _id: emp._id,
    }));

    return { activeEmployees, allEmployees };
}


async function sendNotificationToMany(employeeIds, msg) {
    if (!employeeIds || employeeIds.length === 0) return;

    const notificationPromises = employeeIds.map(employeeId =>
        Notification.create({
            userId: employeeId,
            senderName: "HR",
            position: "HR",
            title: msg.title,
            message: msg.message,
            type: "info",
            read: false,
            time: new Date().toLocaleTimeString(),
        })
    );

    const notifications = await Promise.all(notificationPromises);

    notifications.forEach((notification, index) => {
        eventEmitter.emit(`notify:${employeeIds[index]}`, notification);
    });

    return notifications;
}

async function markAttendance() {
    const employeeIds = await Employee.find({
        accType: "employee",
        status: "active"
    }).select("_id");

    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // "2026-03-19"
    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

    const attendance = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay },
    }).select("employeeId date");

    const employeesOnLeave = await LeaveRequest.find({
        startDate: { $lte: startOfDay },
        endDate: { $gte: endOfDay },
        status: "approved"
    }).select("employeeId");

    const attendanceEmployeeIds = attendance.map((a) => a.employeeId.toString());
    const leaveEmployeeIds = employeesOnLeave.map((l) => l.employeeId.toString());

    const employeesWithoutAttendance = employeeIds.filter((emp) => {
        const empId = emp._id.toString();
        return !attendanceEmployeeIds.includes(empId) && !leaveEmployeeIds.includes(empId);
    });

    console.log("Employees on leave:", employeesOnLeave.length);
    console.log("Employees without attendance (absent):", employeesWithoutAttendance.length);
    const leaveRecords = employeesOnLeave.map((emp) => ({
        employeeId: emp.employeeId,
        date: startOfDay,
        status: "on-leave",
        checkIn: startOfDay,
        checkOut: endOfDay,
        note: "On approved leave"
    }));

    const absentRecords = employeesWithoutAttendance.map((emp) => ({
        employeeId: emp._id,
        date: startOfDay,
        status: "absent",
        checkIn: startOfDay,
        checkOut: null,
        note: "Marked absent - no attendance record"
    }));

    const allRecords = [...leaveRecords, ...absentRecords];

    allRecords.length > 0 && await Attendance.insertMany(allRecords)
    return
}



module.exports.startScheduler = () => {
    const options = { timezone: 'Asia/Colombo' };

    // ── 7:45 AM — Check-in Reminder → ALL employees ──────────────────────────
    cron.schedule('45 7 * * 1-5', async () => {
        console.log('7:45 AM — Check-in reminder sending...');
        const { allEmployees } = await findEmployees();

        const emails = allEmployees.map(e => e.employeeEmail);
        const employeeIds = allEmployees.map(e => e._id);

        await sendCheckInReminderEmail(emails, "Team");
        await sendNotificationToMany(employeeIds, {
            title: "Check-In Reminder",
            message: "Please mark your attendance before 8:30 AM.",
        });

        console.log('Check-in reminder sent.');
    }, options);

    // ── 10:00 AM — Task Reminder → ACTIVE employees ───────────────────────────
    cron.schedule('0 10 * * 1-5', async () => {
        console.log('10:00 AM — Task reminder sending...');
        const { activeEmployees } = await findEmployees();

        const emails = activeEmployees.map(e => e.employeeEmail);
        const employeeIds = activeEmployees.map(e => e._id);

        await sendTaskReminder10AM(emails, "Team");
        await sendNotificationToMany(employeeIds, {
            title: "Task Reminder",
            message: "Please log the tasks you are working on. Submission closes at 10:30 AM.",
        });

        console.log('10:00 AM task reminder sent.');
    }, options);

    // ── 12:00 PM — Task Reminder → ACTIVE employees ───────────────────────────
    cron.schedule('0 12 * * 1-5', async () => {
        console.log('12:00 PM — Task reminder sending...');
        const { activeEmployees } = await findEmployees();

        const emails = activeEmployees.map(e => e.employeeEmail);
        const employeeIds = activeEmployees.map(e => e._id);

        await sendTaskReminder12PM(emails, "Team");
        await sendNotificationToMany(employeeIds, {
            title: "Midday Task Reminder",
            message: "Please log your afternoon tasks. Submission closes at 12:30 PM.",
        });

        console.log('12:00 PM task reminder sent.');
    }, options);

    // ── 2:00 PM — Task Reminder → ACTIVE employees ────────────────────────────
    cron.schedule('0 14 * * 1-5', async () => {
        console.log('2:00 PM — Task reminder sending...');
        const { activeEmployees } = await findEmployees();

        const emails = activeEmployees.map(e => e.employeeEmail);
        const employeeIds = activeEmployees.map(e => e._id);

        await sendTaskReminder2PM(emails, "Team");
        await sendNotificationToMany(employeeIds, {
            title: "Afternoon Task Reminder",
            message: "Please make sure your tasks are up to date. Submission closes at 2:30 PM.",
        });

        console.log('2:00 PM task reminder sent.');
    }, options);

    // ── 4:00 PM — Check-out Reminder → ACTIVE employees ──────────────────────
    cron.schedule('0 16 * * 1-5', async () => {
        console.log('4:00 PM — Check-out reminder sending...');
        const { activeEmployees } = await findEmployees();

        const emails = activeEmployees.map(e => e.employeeEmail);
        const employeeIds = activeEmployees.map(e => e._id);

        await sendCheckOutReminderEmail(emails, "Team");
        await sendNotificationToMany(employeeIds, {
            title: "Check-Out Reminder",
            message: "The office closes at 5:00 PM. Please check out before you leave.",
        });
    }, options);
    cron.schedule('0 17 * * 1-5', async () => {
        markAttendance();
    }, options);
};