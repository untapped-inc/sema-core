const express = require('express');
const router = express.Router();
const semaLog = require(`${__basedir}/seama_services/sema_logger`);
const Settings = require(`${__basedir}/models`).settings;
const ReceiptDetails = require(`${__basedir}/models`).receipt_details;
const Kiosk = require(`${__basedir}/models`).kiosk;
const KioskSettings = require(`${__basedir}/models`).kiosk_settings;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

KioskSettings.belongsTo(Settings, { foreignKey: 'settings_id' });

router.get('/', async (req, res) => {
    try {
        const data = {};
        const {
            siteName,
            beginDate,
            endDate
        } = req.query;

        const [err0, kiosk] = await __hp(Kiosk.findOne({
            where: {
                name: siteName
            }
        }));

        // On error, return a generic error message and log the error
        if (err0) {
            semaLog.warn(`sema_dashboard - Fetch - Error: ${JSON.stringify(err0)}`);
            return res.status(500).json({ msg: "Internal Server Error" });
        } else if (!kiosk) {
            return res.json({
                status: 404,
                msg: `Kiosk "${siteName}" does not exist.`
            })
        }

        const [err, dailyVolume] = await __hp(ReceiptDetails.findAll({
            attributes: [
                [Sequelize.fn('date_format', Sequelize.col('receipt_details.created_at'), '%b %e'), 'created_at'],
                [Sequelize.fn('sum', Sequelize.col('volume')), 'volume']
            ],
            where: {
                created_at: {
                    [Op.between]: [
                        beginDate,
                        endDate
                    ]
                },
                kiosk_id: kiosk.id,
                active: true
            },
            group: [Sequelize.fn('date_format', Sequelize.col('receipt_details.created_at'), '%b %e')],
            order: [
                [Sequelize.fn('date_format', Sequelize.col('receipt_details.created_at'), '%b %e'), 'ASC']
            ],
            raw: true
        }));

        // On error, return a generic error message and log the error
        if (err) {
            semaLog.warn(`sema_dashboard - Fetch - Error: ${JSON.stringify(err)}`);
            return res.status(500).json({ msg: "Internal Server Error" });
        }

        // Set it so that the created date becomes the object property
        data.dailyVolume = dailyVolume.reduce((final, volume) => {
            const pair = Object.entries(volume);

            final[`${pair[0][1]}`] = pair[1][1];

            return final;
        }, {});

        // Fetch settings mapping from the kiosk_settings table first
        // If no mapping is set for the current kiosk, use the general settings
        const [err1, kioskSettings] = await __hp(KioskSettings.findAll({
            attributes: ['setting.name', 'value'],
            where: {
                kiosk_id: kiosk.id,
                active: true
            },
            include: [{
                model: Settings,
                attributes: ['name']
            }]
        }));

        data.settings = kioskSettings.map(setting => {
            return {
                name: setting.setting.name,
                value: setting.value
            }
        });

        // On error, return a generic error message and log the error
        if (err1) {
            semaLog.warn(`sema_dashboard - Fetch - Error: ${JSON.stringify(err1)}`);
            return res.status(500).json({ msg: "Internal Server Error" });
        } else if (!kioskSettings.length) {
            // On no mapping for a kiosk, we pull the general settings
            const [err2, generalSettings] = await __hp(Settings.findAll({
                where: {
                    [Op.or]: [
                        { name: 'monthly_goal' },
                        { name: 'min_monthly_goal' }
                    ]
                },
                attributes: ['name', 'value']
            }));

            // On error, return a generic error message and log the error
            if (err1) {
                semaLog.warn(`sema_dashboard - Fetch - Error: ${JSON.stringify(err2)}`);
                return res.status(500).json({ msg: "Internal Server Error" });
            }

            data.settings = generalSettings;
        }

        return res.json(data);
    } catch(err) {
        semaLog.warn(`sema_dashboard - Fetch - Error: ${JSON.stringify(err)}`);
		return res.json({
            msg: "Internal Server Error",
            error: true,
            status: 500
        });
    }
});

module.exports = router;