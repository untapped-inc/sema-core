const express = require('express');
const router = express.Router();
const semaLog = require(`${__basedir}/seama_services/sema_logger`);
const User = require(`${__basedir}/models`).user;
const Role = require(`${__basedir}/models`).role;
const Device = require(`${__basedir}/models`).device;
const Sensor = require(`${__basedir}/models`).sensor;
const DeviceWaterAmount = require(`${__basedir}/models`).device_water_amount;
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

		// Everything went well
		let payload = {};

		// Figure out if user is a device
		const userRoles = user.roles.map(role => role.code);

		Device.hasMany(Sensor);
		Device.hasMany(DeviceWaterAmount);

		if (userRoles.includes('device')) {
			const device = await Device.findOne({
				where: {
					user_id: user.id
				},
				include: [
					{ model: Sensor },
					{
						model: DeviceWaterAmount,
						order: [['created_at', 'DESC']],
						limit: 1
					}
				]
			});

			// If corresponding device is not found, return an error
			if (!device) {
				semaLog.warn('sema_login - Device Not Set');
				return res.status(404).send({ msg: "Device Not Set" });
			} else if (!device.device_water_amounts.length) {
				semaLog.warn('sema_login - No water amounts set for device');
				return res.status(404).send({ msg: "No water amount set for device" });
			}

			payload.user = await user.toJSON();
			payload.device = await device.toJSON();
			payload.device.max_water_amount = {
				value: payload.device.device_water_amounts[0].water_amount,
				created_at: payload.device.device_water_amounts[0].created_at
			};

			delete payload.device.device_water_amounts;
		} else {
			payload = await user.toJSON();
		}

		const token =  jwt.sign(payload, process.env.JWT_SECRET, {
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
