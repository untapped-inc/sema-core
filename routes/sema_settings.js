const express = require('express');
const router = express.Router();
const semaLog = require(`${__basedir}/seama_services/sema_logger`);
const {
	isAuthenticated,
	isAuthorized
} = require(`${__basedir}/seama_services/auth_services`);
const Settings = require(`${__basedir}/models`).settings;
const Parameter = require(`${__basedir}/models`).parameter;

router.get('/', async (req, res) => {
    try {
        const allSettings = await Settings.findAll({
            attributes: ['title', 'description', 'name', 'value']
        });

        return res.json(allSettings);
    } catch(e) {
        semaLog.warn(`sema_settings - Fetch - Error: ${JSON.stringify(err)}`);
		return res.json({
            msg: "Internal Server Error",
            error: true,
            status: 500
        });
    }
});

// TODO: Only update settings that have been actually updated so we don't have to
// update everything
router.put('/', isAuthenticated, isAuthorized(['admin']), async (req, res) => {
    try {
        const { settings } = req.body;

        Object.keys(settings).forEach(async name => {
            await Settings.update({
                value: settings[name]
            }, {
                where: { name }
            });

            // Also update the Volume and Flow Rate parameters when default_unit_system changes
            if (name === 'default_unit_system') {
                await Parameter.update({
                    unit: settings[name] === 'imperial' ? 'gallon' : 'liter'
                }, {
                    where: {
                        name: 'Volume'
                    }
                });

                await Parameter.update({
                    unit: settings[name] === 'imperial' ? 'gpm' : 'lpm'
                }, {
                    where: {
                        name: 'Flow Rate'
                    }
                });
            }
        });

        return res.json({
            msg: "Settings updated successfully"
        });
    } catch(err) {
        semaLog.warn(`sema_settings - Update - Error: ${JSON.stringify(err)}`);
		return res.json({
            msg: "Internal Server Error",
            error: true,
            status: 500
        });
    }
});

module.exports = router;