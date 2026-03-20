const { f200, f400,  f404, f500 } = require('../utils/res')
const { Employee } = require("../models/employee.model");
const { Project } = require("../models/project.model");
const Notification = require("../models/notification.model");
const { eventEmitter } = require("../routes/notification");
const { sendProjectAssignmentEmail }  = require('../utils/mailer')

module.exports.employeeProject = async (req, res) => {
    try {
        const project = await Project.find({ employeeid: req.params.id }).populate('employeeid')
        const employee = project.map((p) => {
            return {
                _id: p._id,
                name: p.name,
                progress: p.progress,
                members: p.employeeid.map((emp) => ({
                    _id: emp._id,
                    name: emp.fullName,
                    avatar: emp.avatar
                }))
            };
        });
        res.status(200).json(employee)
    } catch (error) {
        console.error(error)
    }
}
module.exports.updateProgress = async (req, res) => {
    try {

        const { id } = req.params
        const { progress } = req.body
        const project = await Project.findByIdAndUpdate(
            id,
            { $inc: { progress: progress } },
            { new: true }
        );
        !project ?? res.status(400).json({ Message: "project not found" })
        res.status(200)
    } catch (error) {
        console.error(error)
    }
}
module.exports.getproject = async (req, res) => {
    const projects = await Project.find({})
    return f200(projects, res);
};
module.exports.postproject = async (req, res) => {
    try {
        const { name, newPct } = req.body;
        if (!name) return f400(null, "Project name is required", res);
        const project = new Project({
            name: name,
            progress: newPct
        });
        const savedProject = await project.save();
        if (f400(!savedProject ? null : true, "Project not created", res)) return;
        return f200(savedProject, res);
    } catch (error) {
        console.log(error);
        return f500("Server Error", res);
    }
};
module.exports.patchproject = async (req, res) => {
    try {
        const { projectId, newName } = req.body;
        if (!projectId || !newName) return f400(null, "projectId and newName are required", res);

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { name: newName },
            { new: true }
        );

        if (!updatedProject) return f404("Project not found", res);

        return f200({ message: "Project updated successfully", project: updatedProject }, res);
    } catch (error) {
        console.log(error);
        return f500("Server Error", res);
    }
};
module.exports.deleteproject = async (req, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) return f400(null, "projectId is required", res);

        const isAssign = await Project.findByIdAndDelete({ _id: projectId });

        if (!isAssign) return f400(null, "This Project is not available", res);

        return f200({ message: "Project deleted successfully" }, res);
    } catch (error) {
        console.log(error);
        return f500("Server Error", res);
    }
};
module.exports.postasingEmployee = async (req, res) => {
    try {
        const { projectId, employeeId } = req.body;
        if (!projectId || !employeeId) return f400(null, "projectId and employeeId are required", res);

        const projectExists = await Project.findById(projectId);
        if (!projectExists) return f404("Project not found", res);

        const employeeExists = await Employee.findById(employeeId);
        if (!employeeExists) return f404("Employee not found", res);

        const isAssign = await Project.findOne({
            _id: projectId,
            employees: employeeId
        });

        if (isAssign) return f400(null, "This employee is already assigned to this project", res);

        const project = await Project.findByIdAndUpdate(
            projectId,
            { $push: { employeeid: employeeId } },
            { new: true }
        );

        const notification = await Notification.create({
            userId: employeeId,
            senderName: req.user?.name,
            position: req.user?.role,
            title: "Assigned to a new project",
            message: `You have been assigned to the project "${project.name}"`,
            type: "info",
            read: false,
            time: new Date().toLocaleTimeString(),
        });
        sendProjectAssignmentEmail(employeeExists.email, employeeExists.fullName, project.name,)

        eventEmitter.emit(`notify:${employeeId}`, notification);

        return f200(project, res);
    } catch (error) {
        console.log(error);
        return f500("Server Error", res);
    }
};
