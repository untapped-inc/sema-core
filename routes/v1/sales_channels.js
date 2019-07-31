const express = require('express');
const router = express.Router();
const SalesChannel = require(`${__basedir}/models`).sales_channel;

router.get('/', async (req, res) => {
	const salesChannels = await SalesChannel.findAll();

	res.json(salesChannels);
});

module.exports = router;
