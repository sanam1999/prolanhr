const express = require('express');
const router = express.Router({ mergeParams: true });
// const { isAuthenticated, isowner, listingvalidate } = require('../utils/Middleware.js');
const { getEmployeeLogData, getEmployeeStatistics, getTeamTrackEmployees } = require('../Controller/teamtrack')
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");

router.route('/')
    .get(isAdmin, getTeamTrackEmployees);

router.route('/logdata/:_id')
    .get(isAdmin, getEmployeeLogData);

router.route('/employeestatics/:_id')
    .get(isAdmin, getEmployeeStatistics);

module.exports = router;
