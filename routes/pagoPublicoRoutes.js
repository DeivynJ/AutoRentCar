const express =
    require(
        "express"
    );


const {
    mostrarPagoPublico,
    registrarComprobantePagoPublico
} = require(
    "../controllers/pagoPublicoController"
);

const {
    requerirTokenPagoValido
} = require(
    "../middleware/pagoPublicoMiddleware"
);


const {
    subirComprobantePago
} = require(
    "../middleware/uploadComprobantePagoMiddleware"
);


const router =
    express.Router();


/* =========================================================
   PÁGINA PÚBLICA DE PAGO
========================================================= */

/*
 * El token funciona como credencial temporal.
 *
 * No se utiliza:
 * - reservacionId;
 * - agenciaId;
 * - código de reservación;
 *
 * para autorizar el acceso.
 */

router.get(
    "/pago/:token",
    mostrarPagoPublico
);

/* =========================================================
   ENVIAR COMPROBANTE DE PAGO
========================================================= */

router.post(
    "/pago/:token/comprobante",

    requerirTokenPagoValido,

    subirComprobantePago,

    registrarComprobantePagoPublico
);

/* =========================================================
   EXPORTACIÓN
========================================================= */

module.exports =
    router;