const express = require('express');
const router = express.Router();
const User = require(`${__basedir}/models`).user;
const Role = require(`${__basedir}/models`).role;
const UserKiosk = require(`${__basedir}/models`).user_kiosk;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

router.get('/', async (req, res) => {
	const {
		kiosk_id
	} = req.query;

	const userKiosks = await UserKiosk.findAll({
		where: {
			kiosk_id
		}
	}),
		users = await User.findAll({
			where: {
				id: {
					[Op.in]: userKiosks.map(uk => uk.user_id)
				}
			},
			include: [Role]
		});

	res.json(users);
});

module.exports = router;
