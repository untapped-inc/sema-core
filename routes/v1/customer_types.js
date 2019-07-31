const express = require('express');
const router = express.Router();
const CustomerType = require(`${__basedir}/models`).customer_type;

router.get('/', async (req, res) => {
	const customerTypes = await CustomerType.findAll();

	res.json(customerTypes);
});

module.exports = router;
