/* =========================================================
   AUTORENTCAR
   PRUEBA DE AUDIENCIA DE NOTIFICACIONES DE AGENCIA
========================================================= */

require(
    "dotenv"
).config();


const {
    pool
} = require(
    "../config/database"
);


const {

    crearNotificacionAgencia,

    listarNotificacionesAgenciaUsuario,

    contarNotificacionesNoLeidas,

    marcarNotificacionComoLeida,

    abrirNotificacionAgencia

} = require(
    "../services/notificacionAgenciaService"
);


/* =========================================================
   EJECUTAR PRUEBA
========================================================= */

async function ejecutar() {

    let conexion;

    let notificacionId =
        null;


    try {

        conexion =
            await pool.getConnection();


        /* =================================================
           BUSCAR UNA AGENCIA QUE TENGA:

           - admin_agencia activo
           - empleado activo
        ================================================= */

        const filas =
            await conexion.query(
                `
                SELECT

                    a.id
                        AS agencia_id,

                    a.nombre
                        AS agencia_nombre,

                    ua.id
                        AS admin_id,

                    ua.nombre
                        AS admin_nombre,

                    ue.id
                        AS empleado_id,

                    ue.nombre
                        AS empleado_nombre

                FROM agencias a

                INNER JOIN usuarios ua

                    ON ua.agencia_id =
                        a.id

                    AND ua.estado =
                        'activo'

                INNER JOIN roles ra

                    ON ra.id =
                        ua.rol_id

                    AND ra.codigo =
                        'admin_agencia'

                    AND ra.activo =
                        1

                INNER JOIN usuarios ue

                    ON ue.agencia_id =
                        a.id

                    AND ue.estado =
                        'activo'

                INNER JOIN roles re

                    ON re.id =
                        ue.rol_id

                    AND re.codigo =
                        'empleado'

                    AND re.activo =
                        1

                LIMIT 1
                `
            );


        if (
            !filas.length
        ) {

            throw new Error(
                "No existe una agencia con un administrador y un empleado activos para realizar la prueba."
            );

        }


        const datos =
            filas[0];


        const agenciaId =
            Number(
                datos.agencia_id
            );


        const adminId =
            Number(
                datos.admin_id
            );


        const empleadoId =
            Number(
                datos.empleado_id
            );


        console.log(
            "\n========================================"
        );

        console.log(
            "PRUEBA AUDIENCIA NOTIFICACIONES"
        );

        console.log(
            "========================================"
        );


        console.log(
            "Agencia:",
            datos.agencia_nombre
        );


        console.log(
            "Administrador:",
            datos.admin_nombre,
            `(#${adminId})`
        );


        console.log(
            "Empleado:",
            datos.empleado_nombre,
            `(#${empleadoId})`
        );


        /* =================================================
           CONTADORES ANTES DE CREAR LA ALERTA
        ================================================= */

        const adminAntes =
            await contarNotificacionesNoLeidas({
                agenciaId,
                usuarioId:
                    adminId
            });


        const empleadoAntes =
            await contarNotificacionesNoLeidas({
                agenciaId,
                usuarioId:
                    empleadoId
            });


        console.log(
            "\nNo leídas antes:"
        );


        console.log(
            "Admin:",
            adminAntes
        );


        console.log(
            "Empleado:",
            empleadoAntes
        );


        /* =================================================
           CREAR NOTIFICACIÓN EXCLUSIVA PARA ADMINISTRADORES
        ================================================= */

        const claveEvento =
            `prueba-audiencia-admin:${Date.now()}`;


        const creada =
            await crearNotificacionAgencia({

                agenciaId,

                categoria:
                    "pruebas",

                tipo:
                    "prueba_audiencia_admin",

                claveEvento,

                titulo:
                    "Prueba de notificación administrativa",

                mensaje:
                    "Esta notificación solamente debe ser visible para administradores de la agencia.",

                destinoUrl:
                    "/panel",

                entidadTipo:
                    "prueba",

                nivel:
                    "info",

                audiencia:
                    "administradores"

            });


        notificacionId =
            creada.id;


        console.log(
            "\nNotificación creada:",
            creada
        );


        if (
            !creada.creada ||
            !notificacionId
        ) {

            throw new Error(
                "La notificación de prueba no fue creada correctamente."
            );

        }


        /* =================================================
           PROBAR DEDUPLICACIÓN
        ================================================= */

        const duplicada =
            await crearNotificacionAgencia({

                agenciaId,

                categoria:
                    "pruebas",

                tipo:
                    "prueba_audiencia_admin",

                claveEvento,

                titulo:
                    "Prueba de notificación administrativa",

                mensaje:
                    "Esta notificación solamente debe ser visible para administradores de la agencia.",

                destinoUrl:
                    "/panel",

                entidadTipo:
                    "prueba",

                nivel:
                    "info",

                audiencia:
                    "administradores"

            });


        console.log(
            "\nPrueba duplicado:"
        );


        console.log(
            duplicada
        );


        if (
            !duplicada.duplicada
        ) {

            throw new Error(
                "La deduplicación por clave_evento no funcionó."
            );

        }


        /* =================================================
           CONTADORES DESPUÉS DE CREAR
        ================================================= */

        const adminDespues =
            await contarNotificacionesNoLeidas({
                agenciaId,
                usuarioId:
                    adminId
            });


        const empleadoDespues =
            await contarNotificacionesNoLeidas({
                agenciaId,
                usuarioId:
                    empleadoId
            });


        console.log(
            "\nNo leídas después:"
        );


        console.log(
            "Admin:",
            adminDespues
        );


        console.log(
            "Empleado:",
            empleadoDespues
        );


        if (
            adminDespues !==
            adminAntes + 1
        ) {

            throw new Error(
                "El administrador no recibió correctamente la notificación."
            );

        }


        if (
            empleadoDespues !==
            empleadoAntes
        ) {

            throw new Error(
                "El empleado está contando una notificación exclusiva de administradores."
            );

        }


        /* =================================================
           VALIDAR LISTADO
        ================================================= */

        const listaAdmin =
            await listarNotificacionesAgenciaUsuario({

                agenciaId,

                usuarioId:
                    adminId,

                limite:
                    50

            });


        const listaEmpleado =
            await listarNotificacionesAgenciaUsuario({

                agenciaId,

                usuarioId:
                    empleadoId,

                limite:
                    50

            });


        const adminLaVe =
            listaAdmin.some(
                item =>
                    item.id ===
                    notificacionId
            );


        const empleadoLaVe =
            listaEmpleado.some(
                item =>
                    item.id ===
                    notificacionId
            );


        console.log(
            "\nListado:"
        );


        console.log(
            "Admin la ve:",
            adminLaVe
        );


        console.log(
            "Empleado la ve:",
            empleadoLaVe
        );


        if (
            !adminLaVe
        ) {

            throw new Error(
                "La notificación no apareció para el administrador."
            );

        }


        if (
            empleadoLaVe
        ) {

            throw new Error(
                "La notificación apareció para el empleado."
            );

        }


        /* =================================================
           EMPLEADO INTENTA MARCARLA COMO LEÍDA
        ================================================= */

        let empleadoPuedeMarcar =
            false;


        try {

            await marcarNotificacionComoLeida({

                agenciaId,

                usuarioId:
                    empleadoId,

                notificacionId

            });


            empleadoPuedeMarcar =
                true;


        } catch (error) {

            console.log(
                "\nEmpleado marcar lectura:",
                error.codigo ||
                error.message
            );

        }


        if (
            empleadoPuedeMarcar
        ) {

            throw new Error(
                "El empleado pudo marcar como leída una notificación administrativa."
            );

        }


        /* =================================================
           EMPLEADO INTENTA ABRIRLA DIRECTAMENTE
        ================================================= */

        let empleadoPuedeAbrir =
            false;


        try {

            await abrirNotificacionAgencia({

                agenciaId,

                usuarioId:
                    empleadoId,

                notificacionId

            });


            empleadoPuedeAbrir =
                true;


        } catch (error) {

            console.log(
                "Empleado abrir notificación:",
                error.codigo ||
                error.message
            );

        }


        if (
            empleadoPuedeAbrir
        ) {

            throw new Error(
                "El empleado pudo abrir una notificación administrativa."
            );

        }


        /* =================================================
           ADMINISTRADOR SÍ DEBE PODER ABRIRLA
        ================================================= */

        const aperturaAdmin =
            await abrirNotificacionAgencia({

                agenciaId,

                usuarioId:
                    adminId,

                notificacionId

            });


        console.log(
            "\nAdministrador abrir:"
        );


        console.log(
            aperturaAdmin
        );


        if (
            !aperturaAdmin.ok
        ) {

            throw new Error(
                "El administrador no pudo abrir la notificación."
            );

        }


        /* =================================================
           VERIFICAR QUE QUEDÓ LEÍDA
        ================================================= */

        const adminFinal =
            await contarNotificacionesNoLeidas({

                agenciaId,

                usuarioId:
                    adminId

            });


        if (
            adminFinal !==
            adminAntes
        ) {

            throw new Error(
                "La notificación no quedó marcada como leída para el administrador."
            );

        }


        console.log(
            "\n========================================"
        );

        console.log(
            "PRUEBA COMPLETADA CORRECTAMENTE ✅"
        );

        console.log(
            "========================================"
        );


        console.log(
            "Admin ve notificación:          OK"
        );


        console.log(
            "Empleado no la ve:             OK"
        );


        console.log(
            "Empleado no la cuenta:         OK"
        );


        console.log(
            "Empleado no puede marcarla:    OK"
        );


        console.log(
            "Empleado no puede abrirla:     OK"
        );


        console.log(
            "Deduplicación:                 OK"
        );


        console.log(
            "Admin puede abrirla:           OK"
        );


    } catch (error) {

        console.error(
            "\n❌ ERROR EN LA PRUEBA:"
        );


        console.error(
            error
        );


        process.exitCode =
            1;


    } finally {

        /*
         * Eliminamos la notificación de prueba.
         * Las lecturas asociadas se eliminan por
         * ON DELETE CASCADE.
         */

        if (
            conexion &&
            notificacionId
        ) {

            try {

                await conexion.query(
                    `
                    DELETE
                    FROM notificaciones_agencia

                    WHERE
                        id = ?
                    `,
                    [
                        notificacionId
                    ]
                );


                console.log(
                    "\nNotificación de prueba eliminada."
                );


            } catch (error) {

                console.error(
                    "No se pudo eliminar la notificación de prueba:",
                    error.message
                );

            }

        }


        if (
            conexion
        ) {

            conexion.release();

        }


        await pool.end();

    }

}


/* =========================================================
   INICIAR
========================================================= */

ejecutar();