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

router.post(
  "/",
  verifyToken,
  sanitizarDatos,
  validarPedido,
  puedeCrearPedido,
  pedidoController.createPedido
);

router.post(
  "/verificar-stock",
  verifyToken,
  sanitizarDatos,
  validarProductosStock,
  pedidoController.verificarStock
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

router.get(
  "/",
  verifyToken,
  esEmpresa,
  sanitizarDatos,
  validarPaginacion,
  validarFechas,
  pedidoController.getAllPedidos
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
