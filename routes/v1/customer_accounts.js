const express = require('express');
const router = express.Router();
const CustomerAccount = require(`${__basedir}/models`).customer_account;

router.get('/', async (req, res) => {
	const {
		kiosk_id
	} = req.query;

	const customerAccounts = await CustomerAccount.findAll({
		where: {
			kiosk_id
		}
	});

	res.json(customerAccounts);
});

module.exports = router;
