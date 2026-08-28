/* =========================================================
   AUTORENTCAR
   FASE 2.7 - VEHÍCULOS
========================================================= */

USE autorentcar;


/* =========================================================
   MODELOS DE VEHÍCULOS
========================================================= */

CREATE TABLE IF NOT EXISTS modelos_vehiculos (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    agencia_id INT UNSIGNED NOT NULL,

    nombre VARCHAR(120) NOT NULL,

    marca VARCHAR(80) NOT NULL,

    anio SMALLINT UNSIGNED NULL,

    categoria ENUM(
        'economico',
        'gama_media',
        'lujo'
    ) NOT NULL,

    precio_diario DECIMAL(10,2) NOT NULL
        DEFAULT 0.00,

    transmision VARCHAR(50) NULL,

    combustible VARCHAR(50) NULL,

    pasajeros TINYINT UNSIGNED NULL,

    puertas TINYINT UNSIGNED NULL,

    equipaje TINYINT UNSIGNED NULL,

    aire_acondicionado BOOLEAN NOT NULL
        DEFAULT TRUE,

    destacado BOOLEAN NOT NULL
        DEFAULT FALSE,

    etiqueta VARCHAR(80) NULL,

    descripcion VARCHAR(500) NULL,

    imagen VARCHAR(255) NULL,

    estado ENUM(
        'activo',
        'inactivo'
    ) NOT NULL
        DEFAULT 'activo',

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_modelos_vehiculos_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    INDEX idx_modelos_vehiculos_agencia (
        agencia_id
    ),

    INDEX idx_modelos_vehiculos_categoria (
        categoria
    ),

    INDEX idx_modelos_vehiculos_estado (
        estado
    )

);


/* =========================================================
   UNIDADES FÍSICAS DE VEHÍCULOS
========================================================= */

CREATE TABLE IF NOT EXISTS vehiculos (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    agencia_id INT UNSIGNED NOT NULL,

    modelo_id INT UNSIGNED NOT NULL,

    sucursal_id INT UNSIGNED NOT NULL,

    codigo_interno VARCHAR(50) NOT NULL,

    placa VARCHAR(30) NULL,

    vin VARCHAR(50) NULL,

    color VARCHAR(50) NULL,

    kilometraje INT UNSIGNED NOT NULL
        DEFAULT 0,

    estado ENUM(
        'disponible',
        'reservado',
        'alquilado',
        'mantenimiento',
        'inactivo'
    ) NOT NULL
        DEFAULT 'disponible',

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_vehiculos_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_vehiculos_modelo

        FOREIGN KEY (
            modelo_id
        )

        REFERENCES modelos_vehiculos(
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_vehiculos_sucursal

        FOREIGN KEY (
            sucursal_id
        )

        REFERENCES sucursales(
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    UNIQUE KEY uk_vehiculos_agencia_codigo (
        agencia_id,
        codigo_interno
    ),


    UNIQUE KEY uk_vehiculos_agencia_placa (
        agencia_id,
        placa
    ),


    UNIQUE KEY uk_vehiculos_vin (
        vin
    ),


    INDEX idx_vehiculos_agencia (
        agencia_id
    ),

    INDEX idx_vehiculos_modelo (
        modelo_id
    ),

    INDEX idx_vehiculos_sucursal (
        sucursal_id
    ),

    INDEX idx_vehiculos_estado (
        estado
    )

);