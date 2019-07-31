const express = require('express');
const router = express.Router();
const Kiosk = require(`${__basedir}/models`).kiosk;

router.get('/', async (req, res) => {
	const kiosks = await Kiosk.findAll();

	res.json(kiosks);
});

module.exports = router;
