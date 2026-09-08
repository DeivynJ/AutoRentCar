const {
    confirmarPagoReservacion,
    rechazarPagoReservacion
} = require(
    "../services/validacionPagoService"
);


/* =========================================================
   CONFIRMAR PAGO DESDE EL PANEL
========================================================= */

async function confirmarPagoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            req.agencia.id;


        const usuarioId =
            req.usuarioAgencia.id;


        const pagoId =
            req.params.pagoId;


        const resultado =
            await confirmarPagoReservacion(
                agenciaId,
                pagoId,
                usuarioId
            );


        return res.redirect(
            `/panel/reservaciones/${resultado.reservacion.id}?resultado=pago_confirmado`
        );

    } catch (error) {

        console.error(
            "Error confirmando pago desde el panel:",
            error
        );


        if (
            [
                "PAGO_NO_ENCONTRADO",
                "PAGO_YA_PROCESADO",
                "RESERVACION_NO_ENCONTRADA",
                "PAGO_EXCEDE_SALDO",
                "USUARIO_NO_AUTORIZADO",
                "USUARIO_INACTIVO",
                "ROL_NO_AUTORIZADO"
            ].includes(
                error.codigo
            )
        ) {

            return res.redirect(
                `/panel/reservaciones?error=${encodeURIComponent(
                    error.codigo
                )}`
            );

        }


        return res.status(
            500
        ).send(
            "No fue posible confirmar el pago."
        );

    }

}


/* =========================================================
   RECHAZAR PAGO DESDE EL PANEL
========================================================= */

async function rechazarPagoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            req.agencia.id;


        const usuarioId =
            req.usuarioAgencia.id;


        const pagoId =
            req.params.pagoId;


        const motivo =
            req.body?.motivo;


        const resultado =
            await rechazarPagoReservacion(
                agenciaId,
                pagoId,
                usuarioId,
                motivo
            );


        return res.redirect(
            `/panel/reservaciones/${resultado.pago.reservacionId}?resultado=pago_rechazado`
        );

    } catch (error) {

        console.error(
            "Error rechazando pago desde el panel:",
            error
        );


        if (
            [
                "PAGO_NO_ENCONTRADO",
                "PAGO_YA_PROCESADO",
                "RESERVACION_NO_ENCONTRADA",
                "MOTIVO_REQUERIDO",
                "MOTIVO_MUY_LARGO",
                "USUARIO_NO_AUTORIZADO",
                "USUARIO_INACTIVO",
                "ROL_NO_AUTORIZADO"
            ].includes(
                error.codigo
            )
        ) {

            return res.redirect(
                `/panel/reservaciones?error=${encodeURIComponent(
                    error.codigo
                )}`
            );

        }


        return res.status(
            500
        ).send(
            "No fue posible rechazar el pago."
        );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    confirmarPagoPanel,
    rechazarPagoPanel

};