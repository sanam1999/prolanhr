const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");
const { getemployee, postemplyee, getDepartmentEmployeesWithStatus, deleteEmployee, getEmployeesByDepartment, getAllEmployees } = require('../Controller/employee')
router.use(isAdmin);
router.route('/')
    .get(getemployee)
    .post(postemplyee);


router.route('/employees')
    .get(getAllEmployees);

router.route('/deparment/_id')
    .get(getEmployeesByDepartment);

router.route('/:_id')
    .get(getDepartmentEmployeesWithStatus)
    .delete(deleteEmployee);



module.exports = router;