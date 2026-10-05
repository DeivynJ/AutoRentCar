/* =========================================================
   AUTORENTCAR
   CONFIGURACIÓN DE PAGOS Y ANTICIPOS POR AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   VALIDACIONES
========================================================= */

function normalizarId(
    valor
) {

    const id =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <= 0
    ) {

        throw new Error(
            "AGENCIA_ID_INVALIDO"
        );

    }


    return id;

}


function normalizarTipoAnticipo(
    valor
) {

    const tipo =
        String(
            valor ||
            ""
        )
            .trim()
            .toLowerCase();


    const tiposPermitidos = [

        "sin_anticipo",
        "porcentaje",
        "monto_fijo",
        "pago_completo"

    ];


    if (
        !tiposPermitidos.includes(
            tipo
        )
    ) {

        throw new Error(
            "TIPO_ANTICIPO_INVALIDO"
        );

    }


    return tipo;

}


function normalizarConfiguracion({

    tipoAnticipo,
    valorAnticipo,
    horasLimitePago,
    activo

}) {

    const tipo =
        normalizarTipoAnticipo(
            tipoAnticipo
        );


    let valor =
        Number(
            valorAnticipo
        );


    const horas =
        Number(
            horasLimitePago
        );


    if (
        !Number.isInteger(
            horas
        ) ||
        horas <= 0 ||
        horas > 65535
    ) {

        throw new Error(
            "HORAS_LIMITE_PAGO_INVALIDAS"
        );

    }


    /*
     * SIN ANTICIPO
     *
     * El valor siempre debe ser 0.
     */

    if (
        tipo ===
        "sin_anticipo"
    ) {

        valor =
            0;

    }


    /*
     * PAGO COMPLETO
     *
     * El valor siempre representa 100 %.
     */

    if (
        tipo ===
        "pago_completo"
    ) {

        valor =
            100;

    }


    /*
     * PORCENTAJE
     */

    if (
        tipo ===
        "porcentaje" &&
        (
            !Number.isFinite(
                valor
            ) ||
            valor <= 0 ||
            valor > 100
        )
    ) {

        throw new Error(
            "PORCENTAJE_ANTICIPO_INVALIDO"
        );

    }


    /*
     * MONTO FIJO
     */

    if (
        tipo ===
        "monto_fijo" &&
        (
            !Number.isFinite(
                valor
            ) ||
            valor <= 0
        )
    ) {

        throw new Error(
            "MONTO_ANTICIPO_INVALIDO"
        );

    }


    return {

        tipoAnticipo:
            tipo,

        valorAnticipo:
            valor,

        horasLimitePago:
            horas,

        activo:
            activo === true ||
            activo === 1 ||
            activo === "1" ||
            activo === "true" ||
            activo === "on"

    };

}


/* =========================================================
   OBTENER CONFIGURACIÓN
========================================================= */

async function obtenerConfiguracionPagosAgencia(
    agenciaId
) {

    const idAgencia =
        normalizarId(
            agenciaId
        );


    const conexion =
        await pool.getConnection();


    try {

        const filas =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,

                    tipo_anticipo,
                    valor_anticipo,
                    horas_limite_pago,
                    activo,

                    fecha_creacion,
                    fecha_actualizacion

                FROM configuracion_pagos_agencia

                WHERE agencia_id = ?

                LIMIT 1
                `,
                [
                    idAgencia
                ]
            );


        /*
         * Si en el futuro existe una agencia nueva
         * que todavía no tenga fila registrada,
         * mantenemos el comportamiento seguro actual:
         * sin anticipo.
         */

        if (
            filas.length === 0
        ) {

            return {

                id:
                    null,

                agenciaId:
                    idAgencia,

                tipoAnticipo:
                    "sin_anticipo",

                valorAnticipo:
                    0,

                horasLimitePago:
                    24,

                activo:
                    true,

                fechaCreacion:
                    null,

                fechaActualizacion:
                    null

            };

        }


        const configuracion =
            filas[0];


        return {

            id:
                configuracion.id,

            agenciaId:
                configuracion.agencia_id,

            tipoAnticipo:
                configuracion.tipo_anticipo,

            valorAnticipo:
                Number(
                    configuracion.valor_anticipo ||
                    0
                ),

            horasLimitePago:
                Number(
                    configuracion.horas_limite_pago ||
                    24
                ),

            activo:
                Number(
                    configuracion.activo
                ) === 1,

            fechaCreacion:
                configuracion.fecha_creacion,

            fechaActualizacion:
                configuracion.fecha_actualizacion

        };


    } finally {

        conexion.release();

    }

}


/* =========================================================
   GUARDAR / ACTUALIZAR CONFIGURACIÓN
========================================================= */

async function guardarConfiguracionPagosAgencia({

    agenciaId,

    tipoAnticipo,
    valorAnticipo,
    horasLimitePago,
    activo

}) {

    const idAgencia =
        normalizarId(
            agenciaId
        );


    const configuracion =
        normalizarConfiguracion({

            tipoAnticipo,
            valorAnticipo,
            horasLimitePago,
            activo

        });


    const conexion =
        await pool.getConnection();


    try {

        await conexion.beginTransaction();


        /*
         * Confirmamos que la agencia existe.
         */

        const agencias =
            await conexion.query(
                `
                SELECT id

                FROM agencias

                WHERE id = ?

                LIMIT 1
                `,
                [
                    idAgencia
                ]
            );


        if (
            agencias.length === 0
        ) {

            throw new Error(
                "AGENCIA_NO_ENCONTRADA"
            );

        }


        /*
         * Una sola configuración por agencia.
         *
         * La tabla ya posee UNIQUE(agencia_id),
         * por eso podemos actualizar con
         * ON DUPLICATE KEY UPDATE.
         */

        await conexion.query(
            `
            INSERT INTO configuracion_pagos_agencia
            (
                agencia_id,
                tipo_anticipo,
                valor_anticipo,
                horas_limite_pago,
                activo
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?
            )

            ON DUPLICATE KEY UPDATE

                tipo_anticipo =
                    VALUES(tipo_anticipo),

                valor_anticipo =
                    VALUES(valor_anticipo),

                horas_limite_pago =
                    VALUES(horas_limite_pago),

                activo =
                    VALUES(activo)
            `,
            [

                idAgencia,

                configuracion.tipoAnticipo,

                configuracion.valorAnticipo,

                configuracion.horasLimitePago,

                configuracion.activo
                    ? 1
                    : 0

            ]
        );


        await conexion.commit();


        return {

            guardada:
                true,

            agenciaId:
                idAgencia

        };


    } catch (error) {

        await conexion.rollback();

        throw error;


    } finally {

        conexion.release();

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    obtenerConfiguracionPagosAgencia,

    guardarConfiguracionPagosAgencia

};