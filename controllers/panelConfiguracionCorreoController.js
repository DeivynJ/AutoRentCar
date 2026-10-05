/* =========================================================
   AUTORENTCAR
   CONFIGURACIÓN DE CORREO DEL PANEL DE AGENCIA
========================================================= */

const {

    obtenerConfiguracionCorreoAgencia,

    guardarConfiguracionCorreoAgencia,

    marcarConfiguracionCorreoVerificada

} = require(
    "../services/configuracionCorreoAgenciaService"
);


const {
    verificarConexionCorreoAgencia
} = require(
    "../services/correoService"
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
   MOSTRAR CONFIGURACIÓN
========================================================= */

async function mostrarConfiguracionCorreoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const configuracion =
            await obtenerConfiguracionCorreoAgencia(
                agenciaId
            );


        return res.render(
            "panel/configuracion/correo",
            {

                titulo:
                    "Correo automático",

                subtituloPagina:
                    "Configuración de correo",

                paginaActual:
                    "correo-automatico",

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
            "Error al cargar configuración de correo:",
            error
        );


        return res.status(
            500
        ).send(
            "No fue posible cargar la configuración de correo."
        );

    }

}


/* =========================================================
   GUARDAR CONFIGURACIÓN
========================================================= */

async function guardarConfiguracionCorreoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        await guardarConfiguracionCorreoAgencia({

            agenciaId,

            proveedor:
                req.body?.proveedor ||
                "gmail",

            nombreRemitente:
                req.body?.nombreRemitente,

            correoRemitente:
                req.body?.correoRemitente,

            smtpHost:
                req.body?.smtpHost,

            smtpPuerto:
                req.body?.smtpPuerto,

            smtpSecure:
                req.body?.smtpSecure ===
                "1",

            smtpUsuario:
                req.body?.smtpUsuario,

            smtpClave:
                String(
                    req.body?.smtpClave ||
                    ""
                ).trim() ||
                null,

            activo:
                req.body?.activo ===
                "1"

        });


        return res.redirect(
            "/panel/configuracion/correo?resultado=guardado"
        );


    } catch (error) {

        console.error(
            "Error al guardar configuración de correo:",
            error
        );


        const mensaje =
            encodeURIComponent(
                error.message ||
                "No fue posible guardar la configuración."
            );


        return res.redirect(
            `/panel/configuracion/correo?resultado=error&mensaje=${mensaje}`
        );

    }

}


/* =========================================================
   VERIFICAR CONFIGURACIÓN SMTP
========================================================= */

async function verificarConfiguracionCorreoPanel(
    req,
    res
) {

    try {

        const agenciaId =
            obtenerAgenciaId(
                req
            );


        const resultado =
            await verificarConexionCorreoAgencia(
                agenciaId
            );


        if (
            !resultado.ok
        ) {

            const mensaje =
                encodeURIComponent(
                    resultado.mensaje ||
                    "No fue posible verificar la conexión SMTP."
                );


            return res.redirect(
                `/panel/configuracion/correo?resultado=verificacion_error&mensaje=${mensaje}`
            );

        }


        await marcarConfiguracionCorreoVerificada(
            agenciaId
        );


        return res.redirect(
            "/panel/configuracion/correo?resultado=verificado"
        );


    } catch (error) {

        console.error(
            "Error al verificar configuración de correo:",
            error
        );


        const mensaje =
            encodeURIComponent(
                error.message ||
                "No fue posible verificar la conexión SMTP."
            );


        return res.redirect(
            `/panel/configuracion/correo?resultado=verificacion_error&mensaje=${mensaje}`
        );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarConfiguracionCorreoPanel,

    guardarConfiguracionCorreoPanel,

    verificarConfiguracionCorreoPanel

};