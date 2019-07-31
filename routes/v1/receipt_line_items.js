const express = require('express');
const router = express.Router();
const ReceiptLineItem = require(`${__basedir}/models`).receipt_line_item;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

router.get('/', async (req, res) => {
	const {
		begin_date,
		end_date
	} = req.query;

	const receiptLineItems = await ReceiptLineItem.findAll({
		where: {
			receipt_id: {
				[Op.gte]: end_date,
				[Op.lte]: begin_date
			}
		}
	});

	res.json(receiptLineItems);
});

module.exports = router;
