const express = require('express');
const router = express.Router({ mergeParams: true });
// const { isAuthenticated, isowner, listingvalidate } = require('../utils/Middleware.js');
const { getHolidays, getTodayHolidayStatus, createHoliday, deleteHoliday } = require('../Controller/holiday')
const { isAdmin, isEmployee } = require("../middleware/authMiddleware");
router.route('/')
    .get(isAdmin, getHolidays)
    .post(isAdmin, createHoliday);
router.route('/today')
    .get(getTodayHolidayStatus);

router.route('/:id')
    .get(isAdmin, deleteHoliday);



module.exports = router;