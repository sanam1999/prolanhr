const { f200, f400, f500 } = require('../utils/res')
const { Attendance } = require("../models/attendance.model");
const { getSriLankaTime } = require('../utils/srilankantime')
module.exports.getEmployeeAttendance = async (req, res) => {
    try {
        const _id = req.params._id
        if (!_id) return f400(null, "Employee ID is required", res);
        const attendance = await Attendance.find({ employeeId: _id })
        return f200(attendance, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
}
module.exports.addAttendanceLog = async (req, res) => {
    try {
        const { employeeId, note } = req.body;

        if (!employeeId || !note) {
            return f400(null, "All fields are required", res);
        }

        if (note.length > 300) {
            return f400(null, "Note must be 300 characters or less", res);
        }

        const today = getSriLankaTime();

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!existing) {
            return f400(null, "No attendance record found for today", res);
        }

        const LOG_SLOTS = [
            { hour: 10, minute: 0 },
            { hour: 12, minute: 0 },
            { hour: 14, minute: 0 },
            { hour: 16, minute: 0 },
        ];

        const currentSlot = LOG_SLOTS.find(slot => {
            const slotStart = new Date(today);
            slotStart.setHours(slot.hour, slot.minute, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slot.minute + 30);

            return today >= slotStart && today < slotEnd;
        });

        if (!currentSlot) {
            return f400(null, "Log submission is only allowed during a valid slot window", res);
        }

        const slotStart = new Date(today);
        slotStart.setHours(currentSlot.hour, currentSlot.minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(currentSlot.minute + 30);

        const alreadyLogged = existing.logs.some(entry => {
            const logTime = new Date(entry.time);
            return logTime >= slotStart && logTime < slotEnd;
        });

        if (alreadyLogged) {
            return f400(null, `A log has already been submitted for the ${currentSlot.hour}:${String(currentSlot.minute).padStart(2, "0")} slot`, res);
        }

        existing.logs.push({ log: note, time: today });

        await existing.save();
        return f200(existing, res);

    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.deleteAttendanceLog = async (req, res) => {
    try {
        const { recordId, logIndex } = req.body;

        if (!recordId || logIndex === undefined) {
            return f400(null, "recordId and logIndex are required", res);
        }

        const record = await Attendance.findById(recordId);

        if (!record) {
            return f400(null, "Attendance record not found", res);
        }

        if (logIndex < 0 || logIndex >= record.logs.length) {
            return f400(null, "Invalid log index", res);
        }

        record.logs.splice(logIndex, 1);

        await record.save();
        return f200(record, res);

    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.checkInAttendance = async (req, res) => {
    try {
        const { employeeId } = req.body;
        console.log(req.body)

        if (!employeeId) {
            return f400(null, "Employee ID is required", res);
        }
        const EARLY_CHECKIN = 7 * 60 + 45;
        const PRESENT_DEADLINE = 8 * 60 + 30;
        const LATE_DEADLINE = 10 * 60 + 0;    // 10:00 - mark as late
        const CHECKOUT_DEADLINE = 12 * 60 + 0; // 12:00 - last check-in time
        const today = new Date();
        console.log(today)
        const hours = today.getHours();
        const minutes = today.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // ✅ Check if time is within allowed window (07:45 to 12:00)
        if (totalMinutes < EARLY_CHECKIN || totalMinutes > CHECKOUT_DEADLINE) {
            return f400(null, `You can only mark attendance between 07:45 and 12:00. Current time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`, res);
        }


        const existing = await Attendance.findOne({
            employeeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existing) {
            return f400(null, "Attendance already marked for today", res);
        }


        // ✅ Determine status based on check-in time
        let status;
        if (totalMinutes <= PRESENT_DEADLINE) {
            status = "present";
        } else if (totalMinutes <= LATE_DEADLINE) {
            status = "late";
        } else {
            status = "half-day"; // Between 10:00 and 12:00
        }

        // ✅ Create attendance record
        const attendance = new Attendance({
            employeeId,
            date: today,
            checkIn: today,
            status
        });
        await attendance.save();

        return f200({
            message: `Attendance marked as ${status}`,
            attendance: {
                _id: attendance._id,
                employeeId: attendance.employeeId,
                date: attendance.date,
                checkIn: attendance.checkIn,
                status: attendance.status
            }
        }, res);

    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.checkOutAttendance = async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return f400(null, "Employee ID is required", res);
        }

        const today = getSriLankaTime();
        const hours = today.getHours();
        const minutes = today.getMinutes();
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log(today)
        console.log(formattedTime); // 19:53

        const totalMinutes = hours * 60 + minutes;

        const CHECKOUT_TIME = 13 * 60;

        if (totalMinutes < CHECKOUT_TIME) {
            return f400(null, `You can only checkout after 13:00. Current time: ${formattedTime}`, res);
        }

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!attendance) {
            return f400(null, "No attendance found for today. Please check in first.", res);
        }

        if (attendance.checkOut) {
            return f400(null, "You have already checked out today", res);
        }

        const checkInTime = new Date(attendance.checkIn);
        const diffMs = today - checkInTime;
        const total_hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

        let status = attendance.status;

        if (total_hours < 5) {
            status = "half-day";
        } else {
            status = attendance.status;
        }

        const updated = await Attendance.findByIdAndUpdate(
            attendance._id,
            {
                checkOut: today,
                workHours: total_hours,
                status: status
            },
            { new: true }
        );

        return f200({
            message: `Checked out successfully at ${formattedTime}. Work hours: ${total_hours}`,
            attendance: {
                _id: updated._id,
                employeeId: updated.employeeId,
                date: updated.date,
                checkIn: updated.checkIn,
                checkOut: updated.checkOut,
                workHours: updated.workHours,
                status: updated.status
            }
        }, res);

    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};