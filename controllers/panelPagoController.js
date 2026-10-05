const {
    confirmarPagoReservacion,
    rechazarPagoReservacion
} = require(
    "../services/validacionPagoService"
);

const {
    enviarCorreoPagoConfirmado
} = require(
    "../services/correoReservacionService"
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

         /* -------------------------------------------------
   CORREO DE PAGO CONFIRMADO

   El pago ya fue confirmado en BD.
   Un fallo de correo no afecta la operación.
------------------------------------------------- */

try {

    await enviarCorreoPagoConfirmado({

        agenciaId,

        reservacionId:
            resultado.reservacion.id,

        pagoId

    });


} catch (
    errorCorreo
) {

    console.error(
        "No fue posible enviar correo de pago confirmado:",
        {
            pagoId,
            reservacionId:
                resultado.reservacion.id,
            mensaje:
                errorCorreo.message
        }
    );

}   

        return res.redirect(
            `/panel/reservaciones/${resultado.reservacion.id}?resultado=pago_confirmado`
        );

    } catch (error) {

        if (
    error.codigo ===
    "RESERVACION_VENCIDA" &&
    Number.isInteger(
        Number(
            error.reservacionId
        )
    )
) {

    return res.redirect(
        `/panel/reservaciones/${error.reservacionId}?error=pago_reservacion_vencida`
    );

}

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

        console.error(
    "Error inesperado confirmando pago desde el panel:",
    error
);


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


        console.error(
    "Error inesperado rechazando pago desde el panel:",
    error
);


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