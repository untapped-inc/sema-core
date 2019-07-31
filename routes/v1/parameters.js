const express = require('express');
const router = express.Router();
const Parameter = require(`${__basedir}/models`).parameter;

router.get('/', async (req, res) => {
	const parameters = await Parameter.findAll();

	res.json(parameters);
});

module.exports = router;
