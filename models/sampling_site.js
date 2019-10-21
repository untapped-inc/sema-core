/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('sampling_site', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		is_used_for_totalizer: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(255),
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
		},
		followup_to_site_id: {
			type: DataTypes.BIGINT,
			allowNull: true,
			references: {
				model: 'sampling_site',
				key: 'id'
			}
		}
	}, {
		tableName: 'sampling_site',
		timestamps: false,
		underscored: true
	});
};
