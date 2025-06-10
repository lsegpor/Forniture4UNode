// Importar libreria para respuestas
const Respuesta = require("../utils/respuesta.js");
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
// Recuperar el modelo user
const User = models.usuario;

class UserController {
  async updateUser(req, res) {
    try {
      console.log("Datos recibidos:", req.body);

      const {
        nombre,
        apellidos,
        email,
        direccion,
        f_nacimiento,
        sexo,
        ofertas,
      } = req.body;

      // Obtener ID del usuario autenticado
      const id_usuario =
        req.usuarioLogueado.sub || req.usuarioLogueado.id_usuario;
      console.log("ID Usuario:", id_usuario);

      if (!id_usuario) {
        return res
          .status(400)
          .json(Respuesta.error(null, "No se pudo identificar al usuario"));
      }

      // Verificar que el usuario existe
      const user = await User.findByPk(id_usuario);
      if (!user) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Usuario no encontrado"));
      }

      console.log("Usuario encontrado:", user.dataValues);

      // Verificar si el email ya existe (si se está cambiando)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id_usuario: { [require("sequelize").Op.ne]: id_usuario },
          },
        });

        if (existingUser) {
          return res
            .status(400)
            .json(
              Respuesta.error(null, "El email ya está en uso por otro usuario")
            );
        }
      }

      // Actualizar los datos
      const updatedData = {};
      if (nombre !== undefined) updatedData.nombre = nombre;
      if (apellidos !== undefined) updatedData.apellidos = apellidos;
      if (email !== undefined) updatedData.email = email;
      if (direccion !== undefined) updatedData.direccion = direccion;
      if (f_nacimiento !== undefined) updatedData.f_nacimiento = f_nacimiento;
      if (sexo !== undefined) updatedData.sexo = sexo;
      if (ofertas !== undefined) updatedData.ofertas = ofertas;

      console.log("Datos a actualizar:", updatedData);

      await user.update(updatedData);

      // Devolver los datos actualizados sin la contraseña
      const userResponse = await User.findByPk(id_usuario, {
        attributes: { exclude: ["password"] },
      });

      console.log("Usuario actualizado:", userResponse.dataValues);

      const response = Respuesta.exito(
        userResponse.dataValues,
        "Usuario actualizado exitosamente"
      );
      console.log("Respuesta final:", response);

      res
        .status(200)
        .json(
          Respuesta.exito(userResponse, "Usuario actualizado exitosamente")
        );
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  async getProfile(req, res) {
    try {
      // Obtener ID del usuario autenticado
      const id_usuario =
        req.usuarioLogueado.sub || req.usuarioLogueado.id_usuario;

      if (!id_usuario) {
        return res
          .status(400)
          .json(Respuesta.error(null, "No se pudo identificar al usuario"));
      }

      const user = await User.findByPk(id_usuario, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res
          .status(404)
          .json(Respuesta.error(null, "Usuario no encontrado"));
      }

      res
        .status(200)
        .json(Respuesta.exito(user, "Perfil obtenido exitosamente"));
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json(Respuesta.error(null, "Error interno del servidor"));
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res
          .status(401)
          .json(Respuesta.error(null, "Usuario no encontrado"));
      }

      // Verificar la contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res
          .status(401)
          .json(Respuesta.error(null, "Password incorrecta"));
      }

      // Generar el token JWT
      const token = jwt.sign(
        {
          sub: user.id_usuario,
          email: user.email,
          nombre: user.nombre,
          apellidos: user.apellidos,
          direccion: user.direccion,
          f_nacimiento: user.f_nacimiento,
          sexo: user.sexo,
          ofertas: user.ofertas,
          role: "usuario", // Añadimos el rol para diferenciar
        },
        config.secretKey,
        { expiresIn: "1h" }
      );

      // Configurar la cookie con el token
      res.cookie("token", token, {
        httpOnly: true, // Evita que JavaScript acceda a la cookie
        secure: process.env.NODE_ENV === "production", // Solo en HTTPS en producción
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "Lax", // Protección CSRF // Lax en desarrollo
        maxAge: 3600000, // 1 hora en milisegundos
      });
      console.log("Cookie establecida:", token);

      //Eliminar la contraseña del objeto de respuesta
      delete user.dataValues.password;

      const responseData = {
        ...user.dataValues,
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
      email,
      password,
      nombre,
      apellidos,
      direccion,
      f_nacimiento,
      sexo,
      ofertas,
    } = req.body;

    try {
      // Validar si todos los campos fueron proporcionados
      if (
        !email ||
        !password ||
        !nombre ||
        !apellidos ||
        !direccion ||
        !f_nacimiento ||
        !sexo
      ) {
        return res
          .status(400)
          .json(Respuesta.error(null, "Faltan campos por informar"));
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json(
            Respuesta.error(
              null,
              "Ya existe un usuario con ese correo electrónico."
            )
          );
      }

      // Cifrar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el nuevo usuario
      const newUser = await User.create({
        email,
        password: hashedPassword,
        nombre,
        apellidos,
        direccion,
        f_nacimiento,
        sexo,
        ofertas: ofertas || true,
      });

      // Responder con éxito
      delete newUser.dataValues.password;
      res
        .status(201)
        .json(Respuesta.exito(newUser, "Usuario registrado exitosamente"));
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      res
        .status(500)
        .json(
          Respuesta.error(
            null,
            "Error al registrar el usuario, intenta nuevamente"
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

  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] }, // Excluir la contraseña
      });
      res.status(200).json(Respuesta.exito(users));
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
      res
        .status(500)
        .json(Respuesta.error(null, "Error al obtener los usuarios"));
    }
  }
}

module.exports = new UserController();
