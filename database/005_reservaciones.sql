/* =========================================================
   AUTORENTCAR
   MIGRACIÓN 005 - RESERVACIONES
========================================================= */

USE autorentcar;


/* =========================================================
   TABLA: reservaciones
========================================================= */

CREATE TABLE IF NOT EXISTS reservaciones (

    id
        INT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,


    /* -----------------------------------------------------
       TENANT / AGENCIA
    ----------------------------------------------------- */

    agencia_id
        INT UNSIGNED
        NOT NULL,


    codigo
        VARCHAR(40)
        NOT NULL,


    /* -----------------------------------------------------
       MODELO SOLICITADO
    ----------------------------------------------------- */

    modelo_id
        INT UNSIGNED
        NOT NULL,


    cantidad_vehiculos
        SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 1,


    /* -----------------------------------------------------
       LUGARES
    ----------------------------------------------------- */

    sucursal_recogida_id
        INT UNSIGNED
        DEFAULT NULL,


    sucursal_entrega_id
        INT UNSIGNED
        DEFAULT NULL,


    lugar_recogida
        VARCHAR(255)
        DEFAULT NULL,


    lugar_entrega
        VARCHAR(255)
        DEFAULT NULL,


    /* -----------------------------------------------------
       PERÍODO DE ALQUILER
    ----------------------------------------------------- */

    fecha_recogida
        DATE
        NOT NULL,


    hora_recogida
        TIME
        NOT NULL,


    fecha_entrega
        DATE
        NOT NULL,


    hora_entrega
        TIME
        NOT NULL,


    /* -----------------------------------------------------
       DATOS DEL CLIENTE
       Se guardan como fotografía histórica de la reserva.
    ----------------------------------------------------- */

    cliente_nombre
        VARCHAR(180)
        NOT NULL,


    cliente_documento
        VARCHAR(60)
        DEFAULT NULL,


    cliente_correo
        VARCHAR(150)
        DEFAULT NULL,


    cliente_telefono
        VARCHAR(30)
        NOT NULL,


    cliente_edad
        TINYINT UNSIGNED
        DEFAULT NULL,


    cliente_licencia
        VARCHAR(80)
        DEFAULT NULL,


    /* -----------------------------------------------------
       INFORMACIÓN ECONÓMICA

       precio_diario se almacena como snapshot para que una
       modificación futura del catálogo no cambie reservas
       anteriores.
    ----------------------------------------------------- */

    precio_diario
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    subtotal
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    costo_adicionales
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    descuento
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    total
        DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    codigo_promocional
        VARCHAR(80)
        DEFAULT NULL,


    /* -----------------------------------------------------
       INFORMACIÓN ADICIONAL
    ----------------------------------------------------- */

    comentarios
        TEXT
        DEFAULT NULL,


    /* -----------------------------------------------------
       ESTADO DE LA RESERVACIÓN
    ----------------------------------------------------- */

    estado
        ENUM(
            'pendiente',
            'confirmada',
            'en_curso',
            'finalizada',
            'rechazada',
            'cancelada'
        )
        NOT NULL
        DEFAULT 'pendiente',


    /* -----------------------------------------------------
       ORIGEN

       web   = cliente desde sitio público
       panel = usuario de la agencia
    ----------------------------------------------------- */

    origen
        ENUM(
            'web',
            'panel'
        )
        NOT NULL
        DEFAULT 'web',


    creado_por_usuario_id
        INT UNSIGNED
        DEFAULT NULL,


    /* -----------------------------------------------------
       AUDITORÍA
    ----------------------------------------------------- */

    fecha_creacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    /* =====================================================
       CLAVE PRIMARIA
    ===================================================== */

    PRIMARY KEY (
        id
    ),


    /* =====================================================
       RESTRICCIONES ÚNICAS
    ===================================================== */

    UNIQUE KEY uk_reservaciones_agencia_codigo (
        agencia_id,
        codigo
    ),


    /* =====================================================
       ÍNDICES
    ===================================================== */

    KEY idx_reservaciones_agencia (
        agencia_id
    ),


    KEY idx_reservaciones_modelo (
        modelo_id
    ),


    KEY idx_reservaciones_estado (
        estado
    ),


    KEY idx_reservaciones_fecha_recogida (
        fecha_recogida
    ),


    KEY idx_reservaciones_fecha_entrega (
        fecha_entrega
    ),


    KEY idx_reservaciones_sucursal_recogida (
        sucursal_recogida_id
    ),


    KEY idx_reservaciones_sucursal_entrega (
        sucursal_entrega_id
    ),


    KEY idx_reservaciones_creado_por (
        creado_por_usuario_id
    ),


    /*
     * Este índice será especialmente útil en la próxima
     * fase para buscar reservas de un modelo dentro de
     * una agencia y un período determinado.
     */

    KEY idx_reservaciones_disponibilidad (
        agencia_id,
        modelo_id,
        estado,
        fecha_recogida,
        fecha_entrega
    ),


    /* =====================================================
       CLAVES FORÁNEAS
    ===================================================== */

    CONSTRAINT fk_reservaciones_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias (
            id
        )

        ON UPDATE CASCADE,


    CONSTRAINT fk_reservaciones_modelo

        FOREIGN KEY (
            modelo_id
        )

        REFERENCES modelos_vehiculos (
            id
        )

        ON UPDATE CASCADE,


    CONSTRAINT fk_reservaciones_sucursal_recogida

        FOREIGN KEY (
            sucursal_recogida_id
        )

        REFERENCES sucursales (
            id
        )

        ON UPDATE CASCADE,


    CONSTRAINT fk_reservaciones_sucursal_entrega

        FOREIGN KEY (
            sucursal_entrega_id
        )

        REFERENCES sucursales (
            id
        )

        ON UPDATE CASCADE,


    CONSTRAINT fk_reservaciones_creado_por

        FOREIGN KEY (
            creado_por_usuario_id
        )

        REFERENCES usuarios (
            id
        )

        ON UPDATE CASCADE
        ON DELETE SET NULL,


    /* =====================================================
       VALIDACIONES DE BASE DE DATOS
    ===================================================== */

    CONSTRAINT chk_reservaciones_cantidad

        CHECK (
            cantidad_vehiculos > 0
        ),


    CONSTRAINT chk_reservaciones_periodo

        CHECK (

            fecha_entrega >
                fecha_recogida

            OR (

                fecha_entrega =
                    fecha_recogida

                AND hora_entrega >
                    hora_recogida

            )

        ),


    CONSTRAINT chk_reservaciones_precio

        CHECK (
            precio_diario >= 0
        ),


    CONSTRAINT chk_reservaciones_subtotal

        CHECK (
            subtotal >= 0
        ),


    CONSTRAINT chk_reservaciones_adicionales

        CHECK (
            costo_adicionales >= 0
        ),


    CONSTRAINT chk_reservaciones_descuento

        CHECK (
            descuento >= 0
        ),


    CONSTRAINT chk_reservaciones_total

        CHECK (
            total >= 0
        )


)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;



