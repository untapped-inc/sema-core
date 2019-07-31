const express = require('express');
const router = express.Router();
const Product = require(`${__basedir}/models`).reading;

router.get('/', async (req, res) => {
	const {
		no_image
	} = req.query;

	const queryObj = {};

	if (Number(no_image)) {
		queryObj.attributes = {
			exclude: ['base64encoded_image']
		}
	}

	const products = await Product.findAll(queryObj);

	res.json(products);
});

module.exports = router;
