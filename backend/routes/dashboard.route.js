const express = require('express');
const router = express.Router({ mergeParams: true });
const { admin, employee } = require('../Controller/dashboard')
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");
router.route('/admin')
    .get(isAdmin, admin);

router.route('/employee/:id')
    .get(employee);

module.exports = router;

