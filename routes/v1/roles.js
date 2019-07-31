const express = require('express');
const router = express.Router();
const Role = require(`${__basedir}/models`).role;

router.get('/', async (req, res) => {
	const roles = await Role.findAll();

	res.json(roles);
});

module.exports = router;
