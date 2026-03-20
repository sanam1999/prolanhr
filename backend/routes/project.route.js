const express = require('express');
const router = express.Router({ mergeParams: true });
// const { isAuthenticated, isowner, listingvalidate } = require('../utils/Middleware.js');
const { employeeProject, updateProgress, getproject, postproject, patchproject, deleteproject, postasingEmployee } = require('../Controller/project.js')
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");
router.route('/')
    .get(isAdmin, getproject)
    .post(isAdmin, postproject)
    .patch(isAdmin, patchproject)
    .delete(isAdmin, deleteproject);

router.route('/:id')
    .get(employeeProject);

router.route('/asingEmployee')
    .post(isAdmin, postasingEmployee);

router.route('/updateprogres/:id')
    .patch(updateProgress);

module.exports = router;