-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 17-06-2025 a las 20:04:03
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
  `cantidad` int NOT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `componentes`
--

INSERT INTO `componentes` (`id_componente`, `nombre`, `precio`, `fecha_importacion`, `material`, `cantidad`, `descripcion`) VALUES
(1, 'Tornillo Phillips 4x50mm', 0.15, '2025-01-15', 'Acero inoxidable', 500, 'Tornillos de cabeza phillips para ensamblaje de muebles, resistentes a la corrosión'),
(2, 'Bisagra para piano 180°', 3.25, '2025-02-01', 'Acero inoxidable', 120, 'Bisagras de piano que permiten apertura completa, ideales para puertas de armarios'),
(3, 'Tablero melamina 60x40cm', 12.5, '2024-12-20', 'Melamina blanca', 85, 'Tableros de melamina de alta resistencia, perfectos para estantes y divisiones'),
(4, 'Pata regulable altura', 8.75, '2025-01-10', 'Metal cromado', 200, 'Patas ajustables en altura de 15 a 20 cm, base antideslizante incluida'),
(5, 'Tirador moderno 128mm', 4.5, '2025-02-10', 'Aluminio anodizado', 150, 'Tiradores de diseño moderno con acabado mate, fijación con dos tornillos'),
(6, 'Rueda giratoria con freno', 6.8, '2024-11-25', 'Plástico y metal', 80, 'Ruedas de 50mm de diámetro con sistema de frenado, soportan hasta 25kg'),
(7, 'Cajón deslizable 40cm', 25, '2025-01-20', 'Madera de pino', 45, 'Cajones premontados con guías telescópicas, cierre suave incluido'),
(8, 'Panel posterior 80x120cm', 18.9, '2024-12-15', 'Contrachapado', 60, 'Paneles traseros para armarios, grosor 5mm, pre-perforados para ventilación'),
(9, 'Cerradura magnética', 12.3, '2025-02-05', 'Plástico y metal', 90, 'Sistema de cierre magnético sin ruido, instalación sin herramientas'),
(10, 'Led strip 1 metro', 15.6, '2025-01-30', 'Silicona y LED', 75, 'Tira LED adhesiva con regulador de intensidad, luz blanca cálida 3000K');

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
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ofertas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`id_empresa`, `nombre_empresa`, `cif_nif_nie`, `direccion`, `nombre_personal`, `apellidos`, `email`, `password`, `ofertas`) VALUES
(1, 'Muebles Nórdicos S.L.', 'B12345678', 'Polígono Industrial Norte, Nave 15, Madrid', 'Patricia', 'González Ruiz', 'contacto@mueblenordico.com', '$2b$10$WvJTMzRVs09zwhlkhsPCF.w7a1HnKqLcIMAKBWrqxSQlcxB7IWERS', 1),
(2, 'Diseño y Confort S.A.', 'A87654321', 'Calle Industria 89, Barcelona', 'Roberto', 'Vázquez Herrera', 'info@disenoconfort.com', '$2b$10$h4EZf/hgQeOgikoBQBvgxuTtsEKGUHzXYjYV3Ril0ZK4iUoLWSyk.', 1),
(3, 'Maderas Artesanales', 'B11223344', 'Avenida del Mueble 12, Valencia', 'Carmen', 'Rodríguez Pérez', 'ventas@maderasartesanales.es', '$2b$10$ZlAHHY4GJVh1tEBOLhvQruL5nwcpie9mTmweV3F0JNYQvSN7gEHWG', 1);

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
  `id_empresa` int NOT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `mueble`
--

