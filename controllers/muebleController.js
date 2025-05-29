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

const Mueble = models.mueble;
const MuebleComponentes = models.mueble_componentes;
const Componentes = models.componentes;
const Empresa = models.empresa;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configurar almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio si no existe
    const uploadDir = "./uploads/muebles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "mueble-" + uniqueSuffix + ext);
  },
});

// Filtro para asegurar que solo se suban imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de multer
    return res
      .status(400)
      .json(Respuesta.error(null, `Error al subir la imagen: ${err.message}`));
  } else if (err) {
    // Otro tipo de error
    return res.status(400).json(Respuesta.error(null, err.message));
  }
  next();
};

class MuebleController {
  // Handles retrieval of all types
  async getAllMueble(req, res) {
    try {
      const data = await Mueble.findAll({
        include: [
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa"],
          },
        ],
      });
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
        include: [
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa"],
          },
        ],
      });

      if (muebles.length === 0) {
        return res.status(404).json({
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
        include: [
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa"],
          },
        ],
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
      const data = await Mueble.findByPk(id_mueble, {
        include: [
          {
            model: Componentes,
            as: "id_componente_componentes",
            through: { attributes: ["cantidad"] }, // Traer la cantidad de la tabla intermedia
          },
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa", "id_empresa"],
          },
        ],
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
    const t = await sequelize.transaction();

    try {
      let {
        nombre,
        precio_base,
        fecha_entrega,
        requiere_montar,
        id_empresa,
        descripcion,
        componentes,
      } = req.body;

      console.log("Datos recibidos:", req.body);

      if (typeof componentes === "string") {
        componentes = JSON.parse(componentes);
      }

      if (
        !nombre ||
        !precio_base ||
        !fecha_entrega ||
        requiere_montar === undefined ||
        !id_empresa ||
        !descripcion
      ) {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              "Faltan campos requeridos: nombre, precio_base, fecha_entrega, requiere_montar, descripcion y id_empresa son obligatorios"
            )
          );
      }

      const empresaExiste = await Empresa.findByPk(id_empresa);
      if (!empresaExiste) {
        return res
          .status(400)
          .json(
            Respuesta.error(null, `La empresa con ID ${id_empresa} no existe`)
          );
      }

      const muebleData = {
        nombre,
        precio_base,
        fecha_entrega,
        requiere_montar: requiere_montar === "true" || requiere_montar === true,
        id_empresa,
        imagen: null,
        descripcion,
      };

      if (req.file) {
        muebleData.imagen = `/uploads/muebles/${req.file.filename}`;
      }

      const muebleNuevo = await Mueble.create(muebleData, { transaction: t });

      // Recorrer los componentes si hay y añadirlos al pedido
      if (componentes && componentes.length > 0) {
        for (let componente of componentes) {
          const componenteExiste = await Componentes.findByPk(
            componente.id_componente
          );
          if (!componenteExiste) {
            await t.rollback();
            return res
              .status(400)
              .json(
                Respuesta.error(
                  null,
                  `El componente con ID ${componente.id_componente} no existe`
                )
              );
          }

          await MuebleComponentes.create(
            {
              id_mueble: muebleNuevo.id_mueble,
              id_componente: componente.id_componente,
              cantidad: componente.cantidad,
            },
            { transaction: t }
          );
        }
      }

      // Commit the transaction
      await t.commit();

      const muebleCompleto = await Mueble.findByPk(muebleNuevo.id_mueble, {
        include: [
          {
            model: Componentes,
            as: "id_componente_componentes",
            through: { attributes: ["cantidad"] },
          },
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa"],
          },
        ],
      });

      // Añadir la URL completa de la imagen
      if (muebleCompleto.imagen) {
        // Usar la URL base de tu API
        muebleCompleto.dataValues.imagen_url = `${
          process.env.API_URL || "http://localhost:3000"
        }${muebleCompleto.imagen}`;
      }

      res
        .status(201)
        .json(Respuesta.exito(muebleCompleto, "Mueble creado correctamente"));
    } catch (error) {
      await t.rollback();

      // Manejar el error de nombre único
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              `Ya existe un mueble con el nombre "${nombre}"`
            )
          );
      }

      console.error("Error al crear el mueble:", error);
      res.status(500).json(Respuesta.error(null, "Error al crear el mueble"));
    }
  }

  async updateMueble(req, res) {
    let t;

    try {
      let componentes = req.body.componentes;
      if (componentes && typeof componentes === "string") {
        try {
          componentes = JSON.parse(componentes);
        } catch (error) {
          return res
            .status(400)
            .json(Respuesta.error(null, "Error al parsear los componentes"));
        }
      }

      const {
        nombre,
        precio_base,
        fecha_entrega,
        requiere_montar,
        id_empresa,
        descripcion,
      } = req.body;
      const id_mueble = req.params.id_mueble;

      let rutaImagen;

      if (req.file) {
        rutaImagen = `/uploads/muebles/${req.file.filename}`;
      } else if (req.body.imagen_null === "true") {
        rutaImagen = null;
      } else {
        rutaImagen = undefined;
      }

      t = await sequelize.transaction();

      // Buscar el mueble a actualizar
      const muebleExistente = await Mueble.findByPk(id_mueble);
      if (!muebleExistente) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Mueble no encontrado"));
      }

      // Verificar que la empresa existe si se proporciona un id_empresa
      if (id_empresa) {
        const empresaExiste = await Empresa.findByPk(id_empresa);
        if (!empresaExiste) {
          return res
            .status(400)
            .json(
              Respuesta.error(null, `La empresa con ID ${id_empresa} no existe`)
            );
        }
      }

      const updateData = {
        nombre: nombre || muebleExistente.nombre,
        precio_base: precio_base || muebleExistente.precio_base,
        fecha_entrega: fecha_entrega || muebleExistente.fecha_entrega,
        requiere_montar:
          requiere_montar !== undefined
            ? requiere_montar === "true" || requiere_montar === true
            : muebleExistente.requiere_montar,
        id_empresa: id_empresa || muebleExistente.id_empresa,
        descripcion: descripcion || muebleExistente.descripcion,
      };

      // Solo incluir imagen en la actualización si hay cambios
      if (rutaImagen !== undefined) {
        updateData.imagen = rutaImagen;
      }

      await muebleExistente.update(updateData, { transaction: t });

      // Procesar los componentes si hay
      if (componentes && componentes.length > 0) {
        for (let componente of componentes) {
          const { id_componente, cantidad } = componente;

          // Verificar que el componente existe
          const componenteExiste = await Componentes.findByPk(id_componente);
          if (!componenteExiste) {
            await t.rollback();
            return res
              .status(400)
              .json(
                Respuesta.error(
                  null,
                  `El componente con ID ${id_componente} no existe`
                )
              );
          }

          // Buscar si el componente ya existe en la relación
          const muebleComponente = await MuebleComponentes.findOne({
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
            await MuebleComponentes.create(
              {
                id_mueble,
                id_componente,
                cantidad,
              },
              { transaction: t }
            );
          }
        }
      }

      // Confirmar la transacción
      await t.commit();

      const muebleActualizado = await Mueble.findByPk(id_mueble, {
        include: [
          {
            model: Componentes,
            as: "id_componente_componentes",
            through: { attributes: ["cantidad"] },
          },
          {
            model: Empresa,
            as: "id_empresa_empresa",
            attributes: ["nombre_empresa"],
          },
        ],
      });

      res
        .status(200)
        .json(
          Respuesta.exito(muebleActualizado, "Mueble actualizado correctamente")
        );
    } catch (error) {
      if (t) await t.rollback();

      // Manejar el error de nombre único
      if (error.name === "SequelizeUniqueConstraintError") {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              `Ya existe un mueble con el nombre "${nombre}"`
            )
          );
      }

      console.error("Error al actualizar el mueble:", error);
      res
        .status(500)
        .json(Respuesta.error(null, "Error al actualizar el mueble"));
    }
  }

  // Handles deletion of a type by its ID (implementation pending)
  async deleteMueble(req, res) {
    const id = req.params.id_mueble;

    try {
      // Verificar que el mueble existe
      const mueble = await Mueble.findByPk(id);
      if (!mueble) {
        return res
          .status(404)
          .json(Respuesta.error(null, `Mueble con ID ${id} no encontrado`));
      }

      const numFilas = await Mueble.destroy({
        where: {
          id_mueble: id,
        },
      });

      res
        .status(200)
        .json(
          Respuesta.exito(null, `Mueble con ID ${id} eliminado correctamente`)
        );
    } catch (err) {
      // Handle errors during the service call
      console.error("Error al eliminar el mueble:", err);
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

  async getMuebleComponentes(req, res) {
    try {
      const { id_mueble } = req.params;

      // Validar que el ID sea un número válido
      if (!id_mueble || isNaN(parseInt(id_mueble))) {
        return res
          .status(400)
          .json(Respuesta.error(null, "ID de mueble no válido"));
      }

      const idMueble = parseInt(id_mueble);

      // Verificar que el mueble existe
      const muebleExiste = await Mueble.findByPk(idMueble);
      if (!muebleExiste) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Mueble no encontrado"));
      }

      // Obtener los componentes del mueble con sus cantidades
      const componentesMueble = await MuebleComponentes.findAll({
        where: { id_mueble: idMueble },
        include: [
          {
            model: Componentes,
            as: "id_componente_componentes", // Usa el mismo alias que tienes en tus otras consultas
            attributes: [
              "id_componente",
              "nombre",
              "precio",
              "material",
              "cantidad", // Esta es la cantidad en stock
              "descripcion",
            ],
          },
        ],
        attributes: ["cantidad"], // Esta es la cantidad necesaria para el mueble
      });

      // Formatear la respuesta para el frontend
      const componentesFormateados = componentesMueble.map((item) => ({
        id_componente: item.id_componente_componentes.id_componente,
        nombre: item.id_componente_componentes.nombre,
        precio: item.id_componente_componentes.precio,
        material: item.id_componente_componentes.material,
        descripcion: item.id_componente_componentes.descripcion,
        cantidad: item.cantidad, // Cantidad necesaria para el mueble
        stock_disponible: item.id_componente_componentes.cantidad, // Stock actual del componente
      }));

      res.json(
        Respuesta.exito(
          {
            componentes: componentesFormateados,
            mueble: {
              id_mueble: muebleExiste.id_mueble,
              nombre: muebleExiste.nombre,
              precio_base: muebleExiste.precio_base,
            },
          },
          "Componentes del mueble recuperados correctamente"
        )
      );
    } catch (error) {
      logMensaje("Error obteniendo componentes del mueble: " + error);
      console.error("Error obteniendo componentes del mueble:", error);
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            "Error interno del servidor al obtener componentes del mueble"
          )
        );
    }
  }
}

module.exports = new MuebleController();
