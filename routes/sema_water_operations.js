const express = require('express');
const router = express.Router();
require('datejs');
const semaLog = require('../seama_services/sema_logger');
const Reading = require(`${__basedir}/models`).reading;
const Sensor = require(`${__basedir}/models`).sensor;
const Device = require(`${__basedir}/models`).device;
const Role = require(`${__basedir}/models`).role;
const DeviceWaterAmount = require(`${__basedir}/models`).device_water_amount;
const User = require(`${__basedir}/models`).user;
const { Sequelize } = require(`${__basedir}/models`);
const { Op } = Sequelize;
const moment = require('moment');

let parameter_id_map = {};
let sampling_site_id_map = {};

const sqlLMostRecentReading =
	'SELECT created_date FROM reading \
	WHERE kiosk_id = ? \
	ORDER BY created_date DESC \
	LIMIT 2';

const sqlTotalProduction =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? AND \
    (reading.sampling_site_id = ? OR reading.sampling_site_id = ?)\
    ORDER BY reading.created_date DESC \
    LIMIT 30';

const sqlSitePressure =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? \
    ORDER BY reading.created_date DESC \
    LIMIT 10';

const sqlFlowRate =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? \
    ORDER BY reading.created_date DESC \
    LIMIT 10';

const sqlProduction =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? AND \
    (reading.sampling_site_id = ? OR reading.sampling_site_id = ?)\
    AND reading.created_date BETWEEN ? AND ? \
    ORDER BY reading.created_date';

const sqlTotalChlorine =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? AND reading.sampling_site_id = ? \
    AND reading.created_date BETWEEN ? AND ? \
    ORDER BY reading.created_date';

const sqlTDS =
	'SELECT reading.created_date, reading.sampling_site_id, measurement.parameter_id, measurement.value \
    FROM reading \
    INNER JOIN measurement \
    ON reading.id = measurement.reading_id \
    WHERE reading.kiosk_id = ? AND measurement.parameter_id = ? AND reading.sampling_site_id = ? \
    AND reading.created_date BETWEEN ? AND ? \
    ORDER BY reading.created_date';

const sqlParameter=
	'SELECT id, name, manual, unit, minimum, maximum, active, is_used_in_totalizer FROM parameter';

const sqlSamplingSite=
	'SELECT id, name, is_used_for_totalizer FROM sampling_site';

const sqlSamplingSiteParameterMapping =
	'SELECT * from kiosk_parameter where kiosk_id = ?';

const parseReadings = (readings, userId, siteId) => {
	return Object.keys(readings).reduce((final, key) => {
		let [sampling_site_id, parameter_id] = key.split('-');

		let instance = {
			kiosk_id: siteId,
			parameter_id,
			sampling_site_id,
			value: readings[key],
			user_id: userId
		}

		final.push(instance);

		return final;
	}, []);
}

