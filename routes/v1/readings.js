const express = require('express');
const router = express.Router();
const Reading = require(`${__basedir}/models`).reading;

router.get('/', async (req, res) => {
	const {
		kiosk_id
	} = req.query;

	const readings = await Reading.findAll({
		where: {
			kiosk_id
		}
	});

	res.json(readings);
});

module.exports = router;
