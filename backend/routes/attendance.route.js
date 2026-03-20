const express = require('express');
const router = express.Router({ mergeParams: true });
const { getEmployeeAttendance, addAttendanceLog, deleteAttendanceLog, checkInAttendance, checkOutAttendance } = require('../Controller/attendance')
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");


router.route('/log')
    .post(isEmployee, addAttendanceLog)
    .delete(isEmployee, deleteAttendanceLog);

router.route("/checkin")
    .post(isEmployee, checkInAttendance);
router.route("/checkout")
    .post(isEmployee, checkOutAttendance);
router.route('/:_id')
    .get(isEmployee, getEmployeeAttendance);

module.exports = router;