router.post('/pgwc', async (req, res) => {
	semaLog.info('water-operations PGWC Entry');

	const {
		clientReadings,
		clientDevice
	} = req.body;

	Device.hasMany(Sensor);
	Device.hasMany(DeviceWaterAmount);

	let [err0, device] = await __hp(Device.findOne({
		where: {
			user_id: clientDevice.user_id
		},
		include: [
			{ model: Sensor },
			{
				model: DeviceWaterAmount,
				order: [['created_at', 'DESC']],
				limit: 1
			}
		]
	}));

	if (err0) {
		semaLog.warn(`sema_water_operations:PGWC Entry - Error: ${JSON.stringify(err)}`);
		return res.status(500).json({ msg: "Internal Server Error"});
	} else if (!device) {
		semaLog.warn(`sema_water_operations:PGWC Entry - Error: ${JSON.stringify(err)}`);
		return res.status(404).json({ msg: "Device not found"});
	}

	const maxWaterAmountDate = device.device_water_amounts[0].created_at;

	// Insert readings then reduce their value from the currentWaterAmount.
	// If the reading date of the reading is older than the last set max amount
	// for the device, it's an old reading that wasn't synced yet, we don't
	// reduce it from the current water amount
	for (reading of clientReadings) {
		const [err1, savedReading] = await __hp(Reading.create(reading));

		// We only reduce it if it were correctly inserted
		// And if the reading was read after the max amount was set
		if (!err1) {
			if (moment(savedReading.created_at).isAfter(maxWaterAmountDate)) {
				device.current_water_amount -= savedReading.value;

				await device.save();
			}
		} else {
			// Something's wrong with this particular reading and it threw an error
			// TODO: It should never get to this point because we're checking for the data integrity
			// in the beginning with Yup
			// console.log(err1);
		}
	}

	// Get the user by primary key with the assigned role code
	let [err2, user] = await __hp(User.findByPk(device.user_id, {
		include: [{
			model: Role,
			attributes: ['code']
		}]
	}));

	if (err2) {
		semaLog.warn(`sema_water_operations:PGWC Entry - Error: ${JSON.stringify(err2)}`);
		return res.status(500).json({ msg: "Internal Server Error"});
	} if (!user || !Object.keys(user).length) {
		semaLog.warn('sema_water_operations:PGWC Entry - User not found');
		return res.status(404).send({ msg: "User not found" });
	}

	user = await user.toJSON();
	device = await device.toJSON();

	const payload = {
		msg: "Successfully synchronized",
		device,
		user
	};

	payload.device.max_water_amount = {
		value: payload.device.device_water_amounts[0].water_amount,
		created_at: payload.device.device_water_amounts[0].created_at
	};

	// Delete the device_water_amounts property as to not confuse the client
	delete payload.device.device_water_amounts;

	res.json(payload);
});

/* POST reading values from manual entry */
router.post('/:siteId', async (req, res) => {
	semaLog.info('water-operations Entry');

	let err;
	let currentUser = {};
	let todayReadingCount = 0;

	const {
		waterOps
	} = req.body;

	const {
		date,
		username
	} = req.query;

	const {
		siteId
	} = req.params;

	// Count the amount of entries found for the day
	[err, todayReadingCount] = await __hp(Reading.count({
		where: {
			created_at: {
				[Op.between]: [
					date,
					moment(date).add(1,'days').format('YYYY-MM-DD')
				]
			},
			kiosk_id: siteId
		}
	}));

	// On error, return a generic error message and log the error
	if (err) {
		semaLog.warn(`sema_water_operations - Error: ${JSON.stringify(err)}`);
		return res.status(500).json({ msg: "Internal Server Error"});
	}

	// If there's already data for the current day and current kiosk, do nothing
	if (todayReadingCount >= Object.keys(waterOps).length) {
		return res.json({
			status: 'failure',
			msg: 'Readings already sent for the day'
		});
	}

	// Find the user ID from the username
	// TODO: send the full user object (omitting the password) on login
	[err, currentUser] = await __hp(User.findOne({
		where: {
			username
		}
	}));

	// On error, return a generic error message and log the error
	if (err) {
		semaLog.warn(`sema_water_operations - Error: ${JSON.stringify(err)}`);
		return res.status(500).json({ msg: "Internal Server Error"});
	}

	// Turn the client generated object into one that MySQL will understand
	const parsedReadings = parseReadings(waterOps, currentUser.id, siteId);

	console.log();
	console.dir(parsedReadings);
	console.log();

	// Insert readings in bulk
	await Reading.bulkCreate(parsedReadings);

	res.json({
		status: 'success',
		msg: 'Successfully entered readings for the day'
	});
 });

/* GET configurations - parameters and site IDs */
router.get('/configs/:siteId', function(request, response) {
   semaLog.info('water-operations Entry');
   __pool.getConnection((err, connection) => {
	   getWaterOpConfigs(request.params.siteId, connection).then(results => {
		   return yieldResults(response, results);
	   })
	   .then(() => {
		   connection.release();
	   })
	   .catch(err => {
		   if (connection) {
			   connection.release();
		   }
		   return yieldError(err, response, 500, []);
	   })
   });
});

