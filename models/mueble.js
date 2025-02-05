const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mueble', {
    id_mueble: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    precio_base: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    fecha_entrega: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    requiere_montar: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'mueble',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_mueble" },
        ]
      },
    ]
  });
};
