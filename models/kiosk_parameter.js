/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('kiosk_parameter', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		kiosk_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'kiosk',
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
		sampling_site_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'sampling_site',
				key: 'id'
			}
		}
	}, {
		tableName: 'kiosk_parameter',
		timestamps: false,
		underscored: true
	});
};
