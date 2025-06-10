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
const Mueble = models.mueble;
const MuebleComponentes = models.mueble_componentes;

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
            as: "id_componente_componente",
            attributes: ["id_componente", "nombre", "precio", "cantidad"],
          },
        ],
        attributes: ["cantidad"],
      });

      return componentesMueble.map((item) => ({
        id_componente: item.id_componente_componente.id_componente,
        nombre: item.id_componente_componente.nombre,
        precio: item.id_componente_componente.precio,
        cantidad_necesaria: item.cantidad,
        stock_disponible: item.id_componente_componente.cantidad,
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
      const componentes = await PedidoController.obtenerComponentesMueble(
        id_mueble
      );

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
    const componentes = await PedidoController.obtenerComponentesMueble(
      id_mueble
    );

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
    const componentes = await PedidoController.obtenerComponentesMueble(
      id_mueble
    );

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
      const {
        productos,
        precio_total: precioTotalFrontend,
        datos_envio,
        metodo_pago,
        datos_pago,
      } = req.body;

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
      console.log("Precio total del frontend:", precioTotalFrontend);

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

      let precioTotalCalculado = 0;
      const productosValidados = [];

      // Validar productos y calcular precio total base (para verificación)
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
          const validacionStock = await PedidoController.validarStockMueble(
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

        precioTotalCalculado += precioUnitario * producto.cantidad;

        productosValidados.push({
          ...producto,
          precio_unitario: precioUnitario,
          productoData,
        });
      }

      // Usar el precio total del frontend si se proporciona, sino usar el calculado
      const precioTotalFinal =
        precioTotalFrontend && precioTotalFrontend > 0
          ? precioTotalFrontend
          : precioTotalCalculado;

      console.log("Precio calculado (solo productos):", precioTotalCalculado);
      console.log("Precio final a guardar:", precioTotalFinal);

      // Crear el pedido principal con datos adicionales
      const nuevoPedido = await Pedido.create(
        {
          id_usuario,
          f_pedido: new Date(),
          precio_total: precioTotalFinal,
          estado: "pendiente",
        },
        { transaction }
      );

      // Verificar si PedidoProducto existe
      let PedidoProductoModel = models.pedido_producto;

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
          await PedidoController.reducirStockComponentesMueble(
            producto.id_producto,
            producto.cantidad,
            transaction
          );
        }
      }

      // Confirmar transacción
      await transaction.commit();

      // Cargar el pedido completo FUERA de la transacción
      const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id_pedido, {
        include: [
          {
            model: PedidoProductoModel,
            as: "pedido_productos",
          },
        ],
      });

      console.log("Pedido creado exitosamente:", {
        id: nuevoPedido.id_pedido,
        precio_total: precioTotalFinal,
        productos: productosValidados.length,
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

      // Enriquecer los pedidos con información de productos
      const pedidosEnriquecidos = await Promise.all(
        pedidos.map(async (pedido) => {
          const pedidoJson = pedido.toJSON();

          if (
            pedidoJson.pedido_productos &&
            pedidoJson.pedido_productos.length > 0
          ) {
            const productosConNombres = await Promise.all(
              pedidoJson.pedido_productos.map(async (producto) => {
                let nombreProducto = `Producto #${producto.id_producto}`;
                let precioProducto = 0;

                try {
                  if (producto.tipo_producto === "mueble") {
                    const mueble = await Mueble.findByPk(producto.id_producto, {
                      attributes: ["id_mueble", "nombre", "precio_base"],
                    });
                    if (mueble) {
                      nombreProducto = mueble.nombre;
                      precioProducto = parseFloat(mueble.precio_base) || 0;
                    }
                  } else if (producto.tipo_producto === "componente") {
                    const componente = await Componentes.findByPk(
                      producto.id_producto,
                      {
                        attributes: ["id_componente", "nombre", "precio"],
                      }
                    );
                    if (componente) {
                      nombreProducto = componente.nombre;
                      precioProducto = parseFloat(componente.precio) || 0;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error obteniendo datos del ${producto.tipo_producto} ${producto.id_producto}:`,
                    error
                  );
                }

                return {
                  ...producto,
                  nombre_producto: nombreProducto,
                  precio_unitario: precioProducto,
                  subtotal: precioProducto * (producto.cantidad || 1),
                };
              })
            );

            pedidoJson.pedido_productos = productosConNombres;
          }

          return pedidoJson;
        })
      );

      console.log(
        `Devolviendo ${pedidosEnriquecidos.length} pedidos para usuario ${id_usuario}`
      );

      res.json({
        success: true,
        data: {
          pedidos: pedidosEnriquecidos,
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
      // Verificar si el usuario autenticado es una empresa
      const userRole = req.usuarioLogueado?.role;

      if (userRole === "empresa") {
        // Si es una empresa, usar el método específico para empresas
        return PedidoController.getPedidosByEmpresa(req, res);
      }

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
            const validacionStock = await PedidoController.validarStockMueble(
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
      for (const producto of pedido.pedido_productos) {
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
          await PedidoController.restaurarStockComponentesMueble(
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

  /**
   * Obtener pedidos que contienen muebles de una empresa específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async getPedidosByEmpresa(req, res) {
    try {
      console.log("=== DEBUG getPedidosByEmpresa ===");
      console.log("Usuario autenticado:", req.usuarioLogueado);

      const {
        limite = 20,
        pagina = 1,
        orden = "DESC",
        fecha_desde,
        fecha_hasta,
      } = req.query;

      // Obtener ID de la empresa autenticada
      const id_empresa =
        req.usuarioLogueado.sub || req.usuarioLogueado.id_empresa;

      console.log("ID empresa extraído:", id_empresa);

      if (!id_empresa) {
        console.log("Error: No se pudo identificar la empresa");
        return res
          .status(400)
          .json(Respuesta.error(null, "No se pudo identificar la empresa"));
      }

      const offset = (parseInt(pagina) - 1) * parseInt(limite);

      // ✅ Usar SQL directo ya que las asociaciones de Sequelize son complejas aquí
      console.log("Ejecutando consulta SQL...");

      let queryParams = [id_empresa];
      let dateFilter = "";

      if (fecha_desde) {
        dateFilter += " AND p.f_pedido >= ?";
        queryParams.push(fecha_desde);
      }
      if (fecha_hasta) {
        dateFilter += " AND p.f_pedido <= ?";
        queryParams.push(fecha_hasta);
      }

      // Agregar parámetros de paginación
      queryParams.push(parseInt(limite), offset);

      // Obtener pedidos que contienen muebles de la empresa
      const pedidosResult = await sequelize.query(
        `
        SELECT DISTINCT 
          p.id_pedido,
          p.id_usuario,
          p.f_pedido,
          p.precio_total,
          p.estado,
          u.nombre as usuario_nombre,
          u.email as usuario_email
        FROM pedido p
        INNER JOIN pedido_producto pp ON p.id_pedido = pp.id_pedido
        INNER JOIN mueble m ON pp.id_producto = m.id_mueble 
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        WHERE pp.tipo_producto = 'mueble' 
        AND m.id_empresa = ?
        ${dateFilter}
        ORDER BY p.f_pedido ${orden.toUpperCase()}
        LIMIT ? OFFSET ?
      `,
        {
          replacements: queryParams,
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(
        `Encontrados ${pedidosResult.length} pedidos con muebles de la empresa`
      );

      if (pedidosResult.length === 0) {
        console.log("No se encontraron pedidos");
        return res.json({
          ok: true,
          datos: {
            pedidos: [],
            pagination: {
              total: 0,
              pagina: parseInt(pagina),
              limite: parseInt(limite),
              totalPaginas: 0,
            },
          },
          mensaje: "No se encontraron pedidos con muebles de esta empresa",
        });
      }

      // Obtener el conteo total para la paginación
      let countQueryParams = [id_empresa];
      if (fecha_desde) {
        countQueryParams.push(fecha_desde);
      }
      if (fecha_hasta) {
        countQueryParams.push(fecha_hasta);
      }

      const totalResult = await sequelize.query(
        `
        SELECT COUNT(DISTINCT p.id_pedido) as total
        FROM pedido p
        INNER JOIN pedido_producto pp ON p.id_pedido = pp.id_pedido
        INNER JOIN mueble m ON pp.id_producto = m.id_mueble 
        WHERE pp.tipo_producto = 'mueble' 
        AND m.id_empresa = ?
        ${dateFilter}
      `,
        {
          replacements: countQueryParams,
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const totalCount = totalResult[0]?.total || 0;
      console.log("Total count:", totalCount);

      // Obtener los IDs de los pedidos para buscar los productos
      const pedidoIds = pedidosResult.map((p) => p.id_pedido);

      // Obtener todos los productos de estos pedidos
      const productosResult = await sequelize.query(
        `
        SELECT 
          pp.id_pedido,
          pp.id_producto,
          pp.tipo_producto,
          pp.cantidad,
          CASE 
            WHEN pp.tipo_producto = 'mueble' THEN m.nombre
            WHEN pp.tipo_producto = 'componente' THEN c.nombre
            ELSE 'Producto desconocido'
          END as nombre_producto,
          CASE 
            WHEN pp.tipo_producto = 'mueble' THEN m.precio_base
            WHEN pp.tipo_producto = 'componente' THEN c.precio
            ELSE 0
          END as precio_unitario,
          CASE 
            WHEN pp.tipo_producto = 'mueble' THEN m.id_empresa
            ELSE NULL
          END as id_empresa_producto
        FROM pedido_producto pp
        LEFT JOIN mueble m ON pp.id_producto = m.id_mueble AND pp.tipo_producto = 'mueble'
        LEFT JOIN componentes c ON pp.id_producto = c.id_componente AND pp.tipo_producto = 'componente'
        WHERE pp.id_pedido IN (${pedidoIds.map(() => "?").join(",")})
        ORDER BY pp.id_pedido, pp.tipo_producto
      `,
        {
          replacements: pedidoIds,
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(`Encontrados ${productosResult.length} productos en total`);

      // Agrupar productos por pedido
      const productosPorPedido = {};
      productosResult.forEach((producto) => {
        if (!productosPorPedido[producto.id_pedido]) {
          productosPorPedido[producto.id_pedido] = [];
        }

        // Calcular subtotal
        const subtotal =
          (parseFloat(producto.precio_unitario) || 0) *
          (producto.cantidad || 1);

        // Determinar si es de la empresa
        const esDeEmpresa =
          producto.tipo_producto === "mueble" &&
          producto.id_empresa_producto == id_empresa;

        productosPorPedido[producto.id_pedido].push({
          id_producto_pedido: `${producto.id_pedido}_${producto.id_producto}_${producto.tipo_producto}`,
          id_pedido: producto.id_pedido,
          id_producto: producto.id_producto,
          tipo_producto: producto.tipo_producto,
          cantidad: producto.cantidad,
          nombre_producto: producto.nombre_producto,
          precio_unitario: parseFloat(producto.precio_unitario) || 0,
          subtotal: subtotal,
          es_de_empresa: esDeEmpresa,
        });
      });

      // Construir respuesta final
      const pedidosEnriquecidos = pedidosResult.map((pedido) => {
        const productos = productosPorPedido[pedido.id_pedido] || [];
        const mueblesEmpresa = productos.filter((p) => p.es_de_empresa);
        const totalMueblesEmpresa = mueblesEmpresa.reduce(
          (total, mueble) => total + mueble.subtotal,
          0
        );

        return {
          id_pedido: pedido.id_pedido,
          id_usuario: pedido.id_usuario,
          f_pedido: pedido.f_pedido,
          precio_total: parseFloat(pedido.precio_total) || 0,
          estado: pedido.estado,
          usuario: pedido.usuario_nombre
            ? {
                id_usuario: pedido.id_usuario,
                nombre: pedido.usuario_nombre,
                email: pedido.usuario_email,
              }
            : null,
          pedido_productos: productos,
          muebles_empresa: mueblesEmpresa,
          total_muebles_empresa: totalMueblesEmpresa,
        };
      });

      console.log(
        `Devolviendo ${pedidosEnriquecidos.length} pedidos enriquecidos para empresa ${id_empresa}`
      );

      res.json({
        ok: true,
        datos: {
          pedidos: pedidosEnriquecidos,
          pagination: {
            total: parseInt(totalCount),
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            totalPaginas: Math.ceil(totalCount / parseInt(limite)),
          },
        },
        mensaje: `Se encontraron ${totalCount} pedidos con muebles de su empresa`,
      });
    } catch (error) {
      console.error("Error completo en getPedidosByEmpresa:", error);
      console.error("Stack trace:", error.stack);
      res
        .status(500)
        .json(
          Respuesta.error(null, `Error interno del servidor: ${error.message}`)
        );
    }
  }

  static async getPedidosPorFecha(req, res) {
    try {
      console.log("Query params:", req.query);
      console.log("Usuario autenticado:", req.usuarioLogueado);

      const { fecha_inicio, fecha_fin } = req.query;

      // Validar que se proporcionen las fechas
      if (!fecha_inicio || !fecha_fin) {
        return res
          .status(400)
          .json(Respuesta.error(null, "Se requieren fecha_inicio y fecha_fin"));
      }

      // Obtener ID de la empresa autenticada
      const id_empresa =
        req.usuarioLogueado.sub || req.usuarioLogueado.id_empresa;

      if (!id_empresa) {
        return res
          .status(400)
          .json(Respuesta.error(null, "No se pudo identificar la empresa"));
      }

      console.log(
        `Buscando pedidos entre ${fecha_inicio} y ${fecha_fin} para empresa ${id_empresa}`
      );

      // Consulta SQL para obtener pedidos agrupados por fecha
      const pedidosResult = await sequelize.query(
        `
        SELECT 
          p.f_pedido as fecha,
          COUNT(DISTINCT p.id_pedido) as cantidad_pedidos,
          COUNT(pp.id_producto) as total_productos,
          SUM(CASE WHEN pp.tipo_producto = 'mueble' THEN pp.cantidad ELSE 0 END) as muebles_vendidos,
          SUM(CASE WHEN pp.tipo_producto = 'componente' THEN pp.cantidad ELSE 0 END) as componentes_vendidos
        FROM pedido p
        INNER JOIN pedido_producto pp ON p.id_pedido = pp.id_pedido
        INNER JOIN mueble m ON pp.id_producto = m.id_mueble AND pp.tipo_producto = 'mueble'
        WHERE p.f_pedido >= ? 
          AND p.f_pedido <= ?
          AND m.id_empresa = ?
        GROUP BY p.f_pedido
        ORDER BY p.f_pedido ASC
        `,
        {
          replacements: [fecha_inicio, fecha_fin, id_empresa],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      console.log(
        `Encontrados datos para ${pedidosResult.length} días con pedidos`
      );

      // Formatear los resultados
      const datos = pedidosResult.map((row) => ({
        fecha: row.fecha,
        cantidad_pedidos: parseInt(row.cantidad_pedidos) || 0,
        total_productos: parseInt(row.total_productos) || 0,
        muebles_vendidos: parseInt(row.muebles_vendidos) || 0,
        componentes_vendidos: parseInt(row.componentes_vendidos) || 0,
      }));

      // Calcular totales del período
      const totales = {
        total_pedidos: datos.reduce(
          (sum, item) => sum + item.cantidad_pedidos,
          0
        ),
        total_productos: datos.reduce(
          (sum, item) => sum + item.total_productos,
          0
        ),
        total_muebles: datos.reduce(
          (sum, item) => sum + item.muebles_vendidos,
          0
        ),
        total_componentes: datos.reduce(
          (sum, item) => sum + item.componentes_vendidos,
          0
        ),
      };

      console.log("Totales del período:", totales);

      res.json({
        ok: true,
        datos: datos,
        resumen: {
          fecha_inicio,
          fecha_fin,
          dias_con_pedidos: datos.length,
          ...totales,
        },
        mensaje: `Estadísticas de pedidos del ${fecha_inicio} al ${fecha_fin}`,
      });
    } catch (error) {
      console.error("Error en getPedidosPorFecha:", error);
      console.error("Stack trace:", error.stack);
      res
        .status(500)
        .json(
          Respuesta.error(null, `Error interno del servidor: ${error.message}`)
        );
    }
  }

  /**
   * Actualizar el estado de un pedido
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  static async updateEstadoPedido(req, res) {
    try {
      const { id_pedido } = req.params;
      const { estado } = req.body;

      // Validar que el estado sea válido
      const estadosValidos = ["pendiente", "procesando", "finalizado"];
      if (!estadosValidos.includes(estado)) {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              "Estado no válido. Debe ser: pendiente, procesando o finalizado"
            )
          );
      }

      // Buscar el pedido
      const pedido = await Pedido.findByPk(id_pedido);
      if (!pedido) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Pedido no encontrado"));
      }

      // Verificar permisos si es necesario
      const userRole = req.usuarioLogueado?.role;
      const id_usuario_logueado =
        req.usuarioLogueado?.sub ||
        req.usuarioLogueado?.id_usuario ||
        req.usuarioLogueado?.id_empresa;

      // Si es un usuario normal, solo puede ver sus propios pedidos
      if (userRole !== "empresa" && pedido.id_usuario !== id_usuario_logueado) {
        return res
          .status(403)
          .json(
            Respuesta.error(
              null,
              "No tienes permisos para modificar este pedido"
            )
          );
      }

      // Actualizar el estado
      await pedido.update({ estado });

      console.log(`Estado del pedido ${id_pedido} actualizado a: ${estado}`);

      res.json(
        Respuesta.exito(
          { id_pedido, estado },
          `Estado actualizado a ${estado} exitosamente`
        )
      );
    } catch (error) {
      console.error("Error actualizando estado del pedido:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }
}

module.exports = PedidoController;
