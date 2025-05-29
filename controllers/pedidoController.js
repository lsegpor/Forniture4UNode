// controllers/pedidoController.js
const Respuesta = require("../utils/respuesta");
const { Op } = require("sequelize");
const sequelize = require("../config/sequelize");
const initModels = require("../models/init-models").initModels;
const models = initModels(sequelize);
const Componentes = models.componentes;
const Pedido = models.pedido;
const PedidoProducto = models.pedido_producto;
const Usuario = models.usuario;

class PedidoController {
  /**
   * Obtener componentes necesarios para un mueble
   * @param {number} id_mueble - ID del mueble
   * @returns {Array} - Array de componentes con sus cantidades
   */
  static async obtenerComponentesMueble(id_mueble) {
    try {
      const componentesMueble = await MuebleComponentes.findAll({
        where: { id_mueble },
        include: [
          {
            model: Componentes,
            as: "id_componente_componentes",
            attributes: ["id_componente", "nombre", "precio", "cantidad"],
          },
        ],
        attributes: ["cantidad"],
      });

      return componentesMueble.map((item) => ({
        id_componente: item.id_componente_componentes.id_componente,
        nombre: item.id_componente_componentes.nombre,
        precio: item.id_componente_componentes.precio,
        cantidad_necesaria: item.cantidad,
        stock_disponible: item.id_componente_componentes.cantidad,
      }));
    } catch (error) {
      throw new Error(
        `Error obteniendo componentes del mueble: ${error.message}`
      );
    }
  }

  /**
   * Validar stock de mueble basado en sus componentes
   * @param {number} id_mueble - ID del mueble
   * @param {number} cantidad_solicitada - Cantidad de muebles solicitada
   * @returns {Object} - Resultado de la validación
   */
  static async validarStockMueble(id_mueble, cantidad_solicitada) {
    try {
      const componentes = await this.obtenerComponentesMueble(id_mueble);

      for (const componente of componentes) {
        const cantidadNecesaria =
          componente.cantidad_necesaria * cantidad_solicitada;

        if (componente.stock_disponible < cantidadNecesaria) {
          return {
            valido: false,
            error:
              `Stock insuficiente del componente "${componente.nombre}". ` +
              `Necesario: ${cantidadNecesaria}, Disponible: ${componente.stock_disponible}`,
          };
        }
      }

      return { valido: true, componentes };
    } catch (error) {
      return { valido: false, error: error.message };
    }
  }

  /**
   * Reducir stock de componentes para un mueble
   * @param {number} id_mueble - ID del mueble
   * @param {number} cantidad - Cantidad de muebles
   * @param {Object} transaction - Transacción de Sequelize
   */
  static async reducirStockComponentesMueble(id_mueble, cantidad, transaction) {
    const componentes = await this.obtenerComponentesMueble(id_mueble);

    for (const componente of componentes) {
      const cantidadAReducir = componente.cantidad_necesaria * cantidad;

      await Componentes.decrement(
        "cantidad",
        {
          by: cantidadAReducir,
          where: { id_componente: componente.id_componente },
        },
        { transaction }
      );
    }
  }

  /**
   * Restaurar stock de componentes para un mueble (al cancelar pedido)
   * @param {number} id_mueble - ID del mueble
   * @param {number} cantidad - Cantidad de muebles
   * @param {Object} transaction - Transacción de Sequelize
   */
  static async restaurarStockComponentesMueble(
    id_mueble,
    cantidad,
    transaction
  ) {
    const componentes = await this.obtenerComponentesMueble(id_mueble);

    for (const componente of componentes) {
      const cantidadARestaurar = componente.cantidad_necesaria * cantidad;

      await Componentes.increment(
        "cantidad",
        {
          by: cantidadARestaurar,
          where: { id_componente: componente.id_componente },
        },
        { transaction }
      );
    }
  }

