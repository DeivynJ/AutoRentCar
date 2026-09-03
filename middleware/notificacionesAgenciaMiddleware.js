/* =========================================================
   AUTORENTCAR
   CONTEXTO DE NOTIFICACIONES DEL PANEL DE AGENCIA
========================================================= */

const {

    listarNotificacionesAgenciaUsuario,

    contarNotificacionesNoLeidas

} = require(
    "../services/notificacionAgenciaService"
);


/* =========================================================
   CARGAR NOTIFICACIONES DEL PANEL
========================================================= */

async function cargarNotificacionesAgencia(
    req,
    res,
    next
) {

    /*
     * Siempre dejamos valores predeterminados.
     *
     * Así una falla en el sistema de notificaciones
     * nunca debe impedir entrar al panel.
     */

    res.locals.notificacionesPanel =
        [];


    res.locals.notificacionesNoLeidas =
        0;


    /*
     * Las notificaciones se necesitan principalmente
     * cuando vamos a renderizar una página.
     *
     * No hacemos consultas adicionales para POST.
     */

    if (
        req.method !==
        "GET"
    ) {

        return next();

    }


    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const usuarioId =
            Number(
                req.usuarioAgencia?.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0 ||
            !Number.isInteger(
                usuarioId
            ) ||
            usuarioId <= 0
        ) {

            return next();

        }


        /* =================================================
           CARGAR LISTADO Y CONTADOR EN PARALELO
        ================================================= */

        const [

            notificaciones,

            totalNoLeidas

        ] = await Promise.all([

            listarNotificacionesAgenciaUsuario({

                agenciaId,

                usuarioId,

                limite:
                    20

            }),


            contarNotificacionesNoLeidas({

                agenciaId,

                usuarioId

            })

        ]);


        res.locals.notificacionesPanel =
            notificaciones;


        res.locals.notificacionesNoLeidas =
            totalNoLeidas;


        return next();


    } catch (error) {

        /*
         * Una notificación es secundaria.
         *
         * Si por algún motivo falla este módulo,
         * el panel debe continuar funcionando.
         */

        console.error(
            "Error cargando notificaciones del panel:",
            error
        );


        return next();

    }

}


/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    cargarNotificacionesAgencia

};