/* =========================================================
   AUTORENTCAR
   008 - POLÍTICA DE PAGOS Y ANTICIPOS
========================================================= */


/* =========================================================
   NUEVO ESTADO DE RESERVACIÓN

   pendiente
       ↓
   pendiente_pago
       ↓
   confirmada
========================================================= */

ALTER TABLE reservaciones

MODIFY COLUMN estado

ENUM(
    'pendiente',
    'pendiente_pago',
    'confirmada',
    'en_curso',
    'finalizada',
    'rechazada',
    'cancelada'
)

NOT NULL
DEFAULT 'pendiente';


/* =========================================================
   SNAPSHOT DE LA POLÍTICA APLICADA A LA RESERVACIÓN

   Estos valores se guardarán cuando la agencia apruebe
   la solicitud.

   No dependeremos posteriormente de que la agencia
   cambie su configuración.
========================================================= */

ALTER TABLE reservaciones

ADD COLUMN IF NOT EXISTS tipo_anticipo_aplicado

ENUM(
    'sin_anticipo',
    'porcentaje',
    'monto_fijo',
    'pago_completo'
)

NULL

AFTER total;


ALTER TABLE reservaciones

ADD COLUMN IF NOT EXISTS valor_anticipo_aplicado

DECIMAL(12,2)

NULL

AFTER tipo_anticipo_aplicado;


ALTER TABLE reservaciones

ADD COLUMN IF NOT EXISTS monto_anticipo_requerido

DECIMAL(12,2)

NOT NULL
DEFAULT 0.00

AFTER valor_anticipo_aplicado;


ALTER TABLE reservaciones

ADD COLUMN IF NOT EXISTS fecha_limite_pago

DATETIME

NULL

AFTER monto_anticipo_requerido;


/* =========================================================
   CONFIGURACIÓN DE PAGO POR AGENCIA
========================================================= */

CREATE TABLE IF NOT EXISTS configuracion_pagos_agencia (

    id INT UNSIGNED
        AUTO_INCREMENT
        PRIMARY KEY,


    agencia_id INT UNSIGNED
        NOT NULL,


    /* -----------------------------------------------------
       TIPOS

       sin_anticipo:
       La agencia puede confirmar sin pago inicial.

       porcentaje:
       Ejemplo: 50 %.

       monto_fijo:
       Ejemplo: US$100.

       pago_completo:
       Requiere el 100 %.
    ----------------------------------------------------- */

    tipo_anticipo ENUM(
        'sin_anticipo',
        'porcentaje',
        'monto_fijo',
        'pago_completo'
    )
        NOT NULL
        DEFAULT 'sin_anticipo',


    /*
     * porcentaje:
     * 50.00 significa 50 %
     *
     * monto_fijo:
     * 100.00 significa US$100
     *
     * sin_anticipo:
     * 0.00
     *
     * pago_completo:
     * 100.00
     */

    valor_anticipo DECIMAL(12,2)
        NOT NULL
        DEFAULT 0.00,


    /*
     * Tiempo disponible para completar el pago
     * después de aprobar la reservación.
     *
     * Inicialmente:
     * 24 horas.
     */

    horas_limite_pago SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 24,


    activo TINYINT(1)
        NOT NULL
        DEFAULT 1,


    fecha_creacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    fecha_actualizacion TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT uq_configuracion_pagos_agencia

        UNIQUE (
            agencia_id
        ),


    CONSTRAINT fk_configuracion_pagos_agencia

        FOREIGN KEY (
            agencia_id
        )

        REFERENCES agencias(
            id
        )

        ON UPDATE CASCADE
        ON DELETE CASCADE,


    CONSTRAINT chk_configuracion_tipo_anticipo

        CHECK (

            (
                tipo_anticipo =
                    'sin_anticipo'

                AND

                valor_anticipo =
                    0
            )

            OR

            (
                tipo_anticipo =
                    'porcentaje'

                AND

                valor_anticipo >
                    0

                AND

                valor_anticipo <=
                    100
            )

            OR

            (
                tipo_anticipo =
                    'monto_fijo'

                AND

                valor_anticipo >
                    0
            )

            OR

            (
                tipo_anticipo =
                    'pago_completo'

                AND

                valor_anticipo =
                    100
            )

        ),


    CONSTRAINT chk_configuracion_horas_pago

        CHECK (

            horas_limite_pago >
                0

        )

);


/* =========================================================
   CREAR CONFIGURACIÓN INICIAL PARA AGENCIAS EXISTENTES

   IMPORTANTE:
   Por seguridad mantenemos inicialmente:
   sin_anticipo

   Todavía no cambiaremos el comportamiento actual
   de ninguna agencia hasta configurar explícitamente
   su política.
========================================================= */

INSERT INTO configuracion_pagos_agencia (

    agencia_id,

    tipo_anticipo,

    valor_anticipo,

    horas_limite_pago,

    activo

)

SELECT

    a.id,

    'sin_anticipo',

    0.00,

    24,

    1

FROM agencias a

LEFT JOIN configuracion_pagos_agencia c

    ON c.agencia_id =
        a.id

WHERE
    c.id IS NULL;