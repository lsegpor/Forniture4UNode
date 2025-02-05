const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('muebleComponentes', {
    id_mueble: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'mueble',
        key: 'id_mueble'
      }
    },
    id_componente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'componentes',
        key: 'id_componente'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'mueble_componentes',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_mueble" },
          { name: "id_componente" },
        ]
      },
      {
        name: "id_componente",
        using: "BTREE",
        fields: [
          { name: "id_componente" },
        ]
      },
    ]
  });
};
