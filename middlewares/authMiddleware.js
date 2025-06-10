// Importar librería de manejo de JWT
const jwt = require("jsonwebtoken");

// Importar libreria para manejo de ficheros de configuración dependiendo de la variable de entorno NODE_ENV
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// Importar fichero de configuración con variables de entorno
const config = require("../config/config.js");
const { logMensaje } = require("../utils/logger.js");

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  let token = null;

  console.log('Headers recibidos:', req.headers);
  console.log('Cookies recibidas:', req.cookies);

  // Prioridad 1: Buscar token en el header Authorization
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remover "Bearer "
    console.log("Token obtenido del header Authorization");
  }

  // Prioridad 2: Si no hay token en header, buscar en cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token obtenido de cookies");
  }

  if (!token) {
    return res.status(401).json({
      ok: false,
      datos: null,
      mensaje: "Token no proporcionado",
    });
  }

  try {
    const decoded = jwt.verify(token, config.secretKey);
    req.usuarioLogueado = decoded;

    req.user = decoded;

    // Log para debugging
    console.log("Usuario autenticado:", {
      id: decoded.sub || decoded.id_usuario || decoded.id_empresa,
      role: decoded.role,
      email: decoded.email,
    });

    next();
  } catch (err) {
    logMensaje(`Error al verificar el token: ${err.message}`);

    // Respuesta mejorada para errores de token
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        datos: null,
        mensaje: "Token expirado",
      });
    }

    return res.status(403).json({
      ok: false,
      datos: null,
      mensaje: "Token inválido",
    });
  }
};

// Middleware para verificar si el usuario tiene un rol específico
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuarioLogueado) {
      return res
        .status(401)
        .json({ ok: false, mensaje: "No autorizado.", datos: null });
    }

    if (!rolesPermitidos.includes(req.usuarioLogueado.role)) {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado. No tienes permisos suficientes.",
        datos: null,
      });
    }

    next(); // Permite el acceso si el rol es válido
  };
};

// Middleware para verificar si es un usuario
const esUsuario = (req, res, next) => {
  verificarRol(["usuario"])(req, res, next);
};

// Middleware para verificar si es una empresa
const esEmpresa = (req, res, next) => {
  verificarRol(["empresa"])(req, res, next);
};

// Middleware para verificar si es usuario o empresa (cualquiera de los dos)
const esUsuarioOEmpresa = (req, res, next) => {
  verificarRol(["usuario", "empresa"])(req, res, next);
};

module.exports = {
  verifyToken,
  verificarRol,
  esUsuario,
  esEmpresa,
  esUsuarioOEmpresa,
};
