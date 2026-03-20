const express = require('express');
const router = express.Router({ mergeParams: true });
const { getProfile, updateProfile, updateProfileAvatar } = require('../Controller/profile.js');
const { upload } = require('../cludynaryconfig.js');
const { authMiddleware, isAdmin, isEmployee } = require("../middleware/authMiddleware");
router.route('/:id')
    .get(getProfile)
    .patch(updateProfile)
    .post(upload.single("avatar"), updateProfileAvatar);

module.exports = router;