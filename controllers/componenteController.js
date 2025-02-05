// Import the service layer for handling type-related operations
const Respuesta = require("../utils/respuesta");

// Recuperar función de inicialización de modelos
const initModels = require("../models/init-models").initModels;

// Crear la instancia de sequelize con la conexión a la base de datos
const sequelize = require("../config/sequelize");
const { Op } = require("sequelize");

// Cargar las definiciones del modelo en sequelize
const models = initModels(sequelize);

// Recuperar el modelo plato
const Componente = models.componentes;

class ComponenteController {
  //   Handles retrieval of all types
  async getAllComponentes(req, res) {
    try {
      const data = await Componente.findAll(); // Fetch all types from the service
      res.json(Respuesta.exito(data, "Datos de componentes recuperados"));
    } catch (err) {
      // Handle errors during the service call
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al recuperar los datos de los componentes: ${req.originalUrl}`
          )
        );
    }
  }

  // Función para obtener los materiales únicos
  async getMateriales(req, res) {
    try {
      const materiales = await Componente.findAll({
        attributes: ["material"], // Solo obtener el campo 'material'
        group: ["material"], // Agrupar por 'material' para obtener valores únicos
      });

      const materialesArray = materiales.map(
        (componente) => componente.material
      );

      res.json(materialesArray);
    } catch (error) {
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al recuperar los datos de los componentes: ${req.originalUrl}`
          )
        );
    }
  }

  // Función para obtener todos los componentes por material
async getComponentesByMaterial(req, res) {
  const { material } = req.params; // Extraer el parámetro 'material' de la URL

  try {
    // Buscar los componentes cuyo material coincida
    const componentes = await Componente.findAll({
      where: { material }, // Filtrar los componentes por material
    });

    if (componentes.length === 0) {
      return res.status(404).json({ message: `No se encontraron componentes para el material: ${material}` });
    }

    // Devolver la lista de componentes encontrados
    res.json(componentes);
  } catch (error) {
    console.error('Error al obtener los componentes por material:', error);
    res.status(500).json({ error: 'Error al obtener los componentes' });
  }
}

async getComponentesByNombre (req, res) {
  const { nombre } = req.query; // Obtenemos el nombre de la consulta

  try {
    // Buscar los componentes que contengan el nombre dado (usando LIKE)
    const componentes = await Componente.findAll({
      where: {
        nombre: {
          [Op.like]: `%${nombre}%`, // Realiza una búsqueda parcial
        },
      },
    });

    if (componentes.length === 0) {
      return res.status(404).json({ message: `No se encontraron componentes con el nombre: ${nombre}` });
    }

    // Devolver los componentes encontrados
    res.json(componentes);
  } catch (error) {
    console.error('Error al buscar componentes:', error);
    res.status(500).json({ error: 'Error al buscar los componentes' });
  }
}

  // Handles retrieval of a single type by its ID (implementation pending)
  async getComponenteById(req, res) {
    const id_componente = req.params.id_componente;
    try {
      console.log("Buscando ID:", id_componente);
      const data = await Componente.findByPk(id_componente);
      if (data) {
        res.json(Respuesta.exito(data, "Componente recuperado"));
      } else {
        res.status(404).json(Respuesta.error(null, "Componente no encontrado"));
      }
    } catch (err) {
      logMensaje = "Error: " + err;
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

  async createComponente(req, res) {
    // Implementa la lógica para crear un nuevo dato
    const componente = req.body;
    try {
      const componenteNuevo = await Componente.create(componente);
      res
        .status(201)
        .json(Respuesta.exito(componenteNuevo, "Componente insertado"));
    } catch (err) {
      res
        .status(500)
        .json(
          Respuesta.error(null, `Error al crear el componente: ${componente}`)
        );
    }
  }

  // Handles updating of a type by its ID (implementation pending)
  async updateComponente(req, res) {
    const componente = req.body; // Recuperamos datos para actualizar
    console.log(componente);
    const id_componente = req.params.id_componente; // dato de la ruta

    console.log(id_componente);
    console.log(componente.id_componente);

    if (id_componente != componente.id_componente) {
      return res
        .status(400)
        .json(
          Respuesta.error(
            null,
            "El id del componente no coincide con el objeto enviado"
          )
        );
    }

    try {
      const numFilas = await Componente.update(
        { ...componente },
        { where: { id_componente } }
      );

      if (numFilas == 0) {
        // No se ha encontrado lo que se quería actualizar o no hay nada que cambiar
        res
          .status(404)
          .json(
            Respuesta.error(
              null,
              "Componente no encontrado o no modificado: " + id_componente
            )
          );
      } else {
        // Al dar status 204 no se devuelva nada
        res.status(204).send();
      }
    } catch (err) {
      // Handle errors during the service call
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            `Error al actualizar los datos: ${req.originalUrl}`
          )
        );
    }
  }

  // Handles deletion of a type by its ID (implementation pending)
  async deleteComponente(req, res) {
    const id = req.params.id_componente;

    try {
      const numFilas = await Componente.destroy({
        where: {
          id_componente: id,
        },
      });
      if (numFilas === 0) {
        // No se ha encontrado lo que se quería borrar
        res.status(404).json(Respuesta.error(null, "No encontrado: " + id));
      } else {
        res.status(200).json(Respuesta.exito(null, "Componente eliminado"));
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

module.exports = new ComponenteController();
