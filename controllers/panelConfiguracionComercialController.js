/* =========================================================
   AVYNEXO
   CONFIGURACIÓN COMERCIAL DEL PANEL DE AGENCIA
========================================================= */

const {

    obtenerConfiguracionComercialAgencia,

    actualizarAdicionalAgencia,

    actualizarPromocionAgencia

} = require(
    "../services/configuracionComercialAgenciaService"
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
   MOSTRAR CONFIGURACIÓN COMERCIAL
========================================================= */

async function mostrarConfiguracionComercialPanel(
    req,
    res
) {

    try {

        /*
         * La agencia se obtiene exclusivamente
         * desde el contexto autenticado.
         *
         * Nunca desde:
         * - req.body
         * - req.query
         * - req.params
         */

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const configuracion =
            await obtenerConfiguracionComercialAgencia(
                agenciaId
            );


        return res.render(
            "panel/configuracion/comercial",
            {

                titulo:
                    "Configuración comercial",

                subtituloPagina:
                    "Configuración comercial",

                paginaActual:
                    "configuracion-comercial",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                configuracion

            }
        );


    } catch (error) {

        console.error(
            "Error al cargar configuración comercial:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la configuración comercial."
            );

    }

}

/* =========================================================
   ACTUALIZAR SERVICIO ADICIONAL
========================================================= */

async function actualizarAdicionalComercialPanel(
    req,
    res
) {

    try {

        /*
         * La agencia siempre procede
         * del contexto autenticado.
         */

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const adicionalId =
            Number(
                req.params?.adicionalId
            );


        await actualizarAdicionalAgencia({

            agenciaId,

            adicionalId,

            precioDiario:
                req.body?.precioDiario,

            activo:
                req.body?.activo

        });


        return res.redirect(
            "/panel/configuracion/comercial?resultado=adicional_guardado"
        );


    } catch (error) {

       const codigo =
    String(
        error?.codigo ||
        error?.message ||
        ""
    ).trim();

        let mensaje;


        if (
            codigo ===
            "ADICIONAL_ID_INVALIDO" ||
            codigo ===
            "ADICIONAL_NO_ENCONTRADO"
        ) {

            mensaje =
                "El servicio adicional indicado no existe o no pertenece a esta agencia.";

        } else if (
            codigo ===
            "PRECIO_ADICIONAL_INVALIDO"
        ) {

            mensaje =
                "El precio del servicio adicional no es válido.";

        } else if (
            codigo ===
            "AGENCIA_ID_INVALIDO" ||
            codigo ===
            "AGENCIA_NO_DETERMINADA"
        ) {

            mensaje =
                "No fue posible determinar la agencia.";

        } else {

            console.error(
                "Error inesperado actualizando servicio adicional:",
                error
            );


            mensaje =
                "No fue posible actualizar el servicio adicional.";

        }


        return res.redirect(
            `/panel/configuracion/comercial?resultado=error&mensaje=${encodeURIComponent(
                mensaje
            )}`
        );

    }

}

/* =========================================================
   ACTUALIZAR PROMOCIÓN
========================================================= */

async function actualizarPromocionComercialPanel(
    req,
    res
) {

    try {

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const promocionId =
            Number(
                req.params?.promocionId
            );


       await actualizarPromocionAgencia({

    agenciaId,

    promocionId,

    codigo:
        req.body?.codigo,

    porcentajeDescuento:
        req.body?.porcentajeDescuento,

    fechaInicio:
        req.body?.fechaInicio,

    fechaFin:
        req.body?.fechaFin,

    publica:
        req.body?.publica,

    activo:
        req.body?.activo

});


        return res.redirect(
            "/panel/configuracion/comercial?resultado=promocion_guardada"
        );


    } catch (error) {

        const codigo =
    String(
        error?.codigo ||
        error?.message ||
        ""
    ).trim();


        let mensaje;


        if (
            codigo ===
            "PROMOCION_ID_INVALIDO" ||
            codigo ===
            "PROMOCION_NO_ENCONTRADA"
        ) {

            mensaje =
                "La promoción indicada no existe o no pertenece a esta agencia.";

        } 
        
        else if (
    codigo ===
    "CODIGO_PROMOCION_INVALIDO"
) {

    mensaje =
        "El código promocional no es válido. Utiliza únicamente letras, números, guiones o guion bajo.";

}

else if (
    codigo ===
    "CODIGO_PROMOCION_DUPLICADO"
) {

    mensaje =
        "Ya existe una promoción con ese código dentro de esta agencia.";

}
        
        else if (
            codigo ===
            "PORCENTAJE_PROMOCION_INVALIDO"
        ) {

            mensaje =
                "El porcentaje de descuento debe ser mayor que 0 y no puede superar el 100 %.";

        } else if (
            codigo ===
            "FECHA_PROMOCION_INVALIDA"
        ) {

            mensaje =
                "Una de las fechas de la promoción no es válida.";

        } else if (
            codigo ===
            "PERIODO_PROMOCION_INVALIDO"
        ) {

            mensaje =
                "La fecha final de la promoción no puede ser anterior a la fecha inicial.";

        } else if (
            codigo ===
            "AGENCIA_ID_INVALIDO" ||
            codigo ===
            "AGENCIA_NO_DETERMINADA"
        ) {

            mensaje =
                "No fue posible determinar la agencia.";

        } else {

            console.error(
                "Error inesperado actualizando promoción:",
                error
            );


            mensaje =
                "No fue posible actualizar la promoción.";

        }


        return res.redirect(
            `/panel/configuracion/comercial?resultado=error&mensaje=${encodeURIComponent(
                mensaje
            )}`
        );

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarConfiguracionComercialPanel,

    actualizarAdicionalComercialPanel,

    actualizarPromocionComercialPanel

};