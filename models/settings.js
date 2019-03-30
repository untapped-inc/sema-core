/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('settings', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(150),
			allowNull: false,
			unique: true
		},
		name: {
			type: DataTypes.STRING(150),
			allowNull: false,
			unique: true
		},
		value: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING(150),
			allowNull: false
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
		tableName: 'settings',
		timestamps: false,
		underscored: true
	});
};
