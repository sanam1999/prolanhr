const { f200, f201, f400, f403, f404, f500 } = require('../utils/res')
const LeaveRequest = require("../models/leaveRequest.model");
const { Employee } = require("../models/employee.model");

const Notification = require("../models/notification.model");
const {  eventEmitter } = require("../routes/notification");
const { sendLeaveRequestConfirmationEmail, sendAdminLeaveNotificationEmail, sendLeaveStatusEmail } = require('../utils/mailer.js')
module.exports.getEmployeeLeaveRequests = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return f400(null, "Employee ID is required", res);

        const employeeExists = await Employee.findById(id);
        if (!employeeExists) return f404("Employee not found", res);

        const leaveReq = await LeaveRequest.find({ employeeId: id })
        if (!leaveReq.length) return f200([], res);
        const leave = leaveReq.map((l) => ({
            _id: l._id,
            type: l.type,
            startDate: l.startDate,
            endDate: l.endDate,
            status: l.status,
            reason: l.reason,
            createdAt: l.createdAt,
        }))
        return f200(leave, res);
    } catch (error) {
        console.error(error);
        return f500("Server error", res);
    }
};
module.exports.getAllLeaveRequests = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({}).populate('employeeId');
        return f200(leaves, res);
    } catch (error) {
        console.error(error);
        return f500("Server Error", res);
    }
};
module.exports.updateLeaveRequestStatus = async (req, res) => {
    try {
        const { _id, status, rejectionReason } = req.body;
        if (!_id) {
            return f400("Leave request ID (_id) is required", res);
        }
        if (!status || !["pending", "approved", "rejected"].includes(status)) {
            return f400("Valid status is required: pending, approved, or rejected", res);
        }
        if (status === "rejected" && !rejectionReason) {
            return f400("Rejection reason is required when rejecting", res);
        }
        const admin = await Employee.findById(req.user?.id);
        if (admin?.accType !== "admin") {
            return f403("Only admins can update leave requests", res);
        }
        const leave = await LeaveRequest.findById(_id).populate("employeeId");
        if (!leave) {
            return f404("Leave request not found", res);
        }
        if (leave.status !== "pending") {
            return f400(`Cannot update a ${leave.status} request`, res);
        }
        const updateData = {
            status: status
        };

        if (status === "approved") {
            updateData.approvedAt = new Date();
            updateData.approvedBy = req.user?.id;
        } else if (status === "rejected") {
            updateData.rejectedAt = new Date();
            updateData.rejectedBy = req.user?.id;
            updateData.rejectionReason = rejectionReason;
        }
        const updatedLeave = await LeaveRequest.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        ).populate("employeeId");
        const formatDate = (date) => {
            const d = new Date(date);
            return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
        };
        try {
            sendLeaveStatusEmail(
                updatedLeave.employeeId.email,
                updatedLeave.employeeId.fullName,
                updatedLeave.type,
                updatedLeave.startDate,
                updatedLeave.endDate,
                status,
                admin.fullName,
                status === "rejected" ? rejectionReason : null
            );
        } catch (emailError) {
            console.error(" Error sending email:", emailError);
        }
        try {
            const notificationMessage = status === "approved"
                ? `Your leave request (${updatedLeave.type}) from ${formatDate(updatedLeave.startDate)} to ${formatDate(updatedLeave.endDate)} has been approved! 🎉`
                : status === "rejected"
                    ? `Your leave request (${updatedLeave.type}) from ${formatDate(updatedLeave.startDate)} to ${formatDate(updatedLeave.endDate)} has been rejected. Reason: ${rejectionReason}`
                    : `Your leave request status has been updated to ${status}`;

            const notification = await Notification.create({
                userId: updatedLeave.employeeId._id,
                senderName: admin.fullName,
                position: admin.role,
                title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: notificationMessage,
                type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
                read: false,
                time: new Date()
            });
            eventEmitter.emit(`notify:${updatedLeave.employeeId._id}`, notification);

        } catch (notifyError) {
            console.error(" Error creating notification:", notifyError);
        }

        return f200({
            message: `Leave request ${status} successfully`,
            leave: updatedLeave
        }, res);

    } catch (error) {
        console.error(" Error updating leave request:", error);
        return f500("Server error", res);
    }
};
module.exports.createLeaveRequest = async (req, res) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;

        //  Validation
        if (!employeeId || !type || !startDate || !endDate) {
            return f400("employeeId, type, startDate and endDate are required", res);
        }

        //  Create and save leave request
        const leave = new LeaveRequest({
            employeeId,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: "pending",
        });
        await leave.save();

        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return f400("Employee not found", res);
        }
        try {
            sendLeaveRequestConfirmationEmail(
                employee.email,
                employee.fullName,
                type,
                startDate,
                endDate,
                reason
            );
        } catch (emailError) {
            console.error(" Error sending confirmation email:", emailError);
        }

        const admins = await Employee.find({ accType: "admin" });

        if (admins.length > 0) {
            const adminEmails = admins.map(admin => admin.email);

            //  SEND EMAIL TO ALL ADMINS - New leave request notification
            try {
                sendAdminLeaveNotificationEmail(
                    adminEmails,
                    employee.fullName,
                    type,
                    startDate,
                    endDate
                );

            } catch (emailError) {
                console.error(" Error sending admin notification:", emailError);
            }

            //  REAL-TIME NOTIFICATION - Create DB notification & emit socket event
            await Promise.all(admins.map(async (admin) => {
                const notification = await Notification.create({
                    userId: admin._id,
                    senderName: req.user?.name,
                    position: req.user?.role,
                    title: "Leave Request",
                    message: `${employee.fullName} has requested ${type} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
                    type: "info",
                    read: false,
                    time: new Date()
                });

                // Emit real-time socket notification
                eventEmitter.emit(`notify:${admin._id}`, notification);
            }));
        }

        return f201({
            message: "Leave request created successfully",
            leaveId: leave._id,
            status: "pending"
        }, res);

    } catch (error) {
        console.error(" Error creating leave request:", error);
        return f500("Server error", res);
    }
};
module.exports.deleteLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return f400(null, "Leave request ID is required", res);

        const leave = await LeaveRequest.findByIdAndDelete(id);
        if (!leave) return f404("Leave request not found", res);
        return f200({ message: "Deleted successfully", id: req.params.id }, res);
    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};