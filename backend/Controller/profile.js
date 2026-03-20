const { f200, f400, f404, f500 } = require('../utils/res')
const { Employee } = require("../models/employee.model");
const { cloudinary } = require('../cludynaryconfig.js');
module.exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return f400(null, "Employee ID is required", res);

        const employee = await Employee
            .findById(id)
            .populate("department");

        if (!employee) return f404("Employee not found", res);


        return f200({
            _id: employee._id,
            fullName: employee.fullName,
            email: employee.email,
            avatar: employee.avatar,
            phone: employee.phone,
            department: employee.department.name,
            role: employee.role,
            joinDate: employee.createdAt
        }, res);
    } catch (error) {
        console.log(error);
        return f500("Server error", res);
    }
};
module.exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone } = req.body;

        // Only allow these two fields to be updated
        const updates = {};
        if (fullName !== undefined) updates.fullName = fullName.trim();
        if (phone !== undefined) updates.phone = phone.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }


        const updated = await Employee.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate("department");

        if (!updated) return res.status(404).json({ error: "Employee not found" });

        res.json({
            _id: updated._id,
            fullName: updated.fullName,
            email: updated.email,
            phone: updated.phone,
            avatar: updated.avatar,
            department: updated.department?.name ?? "—",
            role: updated.role,
            status: updated.status,
            joinDate: updated.joinDate,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};
module.exports.updateProfileAvatar = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const DEFAULT_AVATAR = "https://st.depositphotos.com/1537427/3571/v/450/depositphotos_35716051-stock-illustration-user-icon-vector.jpg";

        if (employee.avatar && employee.avatar !== DEFAULT_AVATAR) {
            const urlParts = employee.avatar.split("/");
            const fileWithExt = urlParts[urlParts.length - 1];         // "abc123.jpg"
            const fileName = fileWithExt.split(".")[0];                 // "abc123"
            const folder = urlParts[urlParts.length - 2];               // "profile_avatars"
            const publicId = `${folder}/${fileName}`;                   // "profile_avatars/abc123"

            await cloudinary.uploader.destroy(publicId);
        }

        const imageUrl = req.file.path;

        const updated = await Employee.findByIdAndUpdate(
            id,
            { avatar: imageUrl },
            { new: true }
        );

        return res.status(200).json(updated);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};


