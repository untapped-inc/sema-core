const express = require('express');
const router = express.Router();
const Settings = require(`${__basedir}/models`).settings;

router.get('/', async (req, res) => {
	const settings = await Settings.findAll();

	res.json(settings);
});

module.exports = router;
