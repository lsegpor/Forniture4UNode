var DataTypes = require("sequelize").DataTypes;
var _componentes = require("./componentes");
var _mueble = require("./mueble");
var _muebleComponentes = require("./muebleComponentes");

function initModels(sequelize) {
  var componentes = _componentes(sequelize, DataTypes);
  var mueble = _mueble(sequelize, DataTypes);
  var muebleComponentes = _muebleComponentes(sequelize, DataTypes);

  componentes.belongsToMany(mueble, { as: 'id_mueble_muebles', through: muebleComponentes, foreignKey: "id_componente", otherKey: "id_mueble" });
  mueble.belongsToMany(componentes, { as: 'id_componente_componentes', through: muebleComponentes, foreignKey: "id_mueble", otherKey: "id_componente" });
  muebleComponentes.belongsTo(componentes, { as: "id_componente_componente", foreignKey: "id_componente"});
  componentes.hasMany(muebleComponentes, { as: "mueble_componentes", foreignKey: "id_componente"});
  muebleComponentes.belongsTo(mueble, { as: "id_mueble_mueble", foreignKey: "id_mueble"});
  mueble.hasMany(muebleComponentes, { as: "mueble_componentes", foreignKey: "id_mueble"});

  return {
    componentes,
    mueble,
    muebleComponentes,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
