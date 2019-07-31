const express = require('express');
const router = express.Router();
const UserRole = require(`${__basedir}/models`).user_role;

router.get('/', async (req, res) => {
	const userRoles = await UserRole.findAll();

	res.json(userRoles);
});

module.exports = router;
