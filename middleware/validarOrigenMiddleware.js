/* =========================================================
   AUTORENTCAR - VALIDACIÓN DE ORIGEN
========================================================= */

const METODOS_SEGUROS =
    new Set([
        "GET",
        "HEAD",
        "OPTIONS"
    ]);


/* =========================================================
   NORMALIZAR ORIGEN
========================================================= */

function normalizarOrigen(
    valor
) {

    if (!valor) {

        return null;

    }


    try {

        const url =
            new URL(
                String(valor)
                    .trim()
            );


        return url.origin;


    } catch {

        return null;

    }

}


/* =========================================================
   OBTENER ORÍGENES PERMITIDOS
========================================================= */

function obtenerOrigenesPermitidos() {

    const origenes =
        new Set();


    const appUrl =
        normalizarOrigen(
            process.env.APP_URL
        );


    const publicUrl =
        normalizarOrigen(
            process.env.PUBLIC_URL
        );


    if (appUrl) {

        origenes.add(
            appUrl
        );

    }


    if (publicUrl) {

        origenes.add(
            publicUrl
        );

    }


    if (
        process.env.NODE_ENV !==
        "production"
    ) {

        const puerto =
            Number(
                process.env.PORT
            ) || 3000;


        origenes.add(
            `http://localhost:${puerto}`
        );


        origenes.add(
            `http://127.0.0.1:${puerto}`
        );

    }


    return origenes;

}


/* =========================================================
   VALIDAR ORIGEN
========================================================= */

function validarOrigenMismaAplicacion(
    req,
    res,
    next
) {

    if (
        METODOS_SEGUROS.has(
            req.method
        )
    ) {

        return next();

    }


    const origenesPermitidos =
        obtenerOrigenesPermitidos();


    const origin =
        req.get(
            "origin"
        );


    let origenSolicitud =
        normalizarOrigen(
            origin
        );


    /*
     * Si Origin no está disponible,
     * utilizamos Referer como respaldo.
     */

    if (!origenSolicitud) {

        const referer =
            req.get(
                "referer"
            );


        origenSolicitud =
            normalizarOrigen(
                referer
            );

    }


    if (
        !origenSolicitud ||
        !origenesPermitidos.has(
            origenSolicitud
        )
    ) {

        return res
            .status(403)
            .send(
                "La solicitud fue rechazada por seguridad."
            );

    }


    return next();

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    validarOrigenMismaAplicacion

};