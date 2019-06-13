/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('device', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		serial_number: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		ip_address: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		firmware: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		kiosk_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		user_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'user',
				key: 'id'
			}
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		},
		current_water_amount: {
			type: DataTypes.INTEGER(10).UNSIGNED,
			allowNull: true
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: '1'
		}
	}, {
		tableName: 'device',
		timestamps: false,
		underscored: true
	});
};
