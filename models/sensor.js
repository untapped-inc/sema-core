/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('sensor', {
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
		codename: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		sampling_site_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'sampling_site',
				key: 'id'
			}
		},
		parameter_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'parameter',
				key: 'id'
			}
		},
		device_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'device',
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
		}
	}, {
		tableName: 'sensor',
		timestamps: false,
		underscored: true
	});
};
