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
   CREAR TRANSPORTADOR POR AGENCIA
========================================================= */

async function crearTransportadorCorreoAgencia(
    agenciaId,
    {
        permitirNoVerificado =
            false
    } = {}
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

    if (
    !configuracion.verificado &&
    !permitirNoVerificado
) {

    throw new Error(
        "CORREO_AGENCIA_NO_VERIFICADO"
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
    agenciaId,
    {
        permitirNoVerificado:
            true
    }
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

    verificarConexionCorreoAgencia,

    enviarCorreoAgencia

};