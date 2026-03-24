module.exports.getSriLankaTime = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
}
