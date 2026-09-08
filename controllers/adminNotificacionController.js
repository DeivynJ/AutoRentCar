const {

    marcarNotificacionAdminLeida

} = require(
    "../services/notificacionAdminService"
);


/* =========================================================
   ABRIR NOTIFICACIÓN DEL SUPERADMIN
========================================================= */

async function abrirNotificacionAdmin(
    req,
    res
) {

    try {

        const usuarioId =
            Number(
                req.session
                    ?.usuario
                    ?.id
            );


        const notificacionId =
            Number(
                req.params
                    ?.notificacionId
            );


        if (
            !Number.isInteger(
                usuarioId
            ) ||
            usuarioId <= 0
        ) {

            return res
                .status(401)
                .send(
                    "La sesión administrativa no es válida."
                );

        }


        if (
            !Number.isInteger(
                notificacionId
            ) ||
            notificacionId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "La notificación indicada no es válida."
                );

        }


        const resultado =
            await marcarNotificacionAdminLeida(
                usuarioId,
                notificacionId
            );


        return res.redirect(
            resultado.destinoUrl ||
            "/admin"
        );


    } catch (error) {

        console.error(
            "Error abriendo notificación del SuperAdministrador:",
            error
        );


        const status =
            Number(
                error.status
            );


        if (
            Number.isInteger(
                status
            ) &&
            status >= 400 &&
            status < 500
        ) {

            return res
                .status(
                    status
                )
                .send(
                    error.message ||
                    "No fue posible abrir la notificación."
                );

        }


        return res
            .status(500)
            .send(
                "No fue posible abrir la notificación."
            );

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    abrirNotificacionAdmin

};