const initModels = require("../models/init-models").initModels;
const sequelize = require("../config/sequelize");
const models = initModels(sequelize);
const Pedido = models.pedido;

// Middleware de validación para pedidos
const validarPedido = (req, res, next) => {
  const { productos } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Se requiere un array de productos",
    });
  }

  const productosValidos = productos.every(
    (producto) =>
      producto.id_producto &&
      producto.tipo_producto &&
      ["mueble", "componente"].includes(producto.tipo_producto) &&
      producto.cantidad &&
      producto.cantidad > 0 &&
      Number.isInteger(producto.cantidad)
  );

  if (!productosValidos) {
    return res.status(400).json({
      success: false,
      message:
        "Productos inválidos: verifique que todos tengan id_producto, tipo_producto válido (mueble/componente) y cantidad > 0",
    });
  }

  next();
};

// Middleware para validar parámetros de paginación
const validarPaginacion = (req, res, next) => {
  const { limite, pagina } = req.query;

  if (
    limite &&
    (isNaN(limite) || parseInt(limite) <= 0 || parseInt(limite) > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "El límite debe ser un número entre 1 y 100",
    });
  }

  if (pagina && (isNaN(pagina) || parseInt(pagina) <= 0)) {
    return res.status(400).json({
      success: false,
      message: "La página debe ser un número mayor a 0",
    });
  }

  next();
};

// Middleware para validar formato de fechas
const validarFechas = (req, res, next) => {
  const { fecha_desde, fecha_hasta } = req.query;

  if (fecha_desde && isNaN(Date.parse(fecha_desde))) {
    return res.status(400).json({
      success: false,
      message: "Formato de fecha_desde inválido. Use YYYY-MM-DD",
    });
  }

  if (fecha_hasta && isNaN(Date.parse(fecha_hasta))) {
    return res.status(400).json({
      success: false,
      message: "Formato de fecha_hasta inválido. Use YYYY-MM-DD",
    });
  }

  if (
    fecha_desde &&
    fecha_hasta &&
    new Date(fecha_desde) > new Date(fecha_hasta)
  ) {
    return res.status(400).json({
      success: false,
      message: "La fecha_desde debe ser anterior a fecha_hasta",
    });
  }

  next();
};

// Middleware para validar parámetros numéricos
const validarParametrosNumericos = (req, res, next) => {
  const { id_pedido, id_usuario } = req.params;

  if (id_pedido && (isNaN(id_pedido) || parseInt(id_pedido) <= 0)) {
    return res.status(400).json({
      success: false,
      message: "ID de pedido inválido",
    });
  }

  if (id_usuario && (isNaN(id_usuario) || parseInt(id_usuario) <= 0)) {
    return res.status(400).json({
      success: false,
      message: "ID de usuario inválido",
    });
  }

  next();
};

// Middleware para validar productos en verificación de stock
const validarProductosStock = (req, res, next) => {
  const { productos } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Se requiere un array de productos",
    });
  }

  const productosValidos = productos.every(
    (producto) =>
      producto.id_producto &&
      producto.tipo_producto &&
      ["mueble", "componente"].includes(producto.tipo_producto) &&
      producto.cantidad_solicitada &&
      producto.cantidad_solicitada > 0 &&
      Number.isInteger(producto.cantidad_solicitada)
  );

  if (!productosValidos) {
    return res.status(400).json({
      success: false,
      message:
        "Cada producto debe tener id_producto, tipo_producto válido y cantidad_solicitada > 0",
    });
  }

  next();
};

// Middleware para sanitizar y normalizar datos de entrada
const sanitizarDatos = (req, res, next) => {
  // Sanitizar query parameters
  if (req.query.limite) {
    req.query.limite = Math.min(parseInt(req.query.limite), 100);
  }

  if (req.query.pagina) {
    req.query.pagina = Math.max(parseInt(req.query.pagina), 1);
  }

  if (req.query.orden) {
    req.query.orden = req.query.orden.toUpperCase() === "DESC" ? "DESC" : "ASC";
  }

  // Sanitizar body si tiene productos
  if (req.body.productos) {
    req.body.productos = req.body.productos.map((producto) => ({
      ...producto,
      id_producto: parseInt(producto.id_producto),
      cantidad: parseInt(producto.cantidad || producto.cantidad_solicitada),
      tipo_producto: producto.tipo_producto.toLowerCase(),
    }));
  }

  next();
};

