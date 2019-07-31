const express = require('express');
const router = express.Router();
const Receipt = require(`${__basedir}/models`).receipt;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

router.get('/', async (req, res) => {
	const {
		kiosk_id,
		begin_date,
		end_date
	} = req.query;

	const receipts = await Receipt.findAll({
		where: {
			id: {
				[Op.gte]: end_date,
				[Op.lte]: begin_date
			},
			kiosk_id
		}
	});

	res.json(receipts);
});

module.exports = router;
