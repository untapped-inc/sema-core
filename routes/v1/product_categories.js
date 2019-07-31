const express = require('express');
const router = express.Router();
const ProductCategory = require(`${__basedir}/models`).product_category;

router.get('/', async (req, res) => {
	const productCategories = await ProductCategory.findAll();

	res.json(productCategories);
});

module.exports = router;
