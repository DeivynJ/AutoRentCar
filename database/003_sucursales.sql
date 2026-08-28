/* =========================================================
   AUTORENTCAR
   FASE 2.6 - SUCURSALES
========================================================= */

USE autorentcar;


/* =========================================================
   SUCURSALES
========================================================= */

CREATE TABLE IF NOT EXISTS sucursales (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    agencia_id INT UNSIGNED NOT NULL,

    nombre VARCHAR(120) NOT NULL,

    correo VARCHAR(150) NULL,

    telefono VARCHAR(30) NULL,

    whatsapp VARCHAR(30) NULL,

    direccion VARCHAR(255) NULL,

    ciudad VARCHAR(100) NULL,

    provincia VARCHAR(100) NULL,

    pais VARCHAR(100) NOT NULL
        DEFAULT 'República Dominicana',

    es_principal BOOLEAN NOT NULL
        DEFAULT FALSE,

    estado ENUM(
        'activa',
        'inactiva'
    ) NOT NULL
        DEFAULT 'activa',

    fecha_creacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT fk_sucursales_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    UNIQUE KEY uk_sucursales_agencia_nombre (
        agencia_id,
        nombre
    ),


    INDEX idx_sucursales_agencia (
        agencia_id
    ),

    INDEX idx_sucursales_estado (
        estado
    ),

    INDEX idx_sucursales_principal (
        es_principal
    )

);