// TODO: Turn the MySQL queries into promises to shorten this function
// TODO: Actually, use Sequelize... Finally.
const getWaterOpConfigs = (siteId, connection) => {
   return new Promise((resolve ) => {
	   connection.query(sqlParameter, (err, parameters) => {
		   if (err) {
			   semaLog.error("water-operations. Error resolving parameter ids ", err );
			   reject();
		   } else {
			   connection.query(sqlSamplingSite, (err, samplingSites) => {
				   if (err) {
					   semaLog.error("water-operations. Error resolving sampling site ids ", err );
					   reject();
				   } else {
					   connection.query(sqlSamplingSiteParameterMapping, [siteId], (err, samplingSiteParameterMapping) => {
						   if (err) {
							   semaLog.error("water-operations. Error resolving sampling site, kiosk and parameter mapping ", err );
							   reject();
						   } else {
							   resolve({
								   parameters,
								   samplingSites,
								   samplingSiteParameterMapping
							   })
						   }
					   });
				   }
			   });
		   }
	   });
   });

};

/* GET water operations. */

router.get('/', function(request, response) {
	semaLog.info( 'water-operations Entry - kiosk: - ', request.query.kioskID );

	let results = initResults();

	request.check("kioskID", "Parameter kioskID is missing").exists();
	request.check("groupby", "Parameter groupby is missing").exists();

	request.getValidationResult().then(function(result) {
		if (!result.isEmpty()) {
			const errors = result.array().map((elem) => {
				return elem.msg;
			});
			semaLog.error("water-operations VALIDATION ERROR: ", errors );
			response.status(400).send(errors.toString());
		} else {
			let endDate = null;
			let beginDate = null;
			if (request.query.hasOwnProperty("enddate")) {
				endDate = new Date(Date.parse(request.query.enddate));
			}

			__pool.getConnection((err, connection) => {
				getParametersAndSiteIds(connection ).then( () => {
					getMostRecentReading(connection, request.query, endDate).then((newEndDate) => {
						endDate = newEndDate;
						results.latestDate = endDate;
						beginDate = new Date(newEndDate.getFullYear(), newEndDate.getMonth(), 1);	// 	Default to start of previous month
						beginDate.addMonths(-1);

						getTotalOrFillProduction(connection, request.query, results.totalProduction, "AM: Product Line", "PM: Product Line", results).then(() => {
							getTotalOrFillProduction(connection, request.query, results.fillStation, "Fill Station", "PM: Fill Station", results).then(() => {
							getSitePressure(connection, request.query, "PRE-FILTER PRESSURE IN", results.sitePressureIn,  results).then(() => {
								getSitePressure(connection, request.query, "PRE-FILTER PRESSURE OUT", results.sitePressureOut,  results).then(() => {
									getSitePressure(connection, request.query, "MEMBRANE FEED PRESSURE", results.sitePressureMembrane,  results).then(() => {
										getFlowRate(connection, request.query, "Feed Flow Rate", results.flowRateFeed, results).then(() => {
										getFlowRate(connection, request.query, "Product Flow Rate", results.flowRateProduct, results).then(() => {
										getProduction(connection, request.query, beginDate, endDate, results).then(() => {
										getTotalChlorine(connection, request.query, beginDate, endDate, results).then(() => {
										getTDS(connection, request.query, beginDate, endDate, results).then(() => {
											yieldResults(response, results);
										}).catch(err => {
											yieldError(err, response, 500, results);
										});
										}).catch(err => {
											yieldError(err, response, 500, results);
										});
										}).catch(err => {
											yieldError(err, response, 500, results);
										});
										}).catch(err => {
											yieldError(err, response, 500, results);
										});
										}).catch(err => {
											yieldError(err, response, 500, results);
										});
									}).catch(err => {
										yieldError(err, response, 500, results);
									});
								}).catch(err => {
									yieldError(err, response, 500, results);
								});
							}).catch(err => {
								yieldError(err, response, 500, results);
							});
							}).catch(err => {
								yieldError(err, response, 500, results);
							});
						}).catch(err => {
							yieldError(err, response, 500, results);
						});
					});
				}).then(() => {
					connection.release();
				});
			});
		}
	});
});