  /**
   * Crear un nuevo pedido
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  // En tu pedidoController.js, reemplaza el método createPedido:

  static async createPedido(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { productos } = req.body;

      // Obtener ID del usuario autenticado
      const id_usuario =
        req.usuarioLogueado.sub ||
        req.usuarioLogueado.id_usuario ||
        req.usuarioLogueado.id_empresa;

      if (!id_usuario) {
        await transaction.rollback();
        return res
          .status(400)
          .json(Respuesta.error(null, "No se pudo identificar al usuario"));
      }

      console.log("Creando pedido para usuario:", id_usuario);
      console.log("Productos:", productos);

      // Validaciones básicas
      if (!id_usuario || !productos || productos.length === 0) {
        await transaction.rollback();
        return res.status(400).json(Respuesta.error(null, "Datos incompletos"));
      }

      // Verificar que el usuario existe
      const usuario = await Usuario.findByPk(id_usuario);
      if (!usuario) {
        await transaction.rollback();
        return res
          .status(404)
          .json(Respuesta.error(null, "Usuario no encontrado"));
      }

      let precioTotal = 0;
      const productosValidados = [];

      // Validar productos y calcular precio total
      for (const producto of productos) {
        if (
          !producto.id_producto ||
          !producto.tipo_producto ||
          !producto.cantidad
        ) {
          await transaction.rollback();
          throw new Error(
            "Cada producto debe tener id_producto, tipo_producto y cantidad"
          );
        }

        let productoData = null;
        let precioUnitario = 0;

        if (producto.tipo_producto === "componente") {
          productoData = await Componentes.findByPk(producto.id_producto);
          if (!productoData) {
            await transaction.rollback();
            throw new Error(
              `Componente con ID ${producto.id_producto} no encontrado`
            );
          }
          precioUnitario = productoData.precio;

          // Verificar stock
          if (productoData.cantidad < producto.cantidad) {
            await transaction.rollback();
            throw new Error(
              `Stock insuficiente para ${productoData.nombre}. Disponible: ${productoData.cantidad}, Solicitado: ${producto.cantidad}`
            );
          }
        } else if (producto.tipo_producto === "mueble") {
          productoData = await Mueble.findByPk(producto.id_producto);
          if (!productoData) {
            await transaction.rollback();
            throw new Error(
              `Mueble con ID ${producto.id_producto} no encontrado`
            );
          }
          precioUnitario = productoData.precio_base;

          // Validar stock de componentes para el mueble
          const validacionStock = await this.validarStockMueble(
            producto.id_producto,
            producto.cantidad
          );

          if (!validacionStock.valido) {
            await transaction.rollback();
            throw new Error(validacionStock.error);
          }
        } else {
          await transaction.rollback();
          throw new Error(
            `Tipo de producto inválido: ${producto.tipo_producto}`
          );
        }

        precioTotal += precioUnitario * producto.cantidad;

        productosValidados.push({
          ...producto,
          precio_unitario: precioUnitario,
          productoData,
        });
      }

      // Crear el pedido principal
      const nuevoPedido = await Pedido.create(
        {
          id_usuario,
          f_pedido: new Date(),
          precio_total: precioTotal,
        },
        { transaction }
      );

      // Verificar si PedidoProducto existe, si no, usar un método alternativo
      let PedidoProductoModel =
        models.pedidoProducto ||
        models.pedido_producto ||
        models.PedidoProducto;

      if (!PedidoProductoModel) {
        console.error("Modelos disponibles:", Object.keys(models));
        throw new Error("Modelo PedidoProducto no encontrado");
      }

      // Crear los productos del pedido
      const productosConPedido = productosValidados.map((producto) => ({
        id_pedido: nuevoPedido.id_pedido,
        id_producto: producto.id_producto,
        tipo_producto: producto.tipo_producto,
        cantidad: producto.cantidad,
      }));

      await PedidoProductoModel.bulkCreate(productosConPedido, { transaction });

      // Actualizar stock
      for (const producto of productosValidados) {
        if (producto.tipo_producto === "componente") {
          await Componentes.decrement(
            "cantidad",
            {
              by: producto.cantidad,
              where: { id_componente: producto.id_producto },
            },
            { transaction }
          );
        } else if (producto.tipo_producto === "mueble") {
          // Reducir stock de los componentes necesarios para el mueble
          await this.reducirStockComponentesMueble(
            producto.id_producto,
            producto.cantidad,
            transaction
          );
        }
      }

      // Confirmar transacción
      await transaction.commit();

      // IMPORTANTE: Después del commit, NO usar más la transacción
      // Cargar el pedido completo FUERA de la transacción
      const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id_pedido, {
        include: [
          {
            model: PedidoProductoModel,
            as: "pedido_productos", // Asegúrate de que este alias coincida con tu modelo
          },
        ],
      });

      res
        .status(201)
        .json(Respuesta.exito(pedidoCompleto, "Pedido creado exitosamente"));
    } catch (error) {
      // Solo hacer rollback si la transacción no ha sido confirmada
      if (!transaction.finished) {
        await transaction.rollback();
      }

      console.error("Error creando pedido:", error);

      // Si la transacción ya fue confirmada pero hay error en la respuesta
      if (transaction.finished === "commit") {
        return res
          .status(201)
          .json(
            Respuesta.exito(
              null,
              "Pedido creado exitosamente, pero error al cargar detalles"
            )
          );
      }

      res
        .status(500)
        .json(
          Respuesta.error(null, error.message || "Error interno del servidor")
        );
    }
  }

  /**
   * Obtener todos los pedidos de un usuario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPedidosByUser(req, res) {
    try {
      const { id_usuario } = req.params;
      const { limite = 10, pagina = 1, orden = "DESC" } = req.query;

      // Verificar que el usuario existe
      const usuario = await Usuario.findByPk(id_usuario);
      if (!usuario) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Usuario no encontrado"));
      }

      const offset = (parseInt(pagina) - 1) * parseInt(limite);

      const { count, rows: pedidos } = await Pedido.findAndCountAll({
        where: { id_usuario },
        include: [
          {
            model: PedidoProducto,
            as: "pedido_productos",
          },
        ],
        order: [["f_pedido", orden.toUpperCase()]],
        limit: parseInt(limite),
        offset: offset,
      });

      res.json({
        success: true,
        data: {
          pedidos,
          pagination: {
            total: count,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(count / parseInt(limite)),
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo pedidos del usuario:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  /**
   * Obtener todos los pedidos (solo para administradores)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getAllPedidos(req, res) {
    try {
      const {
        limite = 20,
        pagina = 1,
        orden = "DESC",
        fecha_desde,
        fecha_hasta,
        id_usuario_filtro,
      } = req.query;

      // Construir filtros WHERE
      const whereClause = {};

      if (fecha_desde || fecha_hasta) {
        whereClause.f_pedido = {};
        if (fecha_desde) whereClause.f_pedido[Op.gte] = new Date(fecha_desde);
        if (fecha_hasta) whereClause.f_pedido[Op.lte] = new Date(fecha_hasta);
      }

      if (id_usuario_filtro) {
        whereClause.id_usuario = id_usuario_filtro;
      }

      const offset = (parseInt(pagina) - 1) * parseInt(limite);

      const { count, rows: pedidos } = await Pedido.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: PedidoProducto,
            as: "pedido_productos",
          },
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id_usuario", "nombre", "email"],
          },
        ],
        order: [["f_pedido", orden.toUpperCase()]],
        limit: parseInt(limite),
        offset: offset,
      });

      res.json({
        success: true,
        data: {
          pedidos,
          pagination: {
            total: count,
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(count / parseInt(limite)),
          },
        },
      });
    } catch (error) {
      console.error("Error obteniendo todos los pedidos:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  /**
   * Verificar stock para productos del carrito
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async verificarStock(req, res) {
    try {
      const { productos } = req.body;

      if (!Array.isArray(productos) || productos.length === 0) {
        return res
          .status(400)
          .json(Respuesta.error(null, "Productos no válidos"));
      }

      const resultados = [];

      for (const {
        id_producto,
        tipo_producto,
        cantidad_solicitada,
      } of productos) {
        let producto = null;
        let stockDisponible = 0;

        if (tipo_producto === "componente") {
          producto = await Componentes.findByPk(id_producto);
          if (producto) {
            stockDisponible = producto.cantidad;
          }
        } else if (tipo_producto === "mueble") {
          producto = await Mueble.findByPk(id_producto);
          if (producto) {
            // Para muebles, verificar stock de componentes
            const validacionStock = await this.validarStockMueble(
              id_producto,
              cantidad_solicitada
            );

            if (validacionStock.valido) {
              stockDisponible = cantidad_solicitada; // Si tiene stock, asumimos que puede producir la cantidad solicitada
            } else {
              resultados.push({
                id_producto,
                tipo_producto,
                nombre: producto.nombre,
                encontrado: true,
                stock_suficiente: false,
                error: validacionStock.error,
              });
              continue;
            }
          }
        }

        if (!producto) {
          resultados.push({
            id_producto,
            tipo_producto,
            encontrado: false,
            error: `${tipo_producto} no encontrado`,
          });
          continue;
        }

        const stockSuficiente = stockDisponible >= cantidad_solicitada;

        resultados.push({
          id_producto,
          tipo_producto,
          nombre: producto.nombre,
          stock_disponible: stockDisponible,
          cantidad_solicitada,
          stock_suficiente: stockSuficiente,
          diferencia: stockSuficiente
            ? 0
            : cantidad_solicitada - stockDisponible,
        });
      }

      const todoDisponible = resultados.every(
        (r) => r.stock_suficiente !== false
      );

      res.json({
        success: true,
        data: {
          disponible: todoDisponible,
          productos: resultados,
        },
      });
    } catch (error) {
      console.error("Error verificando stock:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  /**
   * Eliminar un pedido (cancelar)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async deletePedido(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id_pedido } = req.params;

      const pedido = await Pedido.findByPk(id_pedido, {
        include: [
          {
            model: PedidoProducto,
            as: "pedido_productos",
          },
        ],
      });

      if (!pedido) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Pedido no encontrado"));
      }

      // Restaurar stock de componentes
      for (const producto of pedido.productos) {
        if (producto.tipo_producto === "componente") {
          await Componentes.increment(
            "cantidad",
            {
              by: producto.cantidad,
              where: { id_componente: producto.id_producto },
            },
            { transaction }
          );
        } else if (producto.tipo_producto === "mueble") {
          // Restaurar stock de los componentes del mueble
          await this.restaurarStockComponentesMueble(
            producto.id_producto,
            producto.cantidad,
            transaction
          );
        }
      }

      // Eliminar productos del pedido
      await PedidoProducto.destroy({
        where: { id_pedido },
        transaction,
      });

      // Eliminar el pedido
      await pedido.destroy({ transaction });

      await transaction.commit();

      res.json(Respuesta.exito(null, "Pedido eliminado exitosamente"));
    } catch (error) {
      await transaction.rollback();
      console.error("Error eliminando pedido:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }
}

module.exports = PedidoController;
