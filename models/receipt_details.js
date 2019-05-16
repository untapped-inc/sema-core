/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('receipt_details', {
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: '0000-00-00 00:00:00'
		},
		quantity: {
			type: DataTypes.STRING(45),
			allowNull: false
		},
		product_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		receipt_id: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		sales_channel_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		kiosk_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		amount_cash: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		amount_loan: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		amount_mobile: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		amount_card: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		customer_account_id: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		unit_per_product: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		volume: {
			type: "DOUBLE",
			allowNull: false,
			defaultValue: '0'
		},
		total: {
			type: DataTypes.DECIMAL,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		income_level: {
			type: DataTypes.DECIMAL,
			allowNull: true
		},
		customer_type_id: {
			type: DataTypes.BIGINT,
			allowNull: false
		}
	}, {
		tableName: 'receipt_details',
		timestamps: false,
		underscored: true
	});
};
