/* =========================================================
   AUTORENTCAR
   MIGRACIÓN 006 - ADICIONALES DE RESERVACIONES
========================================================= */

USE autorentcar;


/* =========================================================
   TABLA: reservacion_adicionales

   Guarda una fotografía histórica de los servicios
   adicionales seleccionados al momento de realizar
   una reservación.

   No depende del precio que pueda existir posteriormente
   en el frontend o en una futura configuración de agencia.
========================================================= */

CREATE TABLE IF NOT EXISTS reservacion_adicionales (

    id
        INT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,


    /* -----------------------------------------------------
       RESERVACIÓN
    ----------------------------------------------------- */

    reservacion_id
        INT UNSIGNED
        NOT NULL,


    /* -----------------------------------------------------
       IDENTIFICACIÓN DEL ADICIONAL

       codigo permite identificar internamente el servicio.

       Ejemplos futuros:
       seguro_ampliado
       gps
       asiento_infantil
    ----------------------------------------------------- */

    codigo
        VARCHAR(80)
        NOT NULL,


    nombre
        VARCHAR(150)
        NOT NULL,


    /* -----------------------------------------------------
       SNAPSHOT ECONÓMICO

       Los adicionales actuales se cobran por vehículo
       y por día.
    ----------------------------------------------------- */

    precio_diario
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    cantidad_vehiculos
        SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 1,


    dias
        SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 1,


    costo_total
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    /* -----------------------------------------------------
       AUDITORÍA
    ----------------------------------------------------- */

    fecha_creacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    /* =====================================================
       CLAVE PRIMARIA
    ===================================================== */

    PRIMARY KEY (
        id
    ),


    /* =====================================================
       EVITAR REPETIR EL MISMO ADICIONAL
       EN UNA MISMA RESERVACIÓN
    ===================================================== */

    UNIQUE KEY uk_reservacion_adicional_codigo (
        reservacion_id,
        codigo
    ),


    /* =====================================================
       ÍNDICES
    ===================================================== */

    KEY idx_reservacion_adicionales_reservacion (
        reservacion_id
    ),


    KEY idx_reservacion_adicionales_codigo (
        codigo
    ),


    /* =====================================================
       CLAVE FORÁNEA
    ===================================================== */

    CONSTRAINT fk_reservacion_adicionales_reservacion

        FOREIGN KEY (
            reservacion_id
        )

        REFERENCES reservaciones (
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    /* =====================================================
       VALIDACIONES
    ===================================================== */

    CONSTRAINT chk_reservacion_adicional_precio

        CHECK (
            precio_diario >= 0
        ),


    CONSTRAINT chk_reservacion_adicional_cantidad

        CHECK (
            cantidad_vehiculos > 0
        ),


    CONSTRAINT chk_reservacion_adicional_dias

        CHECK (
            dias > 0
        ),


    CONSTRAINT chk_reservacion_adicional_total

        CHECK (
            costo_total >= 0
        )


)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;