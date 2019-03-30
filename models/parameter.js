/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('parameter', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: '1'
		},
		is_ok_not_ok: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		is_used_in_totalizer: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		manual: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		maximum: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		minimum: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true
		},
		priority: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		unit: {
			type: DataTypes.STRING(255),
			allowNull: true
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
		tableName: 'parameter',
		timestamps: false,
		underscored: true
	});
};
