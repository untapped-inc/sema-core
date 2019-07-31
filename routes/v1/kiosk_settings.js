const express = require('express');
const router = express.Router();
const KioskSettings = require(`${__basedir}/models`).kiosk_settings;

router.get('/', async (req, res) => {
	const {
		kiosk_id
	} = req.query;

	const kioskSettings = await KioskSettings.findAll({
		where: {
			kiosk_id
		}
	});

	res.json(kioskSettings);
});

module.exports = router;
