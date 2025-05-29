-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 08-04-2025 a las 16:52:27
-- Versión del servidor: 8.0.39
-- Versión de PHP: 8.2.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ikea`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `componentes`
--

CREATE TABLE `componentes` (
  `id_componente` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio` double NOT NULL,
  `fecha_importacion` date DEFAULT NULL,
  `material` varchar(50) NOT NULL,
  `cantidad` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `componentes`
--

INSERT INTO `componentes` (`id_componente`, `nombre`, `precio`, `fecha_importacion`, `material`, `cantidad`) VALUES
(22, 'Tornillo de acero inoxidable', 2.99, '2025-02-03', 'Acero inoxidable', 0),
(23, 'Tapa de madera para mesa', 50, '2024-12-30', 'Madera de roble', 0),
(24, 'Ruedas para silla', 5.49, '2023-11-03', 'Plástico y metal', 0),
(25, 'Almohadilla de cuero para sofá', 15.8, '2023-08-25', 'Cuero', 0),
(26, 'Patas de metal para mesa', 30, '2025-01-10', 'Metal', 0),
(27, 'Cajón', 60, '2024-05-20', 'Madera de roble', 0),
(28, 'Tirador de cajón', 15, '2025-01-23', 'Metal', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL,
  `nombre_empresa` varchar(50) NOT NULL,
  `cif_nif_nie` varchar(50) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `nombre_personal` varchar(50) NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `ofertas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`id_empresa`, `nombre_empresa`, `cif_nif_nie`, `direccion`, `nombre_personal`, `apellidos`, `email`, `password`, `ofertas`) VALUES
(1, 'pepe s.a', '12345678A', 'blabla, 2, 23456', 'pepe', 'manzanos rodriguez', 'pepe@gmail.com', 'pepe', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensaje`
--

CREATE TABLE `mensaje` (
  `id_mensaje` int NOT NULL,
  `id_usuario` int NOT NULL,
  `id_empresa` int NOT NULL,
  `emisor` enum('usuario','empresa') NOT NULL,
  `texto` varchar(500) NOT NULL,
  `respuesta` varchar(200) NOT NULL,
  `f_envio` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mueble`
--

CREATE TABLE `mueble` (
  `id_mueble` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio_base` double NOT NULL,
  `fecha_entrega` date NOT NULL,
  `requiere_montar` tinyint(1) NOT NULL,
  `id_empresa` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `mueble`
--

INSERT INTO `mueble` (`id_mueble`, `nombre`, `precio_base`, `fecha_entrega`, `requiere_montar`, `id_empresa`) VALUES
(24, 'Silla ergonómica', 120, '2025-01-31', 1, 1),
(25, 'Mesa de comedor extensible', 300, '2024-02-20', 1, 1),
(26, 'Estantería de madera', 85, '2025-01-26', 0, 1),
(27, 'Sofá cama', 450, '2023-12-21', 1, 1),
(28, 'Armario pequeño', 150, '2025-05-24', 0, 1),
(29, 'Mesa de roble', 250, '2021-12-31', 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mueble_componentes`
--

CREATE TABLE `mueble_componentes` (
  `id_mueble` int NOT NULL,
  `id_componente` int NOT NULL,
  `cantidad` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `mueble_componentes`
--

INSERT INTO `mueble_componentes` (`id_mueble`, `id_componente`, `cantidad`) VALUES
(24, 24, 4),
(25, 23, 1),
(25, 26, 4),
(26, 22, 2),
(27, 22, 10),
(27, 25, 2),
(28, 22, 10),
(28, 27, 4),
(28, 28, 4),
(29, 22, 2),
(29, 23, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `id_pedido` int NOT NULL,
  `id_usuario` int NOT NULL,
  `f_pedido` date NOT NULL,
  `precio_total` decimal(50,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Disparadores `pedido`
--
DELIMITER $$
CREATE TRIGGER `set_fecha_pedido` BEFORE INSERT ON `pedido` FOR EACH ROW SET NEW.f_pedido = CURRENT_DATE
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_producto`
--

CREATE TABLE `pedido_producto` (
  `id_producto_pedido` int NOT NULL,
  `id_pedido` int NOT NULL,
  `id_producto` int NOT NULL,
  `tipo_producto` enum('mueble','componente') NOT NULL,
  `cantidad` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `f_nacimiento` date NOT NULL,
  `sexo` enum('hombre','mujer','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ofertas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `componentes`
--
ALTER TABLE `componentes`
  ADD PRIMARY KEY (`id_componente`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id_empresa`);

--
-- Indices de la tabla `mensaje`
--
ALTER TABLE `mensaje`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `fk_usuario_id` (`id_usuario`),
  ADD KEY `fk_empresa_id` (`id_empresa`);

--
-- Indices de la tabla `mueble`
--
ALTER TABLE `mueble`
  ADD PRIMARY KEY (`id_mueble`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD KEY `fk_empresa_mueble` (`id_empresa`);

--
-- Indices de la tabla `mueble_componentes`
--
ALTER TABLE `mueble_componentes`
  ADD PRIMARY KEY (`id_mueble`,`id_componente`),
  ADD KEY `mueble_componentes_ibfk_2` (`id_componente`);

--
-- Indices de la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `fk_usuario_pedido` (`id_usuario`);

--
-- Indices de la tabla `pedido_producto`
--
ALTER TABLE `pedido_producto`
  ADD PRIMARY KEY (`id_producto_pedido`),
  ADD KEY `fk_pedido` (`id_pedido`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `componentes`
--
ALTER TABLE `componentes`
  MODIFY `id_componente` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `mensaje`
--
ALTER TABLE `mensaje`
  MODIFY `id_mensaje` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mueble`
--
ALTER TABLE `mueble`
  MODIFY `id_mueble` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `id_pedido` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido_producto`
--
ALTER TABLE `pedido_producto`
  MODIFY `id_producto_pedido` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `mensaje`
--
ALTER TABLE `mensaje`
  ADD CONSTRAINT `fk_empresa_id` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_usuario_id` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `mueble`
--
ALTER TABLE `mueble`
  ADD CONSTRAINT `fk_empresa_mueble` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `mueble_componentes`
--
ALTER TABLE `mueble_componentes`
  ADD CONSTRAINT `mueble_componentes_ibfk_1` FOREIGN KEY (`id_mueble`) REFERENCES `mueble` (`id_mueble`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `mueble_componentes_ibfk_2` FOREIGN KEY (`id_componente`) REFERENCES `componentes` (`id_componente`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `fk_usuario_pedido` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedido_producto`
--
ALTER TABLE `pedido_producto`
  ADD CONSTRAINT `fk_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