function getTotalOrFillProduction(connection, params, productionName, firstReading, secondReading, results) {
	return new Promise((resolve, reject) => {

		const gallonsId = getParameterIdFromMap("Gallons");
		const firstSiteId = getSamplingSiteIdFromMap( firstReading );
		const secondSiteId = getSamplingSiteIdFromMap( secondReading );

		connection.query(sqlTotalProduction, [params.kioskID, gallonsId, firstSiteId, secondSiteId], function (err, result) {
			if (err) {
				reject(err);
			} else {
				try {
					if (Array.isArray(result) && result.length >= 2) {
						for (let i = 0; i < result.length - 1; i++) {
							let date1 = Date.parse(result[i].created_date);
							let date2 = Date.parse(result[i+1].created_date);

							if (
								result[i].sampling_site_id !== result[i + 1].sampling_site_id &&
								date1.getFullYear() === date2.getFullYear() &&
								date1.getMonth() === date2.getMonth()  &&
								date1.getDate() === date2.getDate()) {
								productionName.value = Math.abs( result[i+1].value - result[i].value );
								productionName.date = new Date(result[i].created_date);
								break;
							}
						}
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
}


const getSitePressure = (connection, params, pressureName, pressureResult,  results) =>{
	return new Promise((resolve, reject) => {
		const filterPressure = getParameterIdFromMap(pressureName);
		connection.query(sqlSitePressure, [params.kioskID, filterPressure], function (err, result) {
			if (err) {
				reject(err);
			} else {
				try{
					if (Array.isArray(result) && result.length >= 1) {
						pressureResult.value = parseFloat(result[0].value);
						pressureResult.date = new Date(result[0].created_date);
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
};



const getFlowRate = (connection, params, flowRateName, flowRateResult, results) => {

	const flowRateId = getParameterIdFromMap(flowRateName);
	return new Promise((resolve, reject) => {
		connection.query(sqlFlowRate, [params.kioskID, flowRateId], function (err, result) {
			if (err) {
				reject(err);
			} else {
				try{
					if (Array.isArray(result) && result.length >= 1) {
						flowRateResult.value = parseFloat(result[0].value);
						flowRateResult.date = new Date(result[0].created_date);
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
};

function getProduction(connection, params, beginDate, endDate, results) {
	// Notes on constants TBD....
	// 127 gallons ??
	return new Promise((resolve, reject) => {
		const gallonsId = getParameterIdFromMap("Gallons");
		const amProductLine = getSamplingSiteIdFromMap("AM: Product Line");
		const pmProductLine = getSamplingSiteIdFromMap("PM: Product Line");
		connection.query(sqlProduction, [params.kioskID, gallonsId, pmProductLine, amProductLine, beginDate, endDate], function (err, result ) {
			if (err) {
				reject(err);
			} else {
				try {
					if (Array.isArray(result) && result.length >= 2) {
						const prodValues =[];
						const timeTicks =[];
						for (let i = 0; i < result.length - 1; i++) {
							let date1 = Date.parse(result[i].created_date);
							let date2 = Date.parse(result[i+1].created_date);

							if( result[i].sampling_site_id !== result[i + 1].sampling_site_id &&
								date1.getFullYear() === date2.getFullYear() &&
								date1.getMonth() === date2.getMonth()  &&
								date1.getDate() === date2.getDate()) {

								prodValues.push(Math.abs( result[i+1].value - result[i].value ));
								timeTicks.push(result[i].created_date);

								i++;
							}
						}
						results.production = {
							x_axis: timeTicks,
							datasets: [{label: 'Total Production', data: prodValues}]
						};
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
}

function getTotalChlorine(connection, params, beginDate, endDate, results) {
	// Notes on constants TBD....
	// 120 total chlorine ??
	// Site ID = 75 - Water treatment unit
	const totalChlorineId = getParameterIdFromMap("Total Chlorine");
	const waterTreatmentUnitId = getSamplingSiteIdFromMap("Water Treatment Unit");

	return new Promise((resolve, reject) => {
		connection.query(sqlTotalChlorine, [params.kioskID, totalChlorineId, waterTreatmentUnitId, beginDate, endDate], function (err, result) {
			if (err) {
				reject(err);
			} else {
				try {
					if (Array.isArray(result) && result.length >= 1) {
						const timeTicks = result.map(item =>{return item.created_date});
						const values = result.map(item =>{return parseFloat(item.value)});
						results.chlorine = {
							x_axis: timeTicks,
							datasets: [{label: 'Total Chlorine', data: values}]
						};
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
}

function getTDS(connection, params, beginDate, endDate, results) {
	// Notes on constants TBD....
	// 121 Total disolved solids
	// Site ID = 75 - Water treatment unit
	const totalDissolvedSolidsId = getParameterIdFromMap("Total Dissolved Solids");
	const waterTreatmentUnitId = getSamplingSiteIdFromMap("Water Treatment Unit");

	return new Promise((resolve, reject) => {
		connection.query(sqlTDS, [params.kioskID, totalDissolvedSolidsId, waterTreatmentUnitId, beginDate, endDate], function (err, result) {
			if (err) {
				reject(err);
			} else {
				try {
					if (Array.isArray(result) && result.length >= 1) {
						const timeTicks = result.map(item =>{return item.created_date});
						const values = result.map(item =>{return item.value});
						results.tds = {
							x_axis: timeTicks,
							datasets: [{label: 'TDS', data: values}]
						};
					}
					resolve();
				}catch( ex){
					reject( {message:ex.message});
				}
			}
		});
	});
}

const getMostRecentReading = ( connection, requestParams, endDate ) => {
	return new Promise(( resolve ) => {
		if( endDate != null ){
			resolve( endDate);
		}else{
			connection.query(sqlLMostRecentReading, [requestParams.kioskID], (err, sqlResult )=>{
				if (err) {
					resolve(new Date(Date.now()));
				}else{
					if (Array.isArray(sqlResult) && sqlResult.length > 0) {
						endDate = new Date(sqlResult[0]["created_date"]);
						resolve( endDate );
					}
					resolve(new Date(Date.now()));
				}
			})
		}
	});
};

const getParameterIdFromMap = ( parameter ) =>{
	return (typeof parameter_id_map[parameter] === "undefined" ) ? -1 : parameter_id_map[parameter];
};

const getSamplingSiteIdFromMap = ( parameter ) =>{
	return (typeof sampling_site_id_map[parameter] === "undefined" ) ? -1 : sampling_site_id_map[parameter];
};

const getParametersAndSiteIds = (connection) => {
	return new Promise((resolve ) => {
		if ( Object.keys( parameter_id_map).length === 0 || Object.keys(sampling_site_id_map).length === 0){
			parameter_id_map = {};
			sampling_site_id_map= {};
			connection.query(sqlParameter, (err, sqlResult) => {
				if (err) {
					semaLog.error("water-operations. Error resolving parameter ids ", err );
					resolve();
				} else {
					if (Array.isArray(sqlResult)){
						parameter_id_map = sqlResult.reduce( (map, item) => {
							map[item.name] = item.id;
							return map;
						}, {});
					}
					connection.query(sqlSamplingSite, (err, sqlResult) => {
						if (err) {
							semaLog.error("water-operations. Error resolving sampling site ids ", err );
							resolve();
						}else{
							sampling_site_id_map = sqlResult.reduce( (map, item) => {
								map[item.name] = item.id;
								return map;
							}, {});
						}
						resolve();
					});
				}
			})
		}else{
			resolve();
		}
	});

};

const yieldResults =(res, results ) =>{
	semaLog.info("water-operations - exit");
	res.json(results);
};

const yieldError = (err, response, httpErrorCode, results ) =>{
	semaLog.error("water-operations: ERROR: ", err.message, "HTTP Error code: ", httpErrorCode);
	response.status(httpErrorCode);
	response.json(results);
};

const initResults = () => {
	return {
		totalProduction: {value:"N/A", date:"N/A"},
		fillStation: {value:"N/A", date:"N/A"},
		sitePressureIn: {value:"N/A", date:"N/A"},
		sitePressureOut: {value:"N/A", date:"N/A"},
		sitePressureMembrane: {value:"N/A", date:"N/A"},
		flowRateFeed:{value:"N/A", date:"N/A"},
		flowRateProduct:{value:"N/A", date:"N/A"},

		production:initEmptyChart(),
		chlorine:initEmptyChart(),
		tds:initEmptyChart()};

};
const initEmptyChart = () => {
	return { x_axis: [], datasets: []};
};
module.exports = router;
