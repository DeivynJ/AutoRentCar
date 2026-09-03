/* =========================================================
   AUTORENTCAR
   GESTIÓN DE RESERVACIONES DESDE EL PANEL DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorPanelReservacion(
    codigo,
    mensaje,
    status = 400
) {

    const error =
        new Error(
            mensaje
        );


    error.codigo =
        codigo;


    error.status =
        status;


    return error;

}


/* =========================================================
   VALIDAR ID
========================================================= */

function validarId(
    valor,
    nombre
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        ) ||
        numero <= 0
    ) {

        throw crearErrorPanelReservacion(
            "ID_INVALIDO",
            `${nombre} no es válido.`
        );

    }


    return numero;

}

/* =========================================================
   REDONDEAR MONEDA
========================================================= */

function redondearMoneda(
    valor
) {

    return (
        Math.round(
            (
                Number(
                    valor
                ) +
                Number.EPSILON
            ) *
            100
        ) /
        100
    );

}


/* =========================================================
   CAMBIAR ESTADO DE RESERVACIÓN
========================================================= */

async function cambiarEstadoReservacionPanel({

    agenciaId,

    reservacionId,

    nuevoEstado

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    const estadoSolicitado =
        String(
            nuevoEstado ||
            ""
        )
            .trim()
            .toLowerCase();


    /*
     * Desde el controlador seguimos solicitando:
     *
     * confirmada = aprobar
     * rechazada  = rechazar
     *
     * Pero la aprobación puede terminar realmente en:
     *
     * pendiente_pago
     * o
     * confirmada
     *
     * dependiendo de la política de la agencia.
     */

    const accionesPermitidas =
        [
            "confirmada",
            "rechazada"
        ];


    if (
        !accionesPermitidas.includes(
            estadoSolicitado
        )
    ) {

        throw crearErrorPanelReservacion(
            "ESTADO_NO_PERMITIDO",
            "El estado solicitado no está permitido."
        );

    }


    let conexion;

    let transaccionIniciada =
        false;


    try {

        conexion =
            await pool.getConnection();


        await conexion
            .beginTransaction();


        transaccionIniciada =
            true;


        /* =================================================
           BLOQUEAR RESERVACIÓN
        ================================================= */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    codigo,
                    agencia_id,
                    modelo_id,
                    cantidad_vehiculos,

                    total,

                    estado

                FROM reservaciones

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorPanelReservacion(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no existe.",
                404
            );

        }


        const reservacion =
            reservaciones[0];


        if (
            reservacion.estado !==
            "pendiente"
        ) {

            throw crearErrorPanelReservacion(
                "RESERVACION_NO_PENDIENTE",
                `La reservación ya se encuentra en estado ${reservacion.estado}.`,
                409
            );

        }


        /* =================================================
           RECHAZAR
        ================================================= */

        if (
            estadoSolicitado ===
            "rechazada"
        ) {

            const resultado =
                await conexion.query(
                    `
                    UPDATE reservaciones

                    SET
                        estado = 'rechazada'

                    WHERE
                        id = ?

                        AND agencia_id = ?

                        AND estado = 'pendiente'
                    `,
                    [
                        reservacionIdSeguro,
                        agenciaIdSeguro
                    ]
                );


            if (
                Number(
                    resultado.affectedRows
                ) !== 1
            ) {

                throw crearErrorPanelReservacion(
                    "CAMBIO_ESTADO_NO_REALIZADO",
                    "No fue posible rechazar la reservación.",
                    409
                );

            }


            await conexion
                .commit();


            transaccionIniciada =
                false;


            return {

                id:
                    reservacionIdSeguro,

                codigo:
                    reservacion.codigo,

                agenciaId:
                    agenciaIdSeguro,

                estadoAnterior:
                    "pendiente",

                estado:
                    "rechazada",

                requierePago:
                    false,

                tipoAnticipo:
                    null,

                valorAnticipo:
                    0,

                montoAnticipoRequerido:
                    0,

                fechaLimitePago:
                    null

            };

        }


        /* =================================================
           APROBAR

           Consultar política propia de la agencia.
        ================================================= */

        const configuraciones =
            await conexion.query(
                `
                SELECT

                    tipo_anticipo,

                    valor_anticipo,

                    horas_limite_pago,

                    activo

                FROM configuracion_pagos_agencia

                WHERE
                    agencia_id = ?

                LIMIT 1
                `,
                [
                    agenciaIdSeguro
                ]
            );


        /*
         * Si por alguna razón una agencia futura todavía
         * no tuviera configuración, conservamos el
         * comportamiento seguro predeterminado:
         * sin anticipo.
         */

        const configuracion =
            configuraciones[0] ||
            {

                tipo_anticipo:
                    "sin_anticipo",

                valor_anticipo:
                    0,

                horas_limite_pago:
                    24,

                activo:
                    1

            };


        let tipoAnticipo =
            "sin_anticipo";


        let valorAnticipo =
            0;


        let horasLimitePago =
            Number(
                configuracion.horas_limite_pago ||
                24
            );


        if (
            !Number.isInteger(
                horasLimitePago
            ) ||
            horasLimitePago <= 0
        ) {

            horasLimitePago =
                24;

        }


        if (
            Number(
                configuracion.activo
            ) === 1
        ) {

            tipoAnticipo =
                String(
                    configuracion.tipo_anticipo ||
                    "sin_anticipo"
                );


            valorAnticipo =
                Number(
                    configuracion.valor_anticipo ||
                    0
                );

        }


        const totalReservacion =
            redondearMoneda(
                reservacion.total
            );


        let montoAnticipoRequerido =
            0;


        /* -------------------------------------------------
           PORCENTAJE
        ------------------------------------------------- */

        if (
            tipoAnticipo ===
            "porcentaje"
        ) {

            montoAnticipoRequerido =
                redondearMoneda(
                    totalReservacion *
                    (
                        valorAnticipo /
                        100
                    )
                );

        }


        /* -------------------------------------------------
           MONTO FIJO
        ------------------------------------------------- */

        if (
            tipoAnticipo ===
            "monto_fijo"
        ) {

            montoAnticipoRequerido =
                redondearMoneda(
                    Math.min(
                        totalReservacion,
                        valorAnticipo
                    )
                );

        }


        /* -------------------------------------------------
           PAGO COMPLETO
        ------------------------------------------------- */

        if (
            tipoAnticipo ===
            "pago_completo"
        ) {

            valorAnticipo =
                100;


            montoAnticipoRequerido =
                totalReservacion;

        }


        /* -------------------------------------------------
           SIN ANTICIPO
        ------------------------------------------------- */

        if (
            tipoAnticipo ===
            "sin_anticipo"
        ) {

            valorAnticipo =
                0;


            montoAnticipoRequerido =
                0;

        }


        montoAnticipoRequerido =
            redondearMoneda(
                Math.max(
                    0,
                    Math.min(
                        totalReservacion,
                        montoAnticipoRequerido
                    )
                )
            );


        /* =================================================
           ESTADO RESULTANTE
        ================================================= */

        const requierePago =
            montoAnticipoRequerido >
            0;


        const estadoFinal =
            requierePago
                ? "pendiente_pago"
                : "confirmada";


        /* =================================================
           GUARDAR SNAPSHOT DE POLÍTICA
        ================================================= */

        const resultado =
            await conexion.query(
                `
                UPDATE reservaciones

                SET

                    estado = ?,

                    tipo_anticipo_aplicado = ?,

                    valor_anticipo_aplicado = ?,

                    monto_anticipo_requerido = ?,

                    fecha_limite_pago =

                        CASE

                            WHEN ? > 0

                            THEN TIMESTAMPADD(
                                HOUR,
                                ?,
                                NOW()
                            )

                            ELSE NULL

                        END

                WHERE
                    id = ?

                    AND agencia_id = ?

                    AND estado = 'pendiente'
                `,
                [

                    estadoFinal,

                    tipoAnticipo,

                    redondearMoneda(
                        valorAnticipo
                    ),

                    montoAnticipoRequerido,

                    montoAnticipoRequerido,

                    horasLimitePago,

                    reservacionIdSeguro,

                    agenciaIdSeguro

                ]
            );


        if (
            Number(
                resultado.affectedRows
            ) !== 1
        ) {

            throw crearErrorPanelReservacion(
                "CAMBIO_ESTADO_NO_REALIZADO",
                "No fue posible aprobar la reservación.",
                409
            );

        }


        /* =================================================
           LEER RESULTADO DEFINITIVO
        ================================================= */

        const filasActualizadas =
            await conexion.query(
                `
                SELECT

                    estado,

                    tipo_anticipo_aplicado,

                    valor_anticipo_aplicado,

                    monto_anticipo_requerido,

                    fecha_limite_pago

                FROM reservaciones

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        const reservacionActualizada =
            filasActualizadas[0];


        await conexion
            .commit();


        transaccionIniciada =
            false;


        return {

            id:
                reservacionIdSeguro,

            codigo:
                reservacion.codigo,

            agenciaId:
                agenciaIdSeguro,

            estadoAnterior:
                "pendiente",

            estado:
                reservacionActualizada.estado,

            requierePago,

            tipoAnticipo:
                reservacionActualizada
                    .tipo_anticipo_aplicado,

            valorAnticipo:
                Number(
                    reservacionActualizada
                        .valor_anticipo_aplicado ||
                    0
                ),

            montoAnticipoRequerido:
                Number(
                    reservacionActualizada
                        .monto_anticipo_requerido ||
                    0
                ),

            horasLimitePago,

            fechaLimitePago:
                reservacionActualizada
                    .fecha_limite_pago

        };


    } catch (error) {

        if (
            conexion &&
            transaccionIniciada
        ) {

            try {

                await conexion
                    .rollback();

            } catch (errorRollback) {

                console.error(
                    "Error haciendo rollback del cambio de estado de reservación:",
                    errorRollback
                );

            }

        }


        throw error;


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    cambiarEstadoReservacionPanel

};