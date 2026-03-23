function getSriLankaTime() {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // UTC+5:30 in milliseconds
    const sriLankaTime = new Date(now.getTime() + offset);
    return sriLankaTime;
}

module.exports = {
    getSriLankaTime
}