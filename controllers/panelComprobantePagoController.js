/* =========================================================
   AUTORENTCAR
   CONTROLADOR DE COMPROBANTES DE PAGO DEL PANEL
========================================================= */

const {
    obtenerComprobantePagoVerificado
} = require(
    "../services/comprobantePagoPanelService"
);


/* =========================================================
   VER COMPROBANTE DE PAGO
========================================================= */

async function verComprobantePago(
    req,
    res
) {

    /*
     * La agencia NUNCA se toma del navegador.
     *
     * req.agencia fue establecida por el contexto
     * autenticado del panel.
     */

    const agenciaId =
        req.agencia?.id;


    const pagoId =
        req.params.pagoId;


    try {

        const comprobante =
            await obtenerComprobantePagoVerificado(
                agenciaId,
                pagoId
            );


        /* -------------------------------------------------
           NOMBRE SEGURO PARA LA RESPUESTA

           No utilizamos el nombre original enviado por
           el cliente dentro de Content-Disposition.
        ------------------------------------------------- */

        const nombreSeguro =
            `comprobante-pago-${
                comprobante.pago.id
            }${
                comprobante.archivo.extension
            }`;


        /* -------------------------------------------------
           CABECERAS DE SEGURIDAD
        ------------------------------------------------- */

        res.setHeader(
            "Content-Type",
            comprobante.archivo.mime
        );


        res.setHeader(
            "Content-Length",
            String(
                comprobante.archivo.tamano
            )
        );


        /*
         * inline permite visualizar directamente:
         *
         * - imágenes;
         * - PDF.
         *
         * Sin convertir storage/comprobantes en
         * una carpeta pública.
         */

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${nombreSeguro}"`
        );


        res.setHeader(
            "Cache-Control",
            "no-store, private, max-age=0"
        );


        res.setHeader(
            "Pragma",
            "no-cache"
        );


        res.setHeader(
            "Expires",
            "0"
        );


        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );


        res.setHeader(
            "Referrer-Policy",
            "no-referrer"
        );


        res.setHeader(
            "X-Robots-Tag",
            "noindex, noarchive, nosnippet"
        );


        /*
         * Enviamos únicamente el buffer que ya pasó
         * todas las verificaciones:
         *
         * - misma agencia;
         * - ruta privada;
         * - MIME;
         * - tamaño;
         * - SHA-256.
         */

        return res.send(
            comprobante.archivo.buffer
        );


    } catch (error) {


        /* -------------------------------------------------
           NO ENCONTRADO
        ------------------------------------------------- */

        if (
            [
                "PAGO_NO_ENCONTRADO",
                "COMPROBANTE_NO_DISPONIBLE",
                "COMPROBANTE_NO_ENCONTRADO"
            ].includes(
                error.codigo
            )
        ) {

            return res
                .status(404)
                .send(
                    "El comprobante no se encuentra disponible."
                );

        }


        /* -------------------------------------------------
           INTEGRIDAD

           No mostramos el archivo si algo cambió.
        ------------------------------------------------- */

        if (
            [
                "INTEGRIDAD_NO_DISPONIBLE",
                "INTEGRIDAD_COMPROBANTE_INVALIDA",
                "COMPROBANTE_TIPO_INVALIDO",
                "COMPROBANTE_INVALIDO",
                "RUTA_COMPROBANTE_INVALIDA"
            ].includes(
                error.codigo
            )
        ) {

            console.error(
                "Comprobante bloqueado por verificación de integridad:",
                {
                    agenciaId,
                    pagoId,
                    codigo:
                        error.codigo
                }
            );


            return res
                .status(409)
                .send(
                    "No fue posible mostrar el comprobante porque su integridad no pudo ser verificada."
                );

        }


        console.error(
            "Error mostrando comprobante de pago:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible mostrar el comprobante de pago."
            );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports =
{

    verComprobantePago

};