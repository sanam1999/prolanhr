const express = require('express');
const router = express.Router({ mergeParams: true });
const { isAdmin } = require("../middleware/authMiddleware");
const { getdepartment } = require('../Controller/departments');

router.route('/')
    .get(isAdmin, getdepartment)


module.exports = router;
