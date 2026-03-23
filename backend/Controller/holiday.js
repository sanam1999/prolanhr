const { f200, f201, f400, f404, f409, f500 } = require('../utils/res')
const { getSriLankaTime } = require('../utils/srilankantime')
const { Holiday } = require("../models/holiday.model");
module.exports.getHolidays = async (req, res) => {
    try {
        const filter = {};

        if (req.query.year) {
            const y = parseInt(req.query.year);
            filter.date = {
                $gte: new Date(`${y}-01-01`),
                $lte: new Date(`${y}-12-31`),
            };
        }

        const holidays = await Holiday.find(filter).sort({ date: 1 });

        const formatted = holidays.map(h => ({
            _id: h._id,
            date: h.date.toISOString().split("T")[0],
            name: h.name,
            type: h.type,
        }));

        return f200(formatted, res);
    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};
module.exports.getTodayHolidayStatus = async (req, res) => {
    try {
        const today = getSriLankaTime();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return f200({
                IsHoliday: true,
                msg: dayOfWeek === 0 ? "Sunday is a holiday" : "Saturday is a holiday",
            }, res);
        }

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const holiday = await Holiday.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        return f200({
            IsHoliday: !!holiday,
            msg: holiday ? `${holiday.name} is a holiday` : "No holiday today",
        }, res);

    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};
module.exports.createHoliday = async (req, res) => {
    try {
        const { date, name, type } = req.body;

        if (f400(date && name && type ? true : null, "date, name and type are required", res)) return;

        const holiday = new Holiday({
            date: new Date(date),
            name: name.trim(),
            type,
        });

        await holiday.save();

        return f201({
            _id: holiday._id,
            date: holiday.date.toISOString().split("T")[0],
            name: holiday.name,
            type: holiday.type,
        }, res);
    } catch (error) {
        if (error.code === 11000) return f409("A holiday already exists on this date", res);
        console.log(error);
        return f500("Server error", res);
    }
};
module.exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return f400(null, "Holiday ID is required", res);

        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) return f404("Holiday not found", res);
        return f200({ message: "Deleted successfully", id: req.params.id }, res);
    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};

