const express = require('express');
const router = express.Router();
const KioskParameter = require(`${__basedir}/models`).kiosk_parameter;

router.get('/', async (req, res) => {
	const {
		kiosk_id
	} = req.query;

	const kioskParameters = await KioskParameter.findAll({
		where: {
			kiosk_id
		}
	});

	res.json(kioskParameters);
});

module.exports = router;