// Middleware para validar que el usuario solo acceda a sus propios pedidos
const validarPropietarioPedido = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const usuarioLogueado = req.usuarioLogueado; // Viene del middleware verifyToken

    // Si es empresa, puede ver todos los pedidos
    if (usuarioLogueado.role === "empresa") {
      return next();
    }

    // Si es usuario normal, solo puede ver sus propios pedidos
    if (parseInt(id_usuario) !== usuarioLogueado.id_usuario) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a estos pedidos",
      });
    }

    next();
  } catch (error) {
    console.error("Error validando propietario del pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error validando permisos",
    });
  }
};

// Middleware para validar acceso a un pedido específico
const validarAccesoPedido = async (req, res, next) => {
  try {
    const { id_pedido } = req.params;
    const usuarioLogueado = req.usuarioLogueado; // Viene del middleware verifyToken

    const pedido = await Pedido.findByPk(id_pedido, {
      attributes: ["id_pedido", "id_usuario"],
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
      });
    }

    // Si es empresa, puede acceder a cualquier pedido
    if (usuarioLogueado.role === "empresa") {
      req.pedido = pedido;
      return next();
    }

    // Si es usuario normal, solo puede acceder a sus propios pedidos
    if (pedido.id_usuario !== usuarioLogueado.id_usuario) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este pedido",
      });
    }

    req.pedido = pedido;
    next();
  } catch (error) {
    console.error("Error validando acceso al pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error validando permisos",
    });
  }
};

// Middleware para verificar que el usuario puede crear pedidos
const puedeCrearPedido = (req, res, next) => {
  try {
    const usuarioLogueado = req.usuarioLogueado; // Viene del middleware verifyToken
    const { id_usuario } = req.body;

    if (!usuarioLogueado) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Las empresas pueden crear pedidos para cualquier usuario
    if (usuarioLogueado.role === "empresa") {
      return next();
    }

    // Obtener el ID del usuario logueado (JWT usa 'sub' como estándar)
    const idUsuarioLogueado =
      usuarioLogueado.sub || usuarioLogueado.id_usuario || usuarioLogueado.id;

    if (!id_usuario || parseInt(id_usuario) !== parseInt(idUsuarioLogueado)) {
      return res.status(403).json({
        success: false,
        message: `No puedes crear pedidos para otros usuarios. ID solicitado: ${id_usuario}, ID del usuario logueado: ${idUsuarioLogueado}`,
        details: {
          id_usuario_solicitado: id_usuario,
          id_usuario_logueado: idUsuarioLogueado,
          tipos: {
            solicitado: typeof id_usuario,
            logueado: typeof idUsuarioLogueado,
          },
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error validando creación de pedido:", error);
    res.status(500).json({
      success: false,
      message: "Error validando permisos",
    });
  }
};

// Middleware para establecer límites según el rol del usuario
const aplicarLimitesRol = (req, res, next) => {
  try {
    const usuarioLogueado = req.usuarioLogueado; // Viene del middleware verifyToken

    // Límites para usuarios normales
    if (usuarioLogueado.role === "usuario") {
      // Limitar consultas de pedidos a los últimos 6 meses
      if (!req.query.fecha_desde) {
        const hace6Meses = new Date();
        hace6Meses.setMonth(hace6Meses.getMonth() - 6);
        req.query.fecha_desde = hace6Meses.toISOString().split("T")[0];
      }

      // Limitar número de pedidos por consulta
      if (!req.query.limite || parseInt(req.query.limite) > 20) {
        req.query.limite = "20";
      }
    }

    next();
  } catch (error) {
    console.error("Error aplicando límites por rol:", error);
    res.status(500).json({
      success: false,
      message: "Error aplicando límites",
    });
  }
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    timestamp: new Date().toISOString(),
  });
};

// Middleware para manejar errores generales
const errorHandler = (error, req, res, next) => {
  console.error("Error capturado:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Error de validación de Sequelize
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // Error de constrainto único de Sequelize
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Ya existe un registro con estos datos",
      field: error.errors[0]?.path,
    });
  }

  // Error de JWT
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    });
  }

  // Error por defecto
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

// Wrapper para manejo de errores asíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  // Validadores
  validarPedido,
  validarPaginacion,
  validarFechas,
  validarParametrosNumericos,
  validarProductosStock,
  sanitizarDatos,

  // Permisos
  validarPropietarioPedido,
  validarAccesoPedido,
  puedeCrearPedido,
  aplicarLimitesRol,

  // Manejo de errores
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
