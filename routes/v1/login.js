const express = require('express');
const router = express.Router();
const User = require(`${__basedir}/models`).user;
const Role = require(`${__basedir}/models`).role;
const Kiosk = require(`${__basedir}/models`).kiosk;
const validator = require('validator');
const jwt = require('jsonwebtoken');

/* Process login. */
router.post('/', async (req, res) => {
	const { usernameOrEmail, password } = req.body;

	if (!usernameOrEmail || !password) {
		return res
			.status(400)
			.send({ msg: 'Bad request, missing username or password' });
	}

	try {
		let whereClause = validator.isEmail(usernameOrEmail)
			? { email: usernameOrEmail.toLowerCase() }
			: { username: usernameOrEmail.toLowerCase() };

		// Get the user with the assigned role code
		const user = await User.findOne({
			where: whereClause,
			include: [
				{
					model: Role,
					as: 'roles'
				},
				{
					model: Kiosk,
					as: 'kiosks'
				}
			]
		});

		if (!user) {
			return res.status(401).send({ msg: 'Invalid Credentials' });
		}

		const isValidPassword = await user.comparePassword(password);

		if (!isValidPassword) {
			return res.status(401).send({ msg: 'Invalid Credentials' });
		}

		const kiosks = await Kiosk.findAll({ raw: true });
		const userJson = JSON.parse(JSON.stringify(user));

		delete userJson.password;

		// Everything went well
		const token = jwt.sign(userJson, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRATION_LENGTH
		});

		res.json({
			version: req.app.get('sema_version'),
			token,
			kiosks
		});
	} catch (err) {
		return res.status(500).send({ msg: 'Internal Server Error' });
	}
});

module.exports = router;
