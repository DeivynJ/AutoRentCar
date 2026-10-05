/* =========================================================
   AUTORENTCAR
   CONFIGURACIÓN DE PAGOS Y ANTICIPOS DEL PANEL DE AGENCIA
========================================================= */

const {

    obtenerConfiguracionPagosAgencia,

    guardarConfiguracionPagosAgencia

} = require(
    "../services/configuracionPagosAgenciaService"
);


/* =========================================================
   OBTENER AGENCIA DEL CONTEXTO AUTENTICADO
========================================================= */

function obtenerAgenciaId(
    req
) {

    const agenciaId =
        Number(
            req.agencia?.id
        );


    if (
        !Number.isInteger(
            agenciaId
        ) ||
        agenciaId <= 0
    ) {

        const error =
            new Error(
                "No fue posible determinar la agencia."
            );


        error.codigo =
            "AGENCIA_NO_DETERMINADA";


        throw error;

    }


    return agenciaId;

}


/* =========================================================
   MENSAJES DE VALIDACIÓN
========================================================= */

function obtenerMensajeError(
    error
) {

    const codigo =
        String(
            error?.message ||
            ""
        ).trim();


    if (
        codigo ===
        "AGENCIA_ID_INVALIDO" ||
        codigo ===
        "AGENCIA_NO_ENCONTRADA"
    ) {

        return "No fue posible determinar la agencia.";

    }


    if (
        codigo ===
        "TIPO_ANTICIPO_INVALIDO"
    ) {

        return "El tipo de anticipo seleccionado no es válido.";

    }


    if (
        codigo ===
        "PORCENTAJE_ANTICIPO_INVALIDO"
    ) {

        return "El porcentaje de anticipo debe ser mayor que 0 y no puede superar el 100 %.";

    }


    if (
        codigo ===
        "MONTO_ANTICIPO_INVALIDO"
    ) {

        return "El monto fijo de anticipo debe ser mayor que 0.";

    }


    if (
        codigo ===
        "HORAS_LIMITE_PAGO_INVALIDAS"
    ) {

        return "El tiempo límite para realizar el pago no es válido.";

    }


    return "No fue posible guardar la política de pagos.";

}


/* =========================================================
   MOSTRAR CONFIGURACIÓN
========================================================= */

async function mostrarConfiguracionPagosPanel(
    req,
    res
) {

    try {

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const configuracion =
            await obtenerConfiguracionPagosAgencia(
                agenciaId
            );


        return res.render(
            "panel/configuracion/pagos",
            {

                titulo:
                    "Política de pagos",

                subtituloPagina:
                    "Configuración de pagos y anticipos",

                paginaActual:
                    "configuracion-pagos",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                configuracion,

                resultado:
                    String(
                        req.query?.resultado ||
                        ""
                    ).trim(),

                mensaje:
                    String(
                        req.query?.mensaje ||
                        ""
                    ).trim()

            }
        );


    } catch (error) {

        console.error(
            "Error al cargar configuración de pagos:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la configuración de pagos."
            );

    }

}


/* =========================================================
   GUARDAR CONFIGURACIÓN
========================================================= */

async function guardarConfiguracionPagosPanel(
    req,
    res
) {

    try {

        /*
         * La agencia NO se obtiene del formulario.
         *
         * Siempre utilizamos el contexto autenticado
         * para mantener el aislamiento multiagencia.
         */

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        await guardarConfiguracionPagosAgencia({

            agenciaId,

            tipoAnticipo:
                req.body?.tipoAnticipo,

            valorAnticipo:
                req.body?.valorAnticipo,

            horasLimitePago:
                req.body?.horasLimitePago,

            activo:
                req.body?.activo

        });


        return res.redirect(
            "/panel/configuracion/pagos?resultado=guardado"
        );


    } catch (error) {

        console.error(
            "Error al guardar configuración de pagos:",
            error
        );


        const mensaje =
            encodeURIComponent(
                obtenerMensajeError(
                    error
                )
            );


        return res.redirect(
            `/panel/configuracion/pagos?resultado=error&mensaje=${mensaje}`
        );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarConfiguracionPagosPanel,

    guardarConfiguracionPagosPanel

};