/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('kiosk_settings', {
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
		kiosk_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'kiosk',
				key: 'id'
			}
		},
		settings_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'settings',
				key: 'id'
			}
		},
		value: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: '1'
		}
	}, {
		tableName: 'kiosk_settings',
		timestamps: false,
		underscored: true
	});
};
