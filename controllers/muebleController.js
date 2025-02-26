// Import the service layer for handling type-related operations
const Respuesta = require("../utils/respuesta");
const { logMensaje } = require("../utils/logger");

// Recuperar función de inicialización de modelos
const initModels = require("../models/init-models").initModels;

// Crear la instancia de sequelize con la conexión a la base de datos
const sequelize = require("../config/sequelize");
const { Op } = require("sequelize");

// Cargar las definiciones del modelo en sequelize
const models = initModels(sequelize);

// Recuperar el modelo plato
const Mueble = models.mueble;
const MuebleComponente = models.muebleComponentes;
const Componentes = models.componentes;

class MuebleController {
  // Handles retrieval of all types
  async getAllMueble(req, res) {
    try {
      const data = await Mueble.findAll();
      res.json(Respuesta.exito(data, "Datos de muebles recuperados"));
    } catch (err) {
      // Handle errors during the service call
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al recuperar los datos de los muebles: ${req.originalUrl}`
          )
        );
    }
  }

  async getMueblesByNombre(req, res) {
    const { nombre } = req.query; // Obtenemos el nombre de la consulta

    try {
      // Buscar los componentes que contengan el nombre dado (usando LIKE)
      console.log("Nombre:", nombre);
      const muebles = await Mueble.findAll({
        where: {
          nombre: {
            [Op.like]: `%${nombre}%`, // Realiza una búsqueda parcial
          },
        },
      });

      if (muebles.length === 0) {
        return res
          .status(404)
          .json({
            message: `No se encontraron muebles con el nombre: ${nombre}`,
          });
      }

      // Devolver los componentes encontrados
      res.json(muebles);
    } catch (error) {
      console.error("Error al buscar muebles:", error);
      res.status(500).json({ error: "Error al buscar los muebles" });
    }
  }

  async getMueblesByFecha(req, res) {
    const { fecha } = req.params; // Obtener la fecha desde los parámetros de la URL

    try {
      const muebles = await Mueble.findAll({
        where: {
          fecha_entrega: {
            [Op.lte]: fecha, // Busca muebles cuya fecha_entrega sea menor o igual a la ingresada
          },
        },
      });

      if (muebles.length === 0) {
        return res
          .status(404)
          .json({ message: `No hay muebles con entrega antes de ${fecha}` });
      }

      res.json(muebles);
    } catch (error) {
      console.error("Error al buscar muebles por fecha:", error);
      res.status(500).json({ error: "Error al buscar los muebles" });
    }
  }

  // Handles retrieval of a single type by its ID (implementation pending)
  async getMuebleById(req, res) {
    //console.log("Valor recibido en el backend:", req.params);
    const id_mueble = req.params.id_mueble;
    try {
      // console.log("Buscando ID:", id_mueble);
      // const data = await Mueble.findAll({
      //   where: { id_mueble },
      //   include: {
      //     model: MuebleComponente,
      //     as: "mueble_componentes",
      //     include: { model: Componentes, as: "id_componente_componente" },
      //   },
      // });

      const data = await Mueble.findByPk(id_mueble, {
        include: {
          model: Componentes,
          as: "id_componente_componentes",
          through: { attributes: ["cantidad"] }, // Traer la cantidad de la tabla intermedia
        },
      });

      if (data) {
        res.json(Respuesta.exito(data, "Mueble recuperado"));
      } else {
        res.status(404).json(Respuesta.error(null, "Mueble no encontrado"));
      }
    } catch (err) {
      logMensaje("Error: " + err);
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al recuperar los datos: ${req.originalUrl}`
          )
        );
    }
  }

  async createMueble(req, res) {
    const { mueble, componentes } = req.body;

    console.log("Datos recibidos:", req.body);

    const t = await sequelize.transaction();

    try {
      const muebleNuevo = await Mueble.create(mueble, { transaction: t });

      // Recorrer los componentes y añadirlos al pedido
      for (let componente of componentes) {
        await MuebleComponente.create(
          {
            id_mueble: muebleNuevo.id_mueble,
            id_componente: componente.id_componente,
            cantidad: componente.cantidad,
          },
          { transaction: t }
        );
      }

      // Commit the transaction
      await t.commit();

      res
        .status(201)
        .json(Respuesta.exito(muebleNuevo, "Mueble creado correctamente"));
    } catch (error) {
      await t.rollback();
      console.error("Error al crear el mueble:", error); // Detalles del error
      res.status(500).json(Respuesta.error(error, "Error al crear el mueble"));
    }
  }

  async updateMueble(req, res) {
    const { mueble, componentes } = req.body;
    const id_mueble = req.params.id_mueble;

    const t = await sequelize.transaction();

    try {
      // Actualizar el mueble
      const muebleExistente = await Mueble.findByPk(id_mueble);
      if (!muebleExistente) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Mueble no encontrado"));
      }

      await muebleExistente.update(mueble, { transaction: t });

      // Procesar los componentes
      for (let componente of componentes) {
        const { id_componente, cantidad } = componente;

        // Buscar si el componente ya existe en la relación
        const muebleComponente = await MuebleComponente.findOne({
          where: {
            id_mueble,
            id_componente,
          },
          transaction: t,
        });

        if (muebleComponente) {
          if (cantidad === 0) {
            // Si la cantidad es 0, eliminamos el componente
            await muebleComponente.destroy({ transaction: t });
          } else {
            // Si ya existe, actualizamos la cantidad
            await muebleComponente.update({ cantidad }, { transaction: t });
          }
        } else if (cantidad > 0) {
          // Si no existe, insertamos el nuevo componente con la cantidad
          await MuebleComponente.create(
            {
              id_mueble,
              id_componente,
              cantidad,
            },
            { transaction: t }
          );
        }
      }

      // Confirmar la transacción
      await t.commit();
      res
        .status(200)
        .json(
          Respuesta.exito(muebleExistente, "Mueble actualizado correctamente")
        );
    } catch (error) {
      await t.rollback();
      console.error("Error al actualizar el mueble:", error);
      res
        .status(500)
        .json(Respuesta.error(error, "Error al actualizar el mueble"));
    }
  }

  // Handles deletion of a type by its ID (implementation pending)
  async deleteMueble(req, res) {
    const id = req.params.id_mueble;

    try {
      const numFilas = await Mueble.destroy({
        where: {
          id_mueble: id,
        },
      });
      if (numFilas === 0) {
        // No se ha encontrado lo que se quería borrar
        res.status(404).json(Respuesta.error(null, "No encontrado: " + id));
      } else {
        res.status(200).json(Respuesta.exito(null, "Mueble eliminado"));
      }
    } catch (err) {
      // Handle errors during the service call
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al recuperar los datos: ${req.originalUrl}`
          )
        );
    }
  }
}

module.exports = new MuebleController();
