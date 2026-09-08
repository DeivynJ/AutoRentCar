const {

    listarNotificacionesAdmin,

    contarNotificacionesAdminNoLeidas

} = require(
    "../services/notificacionAdminService"
);


/* =========================================================
   CARGAR NOTIFICACIONES DEL SUPERADMIN
========================================================= */

async function cargarNotificacionesAdmin(
    req,
    res,
    next
) {

    /*
     * Valores seguros por defecto.
     *
     * Así una falla temporal del sistema de
     * notificaciones no rompe todo el panel.
     */

    res.locals.notificacionesAdmin =
        [];


    res.locals.notificacionesAdminNoLeidas =
        0;


    try {

        const usuarioId =
            Number(
                req.session
                    ?.usuario
                    ?.id
            );


        if (
            !Number.isInteger(
                usuarioId
            ) ||
            usuarioId <= 0
        ) {

            return next();

        }


        const [
            notificaciones,
            totalNoLeidas
        ] =
            await Promise.all(
                [

                    listarNotificacionesAdmin(
                        usuarioId,
                        8
                    ),

                    contarNotificacionesAdminNoLeidas(
                        usuarioId
                    )

                ]
            );


        res.locals.notificacionesAdmin =
            Array.isArray(
                notificaciones
            )
                ? notificaciones
                : [];


        res.locals.notificacionesAdminNoLeidas =
            Number(
                totalNoLeidas ||
                0
            );


        return next();


    } catch (error) {

        /*
         * Las notificaciones son complementarias.
         *
         * Si fallan, registramos el problema,
         * pero el SuperAdmin debe poder continuar
         * utilizando el panel.
         */

        console.error(
            "Error cargando notificaciones del SuperAdministrador:",
            error
        );


        return next();

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    cargarNotificacionesAdmin

};