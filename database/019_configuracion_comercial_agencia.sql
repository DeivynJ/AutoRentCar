/* =========================================================
   AVYNEXO
   019 - CONFIGURACIÓN COMERCIAL POR AGENCIA
========================================================= */

USE autorentcar;


/* =========================================================
   TABLA: adicionales_agencia

   Define los servicios adicionales que cada agencia
   puede ofrecer actualmente.

   Las reservaciones ya creadas continúan conservando
   su fotografía histórica en reservacion_adicionales.
========================================================= */

CREATE TABLE IF NOT EXISTS adicionales_agencia (

    id
        INT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,


    agencia_id
        INT UNSIGNED
        NOT NULL,


    codigo
        VARCHAR(80)
        NOT NULL,


    nombre
        VARCHAR(150)
        NOT NULL,


    descripcion
        VARCHAR(255)
        DEFAULT NULL,


    precio_diario
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    activo
        TINYINT(1)
        NOT NULL
        DEFAULT 1,


    orden
        SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 0,


    fecha_creacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    PRIMARY KEY (
        id
    ),


    UNIQUE KEY uk_adicionales_agencia_codigo (
        agencia_id,
        codigo
    ),


    KEY idx_adicionales_agencia_agencia (
        agencia_id
    ),


    KEY idx_adicionales_agencia_activo (
        agencia_id,
        activo
    ),


    CONSTRAINT fk_adicionales_agencia_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias (
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT chk_adicionales_agencia_precio

        CHECK (
            precio_diario >= 0
        )

)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/* =========================================================
   TABLA: promociones_agencia

   Cada promoción pertenece exclusivamente a una agencia.

   publica:
       1 = puede anunciarse públicamente
       0 = funciona, pero no debe publicarse

   activo:
       1 = puede utilizarse si está dentro de vigencia
       0 = completamente deshabilitada
========================================================= */

CREATE TABLE IF NOT EXISTS promociones_agencia (

    id
        INT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,


    agencia_id
        INT UNSIGNED
        NOT NULL,


    codigo
        VARCHAR(80)
        NOT NULL,


    nombre
        VARCHAR(150)
        NOT NULL,


    porcentaje_descuento
        DECIMAL(5,2)
        NOT NULL,


    fecha_inicio
        DATE
        DEFAULT NULL,


    fecha_fin
        DATE
        DEFAULT NULL,


    publica
        TINYINT(1)
        NOT NULL
        DEFAULT 1,


    activo
        TINYINT(1)
        NOT NULL
        DEFAULT 1,


    fecha_creacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    PRIMARY KEY (
        id
    ),


    UNIQUE KEY uk_promociones_agencia_codigo (
        agencia_id,
        codigo
    ),


    KEY idx_promociones_agencia_agencia (
        agencia_id
    ),


    KEY idx_promociones_agencia_activo (
        agencia_id,
        activo
    ),


    KEY idx_promociones_agencia_publica (
        agencia_id,
        publica,
        activo
    ),


    CONSTRAINT fk_promociones_agencia_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias (
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT chk_promociones_agencia_porcentaje

        CHECK (
            porcentaje_descuento > 0
            AND porcentaje_descuento <= 100
        ),


    CONSTRAINT chk_promociones_agencia_fechas

        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        )

)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/* =========================================================
   MIGRAR CONFIGURACIÓN COMERCIAL ACTUAL

   Se copian los valores que actualmente existen escritos
   directamente en el código para todas las agencias
   registradas.

   INSERT IGNORE permite ejecutar nuevamente la migración
   sin duplicar ni sobrescribir configuraciones existentes.
========================================================= */


/* ---------------------------------------------------------
   SEGURO AMPLIADO
--------------------------------------------------------- */

INSERT IGNORE INTO adicionales_agencia (
    agencia_id,
    codigo,
    nombre,
    descripcion,
    precio_diario,
    activo,
    orden
)
SELECT
    id,
    'seguro-ampliado',
    'Seguro ampliado',
    'Mayor protección durante el alquiler.',
    12.00,
    1,
    10
FROM agencias;


/* ---------------------------------------------------------
   GPS
--------------------------------------------------------- */

INSERT IGNORE INTO adicionales_agencia (
    agencia_id,
    codigo,
    nombre,
    descripcion,
    precio_diario,
    activo,
    orden
)
SELECT
    id,
    'gps-adicional',
    'Sistema GPS',
    'Navegación para tus recorridos.',
    5.00,
    1,
    20
FROM agencias;


/* ---------------------------------------------------------
   ASIENTO INFANTIL
--------------------------------------------------------- */

INSERT IGNORE INTO adicionales_agencia (
    agencia_id,
    codigo,
    nombre,
    descripcion,
    precio_diario,
    activo,
    orden
)
SELECT
    id,
    'asiento-infantil',
    'Asiento infantil',
    'Seguridad adicional para niños.',
    4.00,
    1,
    30
FROM agencias;


/* ---------------------------------------------------------
   PROMOCIÓN ACTUAL AUTO15

   15.00 representa 15 %.
--------------------------------------------------------- */

INSERT IGNORE INTO promociones_agencia (
    agencia_id,
    codigo,
    nombre,
    porcentaje_descuento,
    fecha_inicio,
    fecha_fin,
    publica,
    activo
)
SELECT
    id,
    'AUTO15',
    '15 % de descuento',
    15.00,
    NULL,
    NULL,
    1,
    1
FROM agencias;