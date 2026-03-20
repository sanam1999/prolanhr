
function f200(data, res) {
    return res.status(200).json(data);
}

function f201(data, res) {
    return res.status(201).json(data);
}

function f400(data, msg, res) {
    if (!data) {
        res.status(400).json({ message: msg });
        return true;
    }
    return false;
}

function f401(msg, res) {
    return res.status(401).json({ message: msg ?? "Unauthorized" });
}

function f403(msg, res) {
    return res.status(403).json({ message: msg ?? "Forbidden" });
}

function f404(msg, res) {
    return res.status(404).json({ message: msg });
}

function f409(msg, res) {
    return res.status(409).json({ message: msg });
}

function f500(msg, res) {
    return res.status(500).json({ message: msg ?? "Server error" });
}

module.exports = {
    f200, f201, f400, f401, f403, f404, f409, f500
}