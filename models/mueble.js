const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "mueble",
    {
      id_mueble: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: "nombre",
      },
      precio_base: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      fecha_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      requiere_montar: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      id_empresa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "empresa",
          key: "id_empresa",
        },
      },
      imagen: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      imagen_public_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: "imagen_public_id",
      },
      descripcion: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: "descripcion",
      },
    },
    {
      sequelize,
      tableName: "mueble",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_mueble" }],
        },
        {
          name: "nombre",
          unique: true,
          using: "BTREE",
          fields: [{ name: "nombre" }],
        },
        {
          name: "fk_empresa_mueble",
          using: "BTREE",
          fields: [{ name: "id_empresa" }],
        },
      ],
    }
  );
};
