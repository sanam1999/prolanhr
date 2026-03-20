const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model");
const { EventEmitter } = require("events");
const jwt = require("jsonwebtoken");

const eventEmitter = new EventEmitter();

// ─── Helper: shape document for frontend (maps _id → id, adds time) ──────────
function formatNotification(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        id: obj._id.toString(),
        senderName: obj.senderName,
        position: obj.position,
        title: obj.title,
        message: obj.message,
        read: obj.read,
        type: obj.type,
        time: new Date(obj.createdAt).toLocaleString(),
    };
}

// GET all notifications for the logged-in user
router.get("/", async (req, res) => {

    try {
        const notifications = await Notification
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 });
         res.json(notifications.map(formatNotification));
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// GET SSE stream — token via query param (EventSource can't set headers)
router.get("/stream", (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const ping = setInterval(() => res.write(": ping\n\n"), 30000);

    const sendNotification = (notification) => {
        // notification is already formatted before emit
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
    };

    eventEmitter.on(`notify:${decoded.id}`, sendNotification);

    req.on("close", () => {
        clearInterval(ping);
        eventEmitter.off(`notify:${decoded.id}`, sendNotification);
    });
});

// PATCH mark all notifications as read
router.patch("/read-all", async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id }, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to mark all as read" });
    }
});

// PATCH mark a single notification as read (with ownership check)
router.patch("/:id/read", async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true }
        );
        if (!notification) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to mark as read" });
    }
});

// DELETE all — must come BEFORE /:id to avoid route conflict
router.delete("/", async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear" });
    }
});

// DELETE a single notification (with ownership check)
router.delete("/:id", async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!notification) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

module.exports = { router, eventEmitter, formatNotification };