const express = require('express');
const router = express.Router();
const productMrp = require(`${__basedir}/models`).product_mrp;

router.get('/', async (req, res) => {
	const productMrps = await productMrp.findAll();

	res.json(productMrps);
});

module.exports = router;
