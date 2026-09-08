const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERRORES CONTROLADOS
========================================================= */

function crearErrorValidacionPago(
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

        throw crearErrorValidacionPago(
            "ID_INVALIDO",
            `${nombre} no es válido.`,
            400
        );

    }


    return id;

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(
    valor
) {

    if (
        valor === undefined ||
        valor === null
    ) {

        return "";

    }


    return String(
        valor
    ).trim();

}

/* =========================================================
   VALIDAR USUARIO QUE PROCESA EL PAGO
========================================================= */

async function validarUsuarioProcesador(
    conexion,
    agenciaId,
    usuarioId
) {

    const usuarios =
        await conexion.query(
            `
            SELECT

                u.id,
                u.agencia_id,
                u.estado,

                r.nombre AS rol

            FROM usuarios u

            INNER JOIN roles r
                ON r.id = u.rol_id

            WHERE
                u.id = ?
                AND u.agencia_id = ?

            LIMIT 1
            `,
            [
                usuarioId,
                agenciaId
            ]
        );


    if (
        !usuarios.length
    ) {

        throw crearErrorValidacionPago(
            "USUARIO_NO_AUTORIZADO",
            "El usuario no pertenece a esta agencia.",
            403
        );

    }


    const usuario =
        usuarios[0];


    if (
        usuario.estado !==
        "activo"
    ) {

        throw crearErrorValidacionPago(
            "USUARIO_INACTIVO",
            "El usuario se encuentra inactivo.",
            403
        );

    }


    if (
        usuario.rol !==
        "Administrador de agencia"
    ) {

        throw crearErrorValidacionPago(
            "ROL_NO_AUTORIZADO",
            "El usuario no tiene permisos para validar pagos.",
            403
        );

    }


    return usuario;

}


/* =========================================================
   CONFIRMAR PAGO
========================================================= */