/* =========================================================
   TABLA: reservacion_vehiculos

   Relaciona una reservación con las unidades físicas que
   finalmente fueron asignadas.

   Una reserva puede solicitar, por ejemplo, 3 Corolla y
   terminar vinculada a tres unidades físicas diferentes.
========================================================= */

CREATE TABLE IF NOT EXISTS reservacion_vehiculos (

    id
        INT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,


    reservacion_id
        INT UNSIGNED
        NOT NULL,


    vehiculo_id
        INT UNSIGNED
        NOT NULL,


    estado
        ENUM(
            'asignado',
            'liberado'
        )
        NOT NULL
        DEFAULT 'asignado',


    fecha_asignacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion
        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    /* =====================================================
       CLAVE PRIMARIA
    ===================================================== */

    PRIMARY KEY (
        id
    ),


    /* =====================================================
       EVITAR DUPLICAR UNA UNIDAD EN LA MISMA RESERVA
    ===================================================== */

    UNIQUE KEY uk_reservacion_vehiculo (
        reservacion_id,
        vehiculo_id
    ),


    /* =====================================================
       ÍNDICES
    ===================================================== */

    KEY idx_reservacion_vehiculos_reservacion (
        reservacion_id
    ),


    KEY idx_reservacion_vehiculos_vehiculo (
        vehiculo_id
    ),


    KEY idx_reservacion_vehiculos_estado (
        estado
    ),


    /* =====================================================
       CLAVES FORÁNEAS
    ===================================================== */

    CONSTRAINT fk_reservacion_vehiculos_reservacion

        FOREIGN KEY (
            reservacion_id
        )

        REFERENCES reservaciones (
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT fk_reservacion_vehiculos_vehiculo

        FOREIGN KEY (
            vehiculo_id
        )

        REFERENCES vehiculos (
            id
        )

        ON UPDATE CASCADE


)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;