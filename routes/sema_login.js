const express = require('express');
const router = express.Router();
const semaLog = require(`${__basedir}/seama_services/sema_logger`);
const User = require(`${__basedir}/models`).user;
const Role = require(`${__basedir}/models`).role;
const validator = require('validator');
const jwt = require('jsonwebtoken');

/* Process login. */
router.post('/', async (req, res) => {
	semaLog.info('sema_login - Enter');
	const { usernameOrEmail, password } = req.body;
	if( ! usernameOrEmail || ! password){
		return res.status(400).send({ msg: "Bad request, missing username or password" });
	}

	try {
		let whereClause = validator.isEmail(usernameOrEmail) ?
			{ email: usernameOrEmail.toLowerCase() } :
			{ username: usernameOrEmail.toLowerCase() };

		// Get the user with the assigned role code
		const user = await User.findOne({
			where: whereClause,
			include: [{
				model: Role,
				attributes: ['code']
			}]
		});

		if (!user) {
			semaLog.warn('sema_login - Invalid Credentials');
			return res.status(401).send({ msg: "Invalid Credentials" });
		}

		const isValidPassword = await user.comparePassword(password);

		if (!isValidPassword) {
			semaLog.warn('sema_login - Invalid Credentials');
			return res.status(401).send({ msg: "Invalid Credentials" });
		}

		var userValues = JSON.parse(JSON.stringify(user));

		delete userValues.password;

		const role = await user.getRoles();

		const finalUser = {
			id: userValues.id,
			email: userValues.email,
			username: userValues.username,
			firstName: userValues.first_name,
			lastName: userValues.last_name,
			active: userValues.active,
			role: role.map(r => ({ code: r.code, authority: r.authority }))
		};

		// Everything went well
		const token =  jwt.sign(finalUser, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRATION_LENGTH
		});

		semaLog.info('sema_login - succeeded');

		res.json({
			version: req.app.get('sema_version'),
			token
		});
	} catch(err) {
		semaLog.warn(`sema_login - Error: ${err}`);
		return res.status(500).send({ msg: "Internal Server Error" });
	}
});

module.exports = router;