INSERT INTO `mueble` (`id_mueble`, `nombre`, `precio_base`, `fecha_entrega`, `requiere_montar`, `id_empresa`, `imagen`, `descripcion`) VALUES
(1, 'Estantería', 89.99, '2025-06-15', 1, 1, '/uploads/muebles/mueble-1749901093968-894823834.jpeg', 'Estantería de 5 baldas en madera de pino, diseño nórdico minimalista. Ideal para salón o dormitorio.'),
(2, 'Mesa escritorio', 149.5, '2025-06-20', 1, 1, '/uploads/muebles/mueble-1749901157024-586776185.jpeg', 'Mesa de escritorio con dos cajones laterales y espacio para cables. Superficie resistente a rayones.'),
(3, 'Silla oficina', 199, '2025-06-18', 0, 2, '/uploads/muebles/mueble-1749901368887-803335248.jpeg', 'Silla ergonómica con respaldo alto, reposabrazos ajustables y ruedas silenciosas.'),
(4, 'Armario', 299.99, '2025-06-25', 1, 2, '/uploads/muebles/mueble-1749901440839-215856774.jpeg', 'Armario de 3 puertas con barra para colgar y 2 cajones inferiores. Espejo interior opcional.'),
(5, 'Mesa comedor', 249, '2025-06-22', 1, 3, '/uploads/muebles/mueble-1749901654701-693564137.jpeg', 'Mesa extensible para 4-6 personas, madera maciza de roble con acabado natural.'),
(6, 'Taburete bar', 45.9, '2025-06-12', 0, 3, '/uploads/muebles/mueble-1749901710912-913725311.jpeg', 'Taburete con altura regulable, asiento acolchado y reposapiés cromado.'),
(7, 'Cómoda', 179.99, '2025-06-28', 1, 1, '/uploads/muebles/mueble-1749901212589-154002587.jpeg', 'Cómoda de 4 cajones con tiradores modernos, ideal para dormitorio o recibidor.'),
(8, 'Mesita noche', 69.5, '2025-06-16', 1, 2, '/uploads/muebles/mueble-1749901533456-174347262.jpeg', 'Mesita de noche con cajón y estante abierto.');

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
(1, 1, 20),
(1, 3, 5),
(1, 8, 1),
(2, 1, 12),
(2, 4, 3),
(2, 5, 2),
(2, 7, 2),
(3, 1, 8),
(3, 6, 5),
(4, 1, 30),
(4, 2, 6),
(4, 5, 5),
(4, 8, 1),
(4, 9, 3),
(5, 1, 16),
(5, 4, 4),
(6, 1, 6),
(6, 4, 1),
(7, 1, 24),
(7, 5, 4),
(7, 7, 4),
(7, 8, 1),
(8, 1, 12),
(8, 5, 1),
(8, 7, 1),
(8, 10, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `id_pedido` int NOT NULL,
  `id_usuario` int NOT NULL,
  `f_pedido` date NOT NULL,
  `precio_total` double NOT NULL,
  `estado` enum('pendiente','procesando','finalizado') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `pedido`
--

INSERT INTO `pedido` (`id_pedido`, `id_usuario`, `f_pedido`, `precio_total`, `estado`) VALUES
(1, 1, '2025-06-02', 239.49, 'finalizado'),
(2, 2, '2025-06-10', 149.5, 'procesando'),
(3, 3, '2025-06-05', 518.99, 'pendiente'),
(4, 1, '2025-05-28', 115.4, 'pendiente'),
(5, 4, '2025-06-03', 89.99, 'procesando');

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

--
-- Volcado de datos para la tabla `pedido_producto`
--

INSERT INTO `pedido_producto` (`id_producto_pedido`, `id_pedido`, `id_producto`, `tipo_producto`, `cantidad`) VALUES
(1, 1, 2, 'mueble', 1),
(2, 1, 5, 'mueble', 1),
(3, 2, 2, 'mueble', 1),
(4, 3, 4, 'mueble', 1),
(5, 3, 3, 'mueble', 1),
(6, 3, 1, 'mueble', 1),
(7, 4, 6, 'mueble', 2),
(8, 4, 8, 'mueble', 1),
(9, 4, 5, 'componente', 2),
(10, 5, 1, 'mueble', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `f_nacimiento` date NOT NULL,
  `sexo` enum('hombre','mujer','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ofertas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `email`, `password`, `nombre`, `apellidos`, `direccion`, `f_nacimiento`, `sexo`, `ofertas`) VALUES
(1, 'ana.martinez@email.com', '$2b$10$OhFMuBY9U7NghhvR8eMp1.nROKfYmeTNlUHFcdjrqA6dswsl6fNmK', 'Ana', 'Martínez Silva', 'Calle Gran Vía 45, Madrid', '1985-03-12', 'mujer', 1),
(2, 'carlos.ruiz@email.com', '$2b$10$JcWhTcCvE.qOGoZr8q7B3eVFEfE0FxwVj.S74cj5xOcdudzORpZzm', 'Carlos', 'Ruiz Mendoza', 'Avenida Diagonal 123, Barcelona', '1990-07-23', 'hombre', 1),
(3, 'lucia.fernandez@email.com', '$2b$10$UMvctf4JK7PXd4L6MpG1uON03ClPxPBIb/vR8xtmOaRErSoDknVSu', 'Lucía', 'Fernández López', 'Plaza Mayor 8, Salamanca', '1992-11-05', 'mujer', 1),
(4, 'miguel.santos@email.com', '$2b$10$SUvGV.itZrYECvad6earK.Xex111.nJdXwvz2F8deq39S5PZLt93e', 'Miguel', 'Santos García', 'Calle Sierpes 67, Sevilla', '1988-01-18', 'hombre', 1),
(5, 'elena.jimenez@email.com', '$2b$10$EAZf96zIDmDAJYq.kRXbTelRiONyXGmnEmZV932.KOnv84ZxqOaSO', 'Elena', 'Jiménez Morales', 'Rambla Nova 34, Tarragona', '1995-09-14', 'mujer', 1);

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
  MODIFY `id_componente` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mueble`
--
ALTER TABLE `mueble`
  MODIFY `id_mueble` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `id_pedido` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pedido_producto`
--
ALTER TABLE `pedido_producto`
  MODIFY `id_producto_pedido` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

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
