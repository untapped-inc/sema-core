const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models').user;
const Role = require('../models').role;

module.exports = () => {
	const opts = {};

	opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
	opts.secretOrKey = process.env.JWT_SECRET;

	passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
		User
			.findOne({
				where: {
					id: jwt_payload.id || jwt_payload.user.id
				},
				include: [Role],
				attributes: {
					exclude: ['password']
				}
			})
			.then(user => {
				// If it's a device session, we log the sent payload
				// If it's a user, we log the user info
				if (jwt_payload.user && jwt_payload.device) {
					done(null, jwt_payload)
				} else {
					done(null, user)
				}
			})
			.catch(err => done(err, false));
	}));
};
