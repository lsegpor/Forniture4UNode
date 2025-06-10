var DataTypes = require("sequelize").DataTypes;
var _componentes = require("./componentes");
var _empresa = require("./empresa");
var _mueble = require("./mueble");
var _mueble_componentes = require("./mueble_componentes");
var _pedido = require("./pedido");
var _pedido_producto = require("./pedido_producto");
var _usuario = require("./usuario");

function initModels(sequelize) {
  var componentes = _componentes(sequelize, DataTypes);
  var empresa = _empresa(sequelize, DataTypes);
  var mueble = _mueble(sequelize, DataTypes);
  var mueble_componentes = _mueble_componentes(sequelize, DataTypes);
  var pedido = _pedido(sequelize, DataTypes);
  var pedido_producto = _pedido_producto(sequelize, DataTypes);
  var usuario = _usuario(sequelize, DataTypes);

  componentes.belongsToMany(mueble, { as: 'id_mueble_muebles', through: mueble_componentes, foreignKey: "id_componente", otherKey: "id_mueble" });
  mueble.belongsToMany(componentes, { as: 'id_componente_componentes', through: mueble_componentes, foreignKey: "id_mueble", otherKey: "id_componente" });
  mueble_componentes.belongsTo(componentes, { as: "id_componente_componente", foreignKey: "id_componente"});
  componentes.hasMany(mueble_componentes, { as: "mueble_componentes", foreignKey: "id_componente"});
  mueble.belongsTo(empresa, { as: "id_empresa_empresa", foreignKey: "id_empresa"});
  empresa.hasMany(mueble, { as: "muebles", foreignKey: "id_empresa"});
  mueble_componentes.belongsTo(mueble, { as: "id_mueble_mueble", foreignKey: "id_mueble"});
  mueble.hasMany(mueble_componentes, { as: "mueble_componentes", foreignKey: "id_mueble"});
  pedido_producto.belongsTo(pedido, { as: "id_pedido_pedido", foreignKey: "id_pedido"});
  pedido.hasMany(pedido_producto, { as: "pedido_productos", foreignKey: "id_pedido"});
  pedido.belongsTo(usuario, { as: "id_usuario_usuario", foreignKey: "id_usuario"});
  usuario.hasMany(pedido, { as: "pedidos", foreignKey: "id_usuario"});

  return {
    componentes,
    empresa,
    mueble,
    mueble_componentes,
    pedido,
    pedido_producto,
    usuario,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
