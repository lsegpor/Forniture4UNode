// Importar libreria para respuestas
const Respuesta = require("../utils/respuesta.js");
const { logMensaje } = require("../utils/logger.js");
// Recuperar función de inicialización de modelos
const initModels = require("../models/init-models.js").initModels;
// Crear la instancia de sequelize con la conexión a la base de datos
const sequelize = require("../config/sequelize.js");
// Para comparar contraseñas cifradas
const bcrypt = require("bcrypt");
// Librería de manejo de JWT
const jwt = require("jsonwebtoken");
// Importar fichero de configuración con variables de entorno
const config = require("../config/config.js");

// Cargar las definiciones del modelo en sequelize
const models = initModels(sequelize);
// Recuperar el modelo empresa
const Empresa = models.empresa;

class CompanyController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const empresa = await Empresa.findOne({ where: { email } });
      if (!empresa) {
        return res
          .status(401)
          .json(Respuesta.error(null, "Empresa no encontrada"));
      }

      // Verificar la contraseña
      const validPassword = await bcrypt.compare(password, empresa.password);
      if (!validPassword) {
        return res
          .status(401)
          .json(Respuesta.error(null, "Password incorrecta"));
      }

      // Generar el token JWT
      const token = jwt.sign(
        {
          sub: empresa.id_empresa,
          email: empresa.email,
          nombre_empresa: empresa.nombre_empresa,
          cif_nif_nie: empresa.cif_nif_nie,
          direccion: empresa.direccion,
          nombre_personal: empresa.nombre_personal,
          apellidos: empresa.apellidos,
          ofertas: empresa.ofertas,
          role: "empresa", // Añadimos el rol para diferenciar
        },
        config.secretKey,
        { expiresIn: "1h" }
      );

      // Configurar la cookie con el token
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "Lax",
        maxAge: 3600000,
      });

      //Eliminar la contraseña del objeto de respuesta
      delete empresa.dataValues.password;

      const responseData = {
        ...empresa.dataValues,
        token: token, // ← Agregar token aquí
      };

      res
        .status(200)
        .json(Respuesta.exito(responseData, "Inicio de sesión exitoso"));
    } catch (err) {
      console.error(err);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  async signup(req, res) {
    const {
      nombre_empresa,
      cif_nif_nie,
      direccion,
      nombre_personal,
      apellidos,
      email,
      password,
      ofertas,
    } = req.body;

    try {
      // Validar si todos los campos fueron proporcionados
      if (
        !nombre_empresa ||
        !cif_nif_nie ||
        !direccion ||
        !nombre_personal ||
        !apellidos ||
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json(Respuesta.error(null, "Faltan campos por informar"));
      }

      // Verificar si la empresa ya existe con ese email
      const existingEmpresa = await Empresa.findOne({ where: { email } });
      if (existingEmpresa) {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              "Ya existe una empresa con ese correo electrónico."
            )
          );
      }

      // Verificar si ya existe una empresa con ese CIF/NIF/NIE
      const existingCIF = await Empresa.findOne({ where: { cif_nif_nie } });
      if (existingCIF) {
        return res
          .status(400)
          .json(
            Respuesta.error(null, "Ya existe una empresa con ese CIF/NIF/NIE.")
          );
      }

      // Cifrar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear la nueva empresa
      const newEmpresa = await Empresa.create({
        nombre_empresa,
        cif_nif_nie,
        direccion,
        nombre_personal,
        apellidos,
        email,
        password: hashedPassword,
        ofertas: ofertas || true, // Valor por defecto si no se proporciona
      });

      // Responder con éxito
      delete newEmpresa.dataValues.password;
      res
        .status(201)
        .json(Respuesta.exito(newEmpresa, "Empresa registrada exitosamente"));
    } catch (error) {
      console.error("Error al registrar la empresa:", error);
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            "Error al registrar la empresa, intenta nuevamente"
          )
        );
    }
  }

  async logout(req, res) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "Lax",
    });
    res.status(200).json(Respuesta.exito(null, "Cierre de sesión exitoso"));
  }

  async getAllCompanies(req, res) {
    try {
      const empresas = await Empresa.findAll({
        attributes: { exclude: ["password"] }, // Excluir la contraseña
      });
      res.status(200).json(Respuesta.exito(empresas));
    } catch (error) {
      console.error("Error al obtener las empresas:", error);
      res
        .status(500)
        .json(Respuesta.error(null, "Error al obtener las empresas"));
    }
  }
}

module.exports = new CompanyController();
