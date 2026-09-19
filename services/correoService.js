/* =========================================================
   AUTORENTCAR
   SERVICIO GENERAL DE CORREO ELECTRÓNICO
========================================================= */

const nodemailer =
    require("nodemailer");

const {
    obtenerConfiguracionCorreoAgencia
} = require(
    "./configuracionCorreoAgenciaService"
);
/* =========================================================
   CONFIGURACIÓN SMTP
========================================================= */

function obtenerConfiguracionCorreo() {

    const host =
        String(
            process.env.SMTP_HOST ||
            ""
        ).trim();


    const puerto =
        Number(
            process.env.SMTP_PORT ||
            0
        );


    const usuario =
        String(
            process.env.SMTP_USER ||
            ""
        ).trim();


    const clave =
        String(
            process.env.SMTP_PASS ||
            ""
        );


    const seguro =
        String(
            process.env.SMTP_SECURE ||
            ""
        ).toLowerCase() ===
        "true";


    if (
        !host ||
        !puerto ||
        !usuario ||
        !clave
    ) {

        return null;

    }


    return {

        host,

        port:
            puerto,

        secure:
            seguro,

        auth: {

            user:
                usuario,

            pass:
                clave

        }

    };

}


/* =========================================================
   CREAR TRANSPORTADOR
========================================================= */

function crearTransportadorCorreo() {

    const configuracion =
        obtenerConfiguracionCorreo();


    if (
        !configuracion
    ) {

        return null;

    }


    return nodemailer.createTransport(
        configuracion
    );

}


/* =========================================================
   VERIFICAR CONFIGURACIÓN
========================================================= */

async function verificarConexionCorreo() {

    const transportador =
        crearTransportadorCorreo();


    if (
        !transportador
    ) {

        return {

            ok:
                false,

            configurado:
                false,

            mensaje:
                "El servicio de correo todavía no está configurado."

        };

    }


    try {

        await transportador.verify();


        return {

            ok:
                true,

            configurado:
                true

        };


    } catch (error) {

        return {

            ok:
                false,

            configurado:
                true,

            mensaje:
                error.message

        };

    }

}


/* =========================================================
   ENVIAR CORREO
========================================================= */

async function enviarCorreo({

    para,

    asunto,

    texto = null,

    html = null

}) {

    const transportador =
        crearTransportadorCorreo();


    if (
        !transportador
    ) {

        throw new Error(
            "SERVICIO_CORREO_NO_CONFIGURADO"
        );

    }


    const nombreRemitente =
        String(
            process.env.SMTP_FROM_NAME ||
            "AutoRentCar"
        ).trim();


    const correoRemitente =
        String(
            process.env.SMTP_FROM_EMAIL ||
            process.env.SMTP_USER ||
            ""
        ).trim();


    if (
        !para ||
        !asunto
    ) {

        throw new Error(
            "DATOS_CORREO_INCOMPLETOS"
        );

    }


    const resultado =
        await transportador.sendMail({

            from:
                `"${nombreRemitente}" <${correoRemitente}>`,

            to:
                para,

            subject:
                asunto,

            text:
                texto ||
                undefined,

            html:
                html ||
                undefined

        });


    return {

        enviado:
            true,

        messageId:
            resultado.messageId

    };

}

/* =========================================================
   CREAR TRANSPORTADOR POR AGENCIA
========================================================= */

async function crearTransportadorCorreoAgencia(
    agenciaId
) {

    const configuracion =
        await obtenerConfiguracionCorreoAgencia(
            agenciaId,
            {
                incluirClave:
                    true
            }
        );


    if (
        !configuracion
    ) {

        throw new Error(
            "CONFIGURACION_CORREO_AGENCIA_NO_ENCONTRADA"
        );

    }


    if (
        !configuracion.activo
    ) {

        throw new Error(
            "CORREO_AGENCIA_INACTIVO"
        );

    }


    const transportador =
        nodemailer.createTransport({

            host:
                configuracion.smtpHost,

            port:
                configuracion.smtpPuerto,

            secure:
                configuracion.smtpSecure,

            auth: {

                user:
                    configuracion.smtpUsuario,

                pass:
                    configuracion.smtpClave

            }

        });


    return {

        transportador,

        configuracion

    };

}


/* =========================================================
   VERIFICAR CORREO DE UNA AGENCIA
========================================================= */

async function verificarConexionCorreoAgencia(
    agenciaId
) {

    try {

        const {
            transportador
        } =
            await crearTransportadorCorreoAgencia(
                agenciaId
            );


        await transportador.verify();


        return {

            ok:
                true,

            agenciaId:
                Number(
                    agenciaId
                )

        };


    } catch (error) {

        return {

            ok:
                false,

            agenciaId:
                Number(
                    agenciaId
                ),

            mensaje:
                error.message

        };

    }

}


/* =========================================================
   ENVIAR CORREO DESDE UNA AGENCIA
========================================================= */

async function enviarCorreoAgencia({

    agenciaId,

    para,

    asunto,

    texto = null,

    html = null

}) {

    if (
        !para ||
        !asunto
    ) {

        throw new Error(
            "DATOS_CORREO_INCOMPLETOS"
        );

    }


    const {
        transportador,
        configuracion
    } =
        await crearTransportadorCorreoAgencia(
            agenciaId
        );


    const resultado =
        await transportador.sendMail({

            from:
                `"${configuracion.nombreRemitente}" <${configuracion.correoRemitente}>`,

            to:
                para,

            subject:
                asunto,

            text:
                texto ||
                undefined,

            html:
                html ||
                undefined

        });


    return {

        enviado:
            true,

        agenciaId:
            Number(
                agenciaId
            ),

        messageId:
            resultado.messageId

    };

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    verificarConexionCorreo,

    enviarCorreo,

    verificarConexionCorreoAgencia,

    enviarCorreoAgencia

};