async function confirmarPagoReservacion(
    agenciaIdEntrada,
    pagoIdEntrada,
    usuarioIdEntrada
) {

    const agenciaId =
        validarId(
            agenciaIdEntrada,
            "La agencia"
        );


    const pagoId =
        validarId(
            pagoIdEntrada,
            "El pago"
        );


    const usuarioId =
        validarId(
            usuarioIdEntrada,
            "El usuario"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        await conexion.beginTransaction();


/* -------------------------------------------------
   VALIDAR ADMINISTRADOR

   El usuario debe:
   - pertenecer a la misma agencia;
   - estar activo;
   - ser Administrador de agencia.
------------------------------------------------- */

await validarUsuarioProcesador(
    conexion,
    agenciaId,
    usuarioId
);

        /* -------------------------------------------------
           BLOQUEAR PAGO

           El pago debe pertenecer a la misma agencia.
        ------------------------------------------------- */

        const pagos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    reservacion_id,

                    monto,
                    moneda,
                    estado

                FROM pagos_reservacion

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    pagoId,
                    agenciaId
                ]
            );


        if (
            !pagos.length
        ) {

            throw crearErrorValidacionPago(
                "PAGO_NO_ENCONTRADO",
                "El pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        const pago =
            pagos[0];


        if (
            pago.estado !==
            "pendiente_validacion"
        ) {

            throw crearErrorValidacionPago(
                "PAGO_YA_PROCESADO",
                "Este pago ya fue procesado anteriormente.",
                409
            );

        }


        /* -------------------------------------------------
           BLOQUEAR RESERVACIÓN

           También se valida nuevamente la agencia.
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,

                    estado,
                    total,

                    monto_anticipo_requerido

                FROM reservaciones

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    pago.reservacion_id,
                    agenciaId
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorValidacionPago(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación asociada al pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        const reservacion =
            reservaciones[0];


        /* -------------------------------------------------
           TOTAL YA CONFIRMADO

           No contamos el pago actual porque todavía está
           pendiente de validación.
        ------------------------------------------------- */

        const resumenAntes =
            await conexion.query(
                `
                SELECT

                    COALESCE(
                        SUM(monto),
                        0
                    ) AS total_confirmado

                FROM pagos_reservacion

                WHERE
                    reservacion_id = ?
                    AND agencia_id = ?
                    AND estado = 'confirmado'
                `,
                [
                    reservacion.id,
                    agenciaId
                ]
            );


        const totalConfirmadoAntes =
            Number(
                resumenAntes[0]
                    ?.total_confirmado ||
                0
            );


        const montoPago =
            Number(
                pago.monto ||
                0
            );


        const totalReservacion =
            Number(
                reservacion.total ||
                0
            );


        /* -------------------------------------------------
           EVITAR SOBREPAGO CONFIRMADO

           Pueden existir varios comprobantes pendientes.
           Por eso la validación definitiva se vuelve a
           realizar aquí.
        ------------------------------------------------- */

        if (
            totalConfirmadoAntes +
                montoPago >
            totalReservacion
        ) {

            throw crearErrorValidacionPago(
                "PAGO_EXCEDE_SALDO",
                "Este pago no puede confirmarse porque supera el saldo pendiente de la reservación.",
                409
            );

        }


        /* -------------------------------------------------
           CONFIRMAR PAGO
        ------------------------------------------------- */

        await conexion.query(
            `
            UPDATE pagos_reservacion

            SET

                estado =
                    'confirmado',

                validado_por_usuario_id =
                    ?,

                fecha_validacion =
                    NOW(),

                motivo_rechazo =
                    NULL,

                fecha_actualizacion =
                    NOW()

            WHERE
                id = ?
                AND agencia_id = ?
                AND estado = 'pendiente_validacion'
            `,
            [
                usuarioId,
                pagoId,
                agenciaId
            ]
        );


        const totalConfirmado =
            totalConfirmadoAntes +
            montoPago;


        const anticipoRequerido =
            Number(
                reservacion
                    .monto_anticipo_requerido ||
                0
            );


        let reservacionConfirmada =
            false;


        /* -------------------------------------------------
           CONFIRMAR RESERVACIÓN

           Solo ocurre si todavía está pendiente de pago
           y los pagos CONFIRMADOS alcanzan el anticipo.
        ------------------------------------------------- */

        if (
            reservacion.estado ===
                "pendiente_pago" &&
            totalConfirmado >=
                anticipoRequerido
        ) {

            await conexion.query(
                `
                UPDATE reservaciones

                SET
                    estado =
                        'confirmada'

                WHERE
                    id = ?
                    AND agencia_id = ?
                    AND estado = 'pendiente_pago'
                `,
                [
                    reservacion.id,
                    agenciaId
                ]
            );


            reservacionConfirmada =
                true;

        }


        await conexion.commit();


        return {

            ok:
                true,

            pago:
            {

                id:
                    pagoId,

                reservacionId:
                    Number(
                        reservacion.id
                    ),

                monto:
                    montoPago,

                moneda:
                    pago.moneda,

                estado:
                    "confirmado"

            },

            resumen:
            {

                totalReservacion,

                totalConfirmado,

                saldoPendiente:
                    Math.max(
                        0,
                        totalReservacion -
                            totalConfirmado
                    ),

                anticipoRequerido,

                anticipoCompletado:
                    totalConfirmado >=
                    anticipoRequerido

            },

            reservacion:
            {

                id:
                    Number(
                        reservacion.id
                    ),

                codigo:
                    reservacion.codigo,

                estado:
                    reservacionConfirmada
                        ? "confirmada"
                        : reservacion.estado,

                confirmadaPorPago:
                    reservacionConfirmada

            }

        };

    } catch (error) {

        if (
            conexion
        ) {

            try {

                await conexion.rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "Error haciendo rollback al confirmar pago:",
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
   RECHAZAR PAGO
========================================================= */

async function rechazarPagoReservacion(
    agenciaIdEntrada,
    pagoIdEntrada,
    usuarioIdEntrada,
    motivoEntrada
) {

    const agenciaId =
        validarId(
            agenciaIdEntrada,
            "La agencia"
        );


    const pagoId =
        validarId(
            pagoIdEntrada,
            "El pago"
        );


    const usuarioId =
        validarId(
            usuarioIdEntrada,
            "El usuario"
        );


    const motivo =
        normalizarTexto(
            motivoEntrada
        );


    if (
        motivo.length <
        3
    ) {

        throw crearErrorValidacionPago(
            "MOTIVO_REQUERIDO",
            "Debes indicar el motivo por el cual se rechaza el pago.",
            400
        );

    }


    if (
        motivo.length >
        500
    ) {

        throw crearErrorValidacionPago(
            "MOTIVO_MUY_LARGO",
            "El motivo del rechazo no puede superar los 500 caracteres.",
            400
        );

    }


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        await conexion.beginTransaction();

        await validarUsuarioProcesador(
    conexion,
    agenciaId,
    usuarioId
);


        const pagos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    reservacion_id,
                    estado

                FROM pagos_reservacion

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    pagoId,
                    agenciaId
                ]
            );


        if (
            !pagos.length
        ) {

            throw crearErrorValidacionPago(
                "PAGO_NO_ENCONTRADO",
                "El pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        const pago =
            pagos[0];


        if (
            pago.estado !==
            "pendiente_validacion"
        ) {

            throw crearErrorValidacionPago(
                "PAGO_YA_PROCESADO",
                "Este pago ya fue procesado anteriormente.",
                409
            );

        }


        /* -------------------------------------------------
           VALIDAR RESERVACIÓN Y TENANT
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT
                    id

                FROM reservaciones

                WHERE
                    id = ?
                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    pago.reservacion_id,
                    agenciaId
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorValidacionPago(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación asociada al pago no existe o no pertenece a esta agencia.",
                404
            );

        }


        /* -------------------------------------------------
           RECHAZAR

           La reservación NO cambia de estado.
        ------------------------------------------------- */

        await conexion.query(
            `
            UPDATE pagos_reservacion

            SET

                estado =
                    'rechazado',

                validado_por_usuario_id =
                    ?,

                fecha_validacion =
                    NOW(),

                motivo_rechazo =
                    ?,

                fecha_actualizacion =
                    NOW()

            WHERE
                id = ?
                AND agencia_id = ?
                AND estado = 'pendiente_validacion'
            `,
            [
                usuarioId,
                motivo,
                pagoId,
                agenciaId
            ]
        );


        await conexion.commit();


        return {

            ok:
                true,

            pago:
            {

                id:
                    pagoId,

                reservacionId:
                    Number(
                        pago.reservacion_id
                    ),

                estado:
                    "rechazado",

                motivo

            }

        };

    } catch (error) {

        if (
            conexion
        ) {

            try {

                await conexion.rollback();

            } catch (
                errorRollback
            ) {

                console.error(
                    "Error haciendo rollback al rechazar pago:",
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

module.exports =
{

    confirmarPagoReservacion,
    rechazarPagoReservacion

};