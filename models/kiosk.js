/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('kiosk', {
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
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: '1'
		},
		name: {
			type: DataTypes.STRING(150),
			allowNull: false
		},
		region_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'region',
				key: 'id'
			}
		},
		consumer_base: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		gps_coordinates: {
			type: DataTypes.STRING(255),
			allowNull: true
		}
	}, {
		tableName: 'kiosk',
		timestamps: false,
		underscored: true
	});
};
