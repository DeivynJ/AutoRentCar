const {
    validarTokenPagoReservacion
} = require(
    "../services/tokenPagoReservacionService"
);


/* =========================================================
   VALIDAR ACCESO PÚBLICO DE PAGO
========================================================= */

/*
 * Este middleware se utilizará antes de procesar
 * cualquier comprobante.
 *
 * El token debe comprobarse ANTES de Multer para evitar
 * recibir archivos desde enlaces inválidos, revocados
 * o vencidos.
 */

async function requerirTokenPagoValido(
    req,
    res,
    next
) {

    const token =
        String(
            req.params.token ||
            ""
        ).trim();


    try {

        const acceso =
            await validarTokenPagoReservacion(
                token
            );


        /*
         * Guardamos únicamente en la petición actual
         * el contexto obtenido por el servidor.
         *
         * El navegador no decide:
         *
         * agencia_id
         * reservacion_id
         */

        req.accesoPagoPublico =
            acceso;


        req.tokenPagoPublico =
            token;


        return next();

    } catch (error) {


        if (
            error.codigo ===
            "ENLACE_PAGO_INVALIDO"
        ) {

            return res
                .status(404)
                .send(
                    "El enlace de pago no es válido o ya no se encuentra disponible."
                );

        }


        console.error(
            "Error validando acceso público de pago:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible validar el enlace de pago."
            );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    requerirTokenPagoValido

};