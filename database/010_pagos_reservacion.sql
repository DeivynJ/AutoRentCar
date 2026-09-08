/* =========================================================
   AUTORENTCAR
   010 - PAGOS DE RESERVACIONES
========================================================= */


/* =========================================================
   TABLA: pagos_reservacion

   Registra los pagos enviados o registrados para una
   reservación.

   Flujo inicial:

   cliente envía comprobante
            ↓
   pendiente_validacion
            ↓
   agencia confirma o rechaza
========================================================= */

CREATE TABLE IF NOT EXISTS pagos_reservacion (

    id INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,


    /* -----------------------------------------------------
       TENANT
    ----------------------------------------------------- */

    agencia_id INT UNSIGNED
        NOT NULL,


    /* -----------------------------------------------------
       RESERVACIÓN
    ----------------------------------------------------- */

    reservacion_id INT UNSIGNED
        NOT NULL,


    /* -----------------------------------------------------
       MÉTODO UTILIZADO

       metodo_pago_id identifica el método configurado
       actualmente.

       Los campos snapshot conservan cómo era el método
       cuando se realizó el pago.
    ----------------------------------------------------- */

    metodo_pago_id INT UNSIGNED
        DEFAULT NULL,


    metodo_codigo VARCHAR(80)
        NOT NULL,


    metodo_nombre VARCHAR(150)
        NOT NULL,


    metodo_tipo ENUM(
        'transferencia',
        'deposito',
        'efectivo',
        'otro'
    )
        NOT NULL,


    /* -----------------------------------------------------
       INFORMACIÓN ECONÓMICA
    ----------------------------------------------------- */

    monto DECIMAL(12,2)
        NOT NULL,


    moneda CHAR(3)
        NOT NULL
        DEFAULT 'USD',


    /* -----------------------------------------------------
       DATOS DECLARADOS DEL PAGO
    ----------------------------------------------------- */

    referencia VARCHAR(150)
        DEFAULT NULL,


    fecha_pago DATETIME
        DEFAULT NULL,


    /* -----------------------------------------------------
       COMPROBANTE

       IMPORTANTE:

       comprobante_ruta será una ubicación privada del
       servidor.

       Los comprobantes NO deben almacenarse dentro de
       /img ni exponerse como archivos estáticos públicos.
    ----------------------------------------------------- */

    comprobante_ruta VARCHAR(500)
        DEFAULT NULL,


    comprobante_nombre_original VARCHAR(255)
        DEFAULT NULL,


    comprobante_mime VARCHAR(120)
        DEFAULT NULL,


    comprobante_tamano INT UNSIGNED
        DEFAULT NULL,


    /* -----------------------------------------------------
       ORIGEN

       cliente:
       comprobante enviado desde el portal del cliente.

       panel:
       pago registrado manualmente por la agencia.

       pasarela:
       reservado para integraciones automáticas futuras.
    ----------------------------------------------------- */

    origen ENUM(
        'cliente',
        'panel',
        'pasarela'
    )
        NOT NULL
        DEFAULT 'cliente',


    /* -----------------------------------------------------
       ESTADO DEL PAGO
    ----------------------------------------------------- */

    estado ENUM(
        'pendiente_validacion',
        'confirmado',
        'rechazado',
        'anulado'
    )
        NOT NULL
        DEFAULT 'pendiente_validacion',


    /* -----------------------------------------------------
       VALIDACIÓN POR LA AGENCIA
    ----------------------------------------------------- */

    validado_por_usuario_id INT UNSIGNED
        DEFAULT NULL,


    fecha_validacion DATETIME
        DEFAULT NULL,


    motivo_rechazo TEXT
        DEFAULT NULL,


    /* -----------------------------------------------------
       AUDITORÍA
    ----------------------------------------------------- */

    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    /* =====================================================
       CLAVES FORÁNEAS
    ===================================================== */

    CONSTRAINT fk_pagos_reservacion_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias (
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_pagos_reservacion_reservacion

        FOREIGN KEY (
            reservacion_id
        )

        REFERENCES reservaciones (
            id
        )

        ON UPDATE CASCADE
        ON DELETE RESTRICT,


    CONSTRAINT fk_pagos_reservacion_metodo

        FOREIGN KEY (
            metodo_pago_id
        )

        REFERENCES metodos_pago_agencia (
            id
        )

        ON UPDATE CASCADE
        ON DELETE SET NULL,


    CONSTRAINT fk_pagos_reservacion_validador

        FOREIGN KEY (
            validado_por_usuario_id
        )

        REFERENCES usuarios (
            id
        )

        ON UPDATE CASCADE
        ON DELETE SET NULL,


    /* =====================================================
       VALIDACIONES
    ===================================================== */

    CONSTRAINT chk_pagos_reservacion_monto

        CHECK (
            monto > 0
        ),


    /* =====================================================
       ÍNDICES
    ===================================================== */

    INDEX idx_pagos_reservacion_agencia_estado (

        agencia_id,
        estado

    ),


    INDEX idx_pagos_reservacion_reserva_estado (

        reservacion_id,
        estado

    ),


    INDEX idx_pagos_reservacion_metodo (

        metodo_pago_id

    ),


    INDEX idx_pagos_reservacion_fecha (

        fecha_creacion

    )

)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;