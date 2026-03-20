const { f200, f500 } = require('../utils/res')

const { Department } = require("../models/department.model");

module.exports.getdepartment = async (req, res) => {
    try {
        const departments = await Department.find({});

        const simplifiedDepartments = departments.map((dept) => ({
            id: dept._id,
            name: dept.name,
            head: dept.head,
            employeeCount: dept.employees ? dept.employees.length : 0,
            budget: dept.budget
        }));

        return f200(simplifiedDepartments, res);
    } catch (err) {
        console.error(err);
        return f500("Server error", res);
    }
};