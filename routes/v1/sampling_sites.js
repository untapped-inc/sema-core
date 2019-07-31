const express = require('express');
const router = express.Router();
const SamplingSite = require(`${__basedir}/models`).sampling_site;

router.get('/', async (req, res) => {
	const samplingSites = await SamplingSite.findAll();

	res.json(samplingSites);
});

module.exports = router;
