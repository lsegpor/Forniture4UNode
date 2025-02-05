-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 05-02-2025 a las 18:23:39
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
  `en_stock` tinyint(1) NOT NULL,
  `material` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `componentes`
--

INSERT INTO `componentes` (`id_componente`, `nombre`, `precio`, `fecha_importacion`, `en_stock`, `material`) VALUES
(22, 'Tornillo de acero inoxidable', 2.99, '2025-02-03', 1, 'Acero inoxidable'),
(23, 'Tapa de madera para mesa', 50, '2024-12-30', 0, 'Madera de roble'),
(24, 'Ruedas para silla', 5.49, '2023-11-03', 1, 'Plástico y metal'),
(25, 'Almohadilla de cuero para sofá', 15.8, '2023-08-25', 1, 'Cuero'),
(26, 'Patas de metal para mesa', 30, '2025-01-10', 1, 'Metal'),
(27, 'Cajón', 60, '2024-05-20', 0, 'Madera de roble'),
(28, 'Tirador de cajón', 15, '2025-01-23', 1, 'Metal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mueble`
--

CREATE TABLE `mueble` (
  `id_mueble` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `precio_base` double NOT NULL,
  `fecha_entrega` date NOT NULL,
  `requiere_montar` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `mueble`
--

INSERT INTO `mueble` (`id_mueble`, `nombre`, `precio_base`, `fecha_entrega`, `requiere_montar`) VALUES
(24, 'Silla ergonómica', 120, '2025-01-31', 1),
(25, 'Mesa de comedor extensible', 300, '2024-02-20', 1),
(26, 'Estantería de madera', 85, '2025-01-26', 0),
(27, 'Sofá cama', 450, '2023-12-21', 1),
(28, 'Armario pequeño', 150, '2025-05-24', 0);

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
(28, 28, 4);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `componentes`
--
ALTER TABLE `componentes`
  ADD PRIMARY KEY (`id_componente`);

--
-- Indices de la tabla `mueble`
--
ALTER TABLE `mueble`
  ADD PRIMARY KEY (`id_mueble`);

--
-- Indices de la tabla `mueble_componentes`
--
ALTER TABLE `mueble_componentes`
  ADD PRIMARY KEY (`id_mueble`,`id_componente`),
  ADD KEY `id_componente` (`id_componente`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `componentes`
--
ALTER TABLE `componentes`
  MODIFY `id_componente` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `mueble`
--
ALTER TABLE `mueble`
  MODIFY `id_mueble` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `mueble_componentes`
--
ALTER TABLE `mueble_componentes`
  ADD CONSTRAINT `mueble_componentes_ibfk_1` FOREIGN KEY (`id_mueble`) REFERENCES `mueble` (`id_mueble`) ON DELETE CASCADE,
  ADD CONSTRAINT `mueble_componentes_ibfk_2` FOREIGN KEY (`id_componente`) REFERENCES `componentes` (`id_componente`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
