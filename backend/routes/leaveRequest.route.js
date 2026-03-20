const express = require('express');
const router = express.Router({ mergeParams: true });
// const { isAuthenticated, isowner, listingvalidate } = require('../utils/Middleware.js');
const { getEmployeeLeaveRequests, getAllLeaveRequests, updateLeaveRequestStatus, createLeaveRequest, deleteLeaveRequest } = require('../Controller/leaveRequest')
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");
router.route('/')
    .get(isAdmin, getAllLeaveRequests)
    .patch(isAdmin, updateLeaveRequestStatus)
    .post(isEmployee, createLeaveRequest);


router.route('/:id')
    .get(getEmployeeLeaveRequests)
    .delete(deleteLeaveRequest);
module.exports = router;