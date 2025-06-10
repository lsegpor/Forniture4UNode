const express = require("express");
const router = express.Router();
const pedidoController = require("../controllers/pedidoController");
const { verifyToken, esEmpresa } = require("../middlewares/authMiddleware");

const {
  validarPedido,
  validarPaginacion,
  validarFechas,
  validarParametrosNumericos,
  validarProductosStock,
  sanitizarDatos,
  validarPropietarioPedido,
  puedeCrearPedido,
  aplicarLimitesRol,
  notFoundHandler,
  errorHandler,
} = require("../middlewares/pedidoMiddleware");

router.get(
  "/estadisticas/por-fecha",
  verifyToken,
  esEmpresa,
  sanitizarDatos,
  validarFechas,
  pedidoController.getPedidosPorFecha
);

router.get(
  "/empresa/mis-pedidos",
  verifyToken,
  esEmpresa,
  pedidoController.getPedidosByEmpresa
);

router.post(
  "/",
  verifyToken,
  sanitizarDatos,
  validarPedido,
  puedeCrearPedido,
  pedidoController.createPedido
);

router.get(
  "/usuario/:id_usuario",
  verifyToken,
  validarParametrosNumericos,
  validarPropietarioPedido,
  sanitizarDatos,
  validarPaginacion,
  aplicarLimitesRol,
  pedidoController.getPedidosByUser
);

router.post(
  "/verificar-stock",
  verifyToken,
  sanitizarDatos,
  validarProductosStock,
  pedidoController.verificarStock
);

router.get(
  "/",
  verifyToken,
  esEmpresa,
  sanitizarDatos,
  validarPaginacion,
  validarFechas,
  pedidoController.getAllPedidos
);

router.put(
  "/:id_pedido/estado",
  verifyToken,
  validarParametrosNumericos,
  sanitizarDatos,
  pedidoController.updateEstadoPedido
);

router.delete(
  "/:id_pedido",
  verifyToken,
  esEmpresa,
  validarParametrosNumericos,
  pedidoController.deletePedido
);

router.use("*", notFoundHandler);
router.use(errorHandler);

module.exports = router;
