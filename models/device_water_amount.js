/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('device_water_amount', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
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
		device_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'device',
				key: 'id'
			}
		},
		water_amount: {
			type: DataTypes.INTEGER(11).UNSIGNED,
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
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: '1'
		}
	}, {
		tableName: 'device_water_amount',
		timestamps: false,
		underscored: true
	});
};
