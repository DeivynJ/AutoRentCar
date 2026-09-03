/* =========================================================
   AUTORENTCAR - NOTIFICACIONES DEL PANEL DE AGENCIA
========================================================= */

const {

    abrirNotificacionAgencia

} = require(
    "../services/notificacionAgenciaService"
);


/* =========================================================
   ABRIR NOTIFICACIÓN
========================================================= */

async function abrirNotificacionPanel(
    req,
    res
) {

    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const usuarioId =
            Number(
                req.usuarioAgencia?.id
            );


        const notificacionId =
            Number(
                req.params?.notificacionId
            );


        const resultado =
            await abrirNotificacionAgencia({

                agenciaId,

                usuarioId,

                notificacionId

            });


        return res.redirect(
            resultado.destinoUrl
        );


    } catch (error) {

        console.error(
            "Error abriendo notificación del panel:",
            error
        );


        /*
         * Si la notificación no existe o pertenece
         * a otra agencia, no revelamos información.
         */

        if (
            error.codigo ===
            "NOTIFICACION_NO_ENCONTRADA"
        ) {

            return res.redirect(
                "/panel"
            );

        }


        if (
            error.codigo ===
            "USUARIO_NO_AUTORIZADO"
        ) {

            return res
                .status(403)
                .send(
                    "No tienes autorización para realizar esta acción."
                );

        }


        return res.redirect(
            "/panel"
        );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    abrirNotificacionPanel

};