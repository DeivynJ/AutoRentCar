
const path =
    require(
        "path"
    );

require(
    "dotenv"
).config({

    path:
        path.join(
            __dirname,
            "..",
            ".env"
        )

});

const {
    pool
} = require(
    "../config/database"
);


const {

    crearNotificacionAdmin,

    listarNotificacionesAdmin,

    contarNotificacionesAdminNoLeidas,

    obtenerNotificacionAdmin,

    marcarNotificacionAdminLeida

} = require(
    "../services/notificacionAdminService"
);


/* =========================================================
   OBTENER SUPERADMIN ACTIVO
========================================================= */

async function obtenerSuperadminActivo() {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        const usuarios =
            await conexion.query(
                `
                SELECT

                    u.id,

                    u.nombre,

                    u.correo

                FROM usuarios u

                INNER JOIN roles r
                    ON r.id = u.rol_id

                WHERE
                    u.estado = 'activo'
                    AND r.codigo = 'superadmin'
                    AND r.activo = 1

                ORDER BY
                    u.id ASC

                LIMIT 1
                `
            );


        if (
            !usuarios.length
        ) {

            throw new Error(
                "No existe un SuperAdministrador activo para realizar la prueba."
            );

        }


        return {

            id:
                Number(
                    usuarios[0].id
                ),

            nombre:
                usuarios[0].nombre,

            correo:
                usuarios[0].correo

        };


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   ELIMINAR NOTIFICACIÓN DE PRUEBA
========================================================= */

async function eliminarNotificacionPrueba(
    notificacionId
) {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        await conexion.query(
            `
            DELETE FROM notificaciones_admin

            WHERE
                id = ?
                AND tipo = 'prueba_backend_admin'
            `,
            [
                notificacionId
            ]
        );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}


/* =========================================================
   PRUEBA
========================================================= */

async function ejecutarPrueba() {

    let notificacionId =
        null;


    try {

        const superadmin =
            await obtenerSuperadminActivo();


        console.log(
            "SuperAdmin:",
            superadmin.id,
            "-",
            superadmin.nombre
        );


        /* -------------------------------------------------
           CONTADOR INICIAL
        ------------------------------------------------- */

        const noLeidasAntes =
            await contarNotificacionesAdminNoLeidas(
                superadmin.id
            );


        console.log(
            "No leídas antes:",
            noLeidasAntes
        );


        /* -------------------------------------------------
           CREAR
        ------------------------------------------------- */

        const creada =
            await crearNotificacionAdmin(
                {

                    categoria:
                        "sistema",

                    tipo:
                        "prueba_backend_admin",

                    titulo:
                        "Prueba de notificación",

                    mensaje:
                        "Notificación temporal para validar el servicio del SuperAdministrador.",

                    destinoUrl:
                        "/admin/usuarios",

                    entidadTipo:
                        "usuario",

                    entidadId:
                        superadmin.id,

                    nivel:
                        "info"

                }
            );


        notificacionId =
            creada.id;


        console.log(
            "Notificación creada:",
            notificacionId
        );


        /* -------------------------------------------------
           CONTADOR DESPUÉS DE CREAR
        ------------------------------------------------- */

        const noLeidasDespuesCrear =
            await contarNotificacionesAdminNoLeidas(
                superadmin.id
            );


        console.log(
            "No leídas después de crear:",
            noLeidasDespuesCrear
        );


        if (
            noLeidasDespuesCrear !==
            noLeidasAntes + 1
        ) {

            throw new Error(
                "El contador de no leídas no aumentó correctamente."
            );

        }


        /* -------------------------------------------------
           LISTADO
        ------------------------------------------------- */

        const listado =
            await listarNotificacionesAdmin(
                superadmin.id,
                20
            );


        const encontrada =
            listado.find(
                notificacion =>
                    Number(
                        notificacion.id
                    ) ===
                    notificacionId
            );


        if (!encontrada) {

            throw new Error(
                "La notificación creada no apareció en el listado."
            );

        }


        console.log(
            "Aparece en listado:",
            "SÍ"
        );


        if (
            encontrada.leida
        ) {

            throw new Error(
                "La notificación apareció como leída antes de abrirla."
            );

        }


        /* -------------------------------------------------
           OBTENER DETALLE
        ------------------------------------------------- */

        const detalle =
            await obtenerNotificacionAdmin(
                superadmin.id,
                notificacionId
            );


        if (
            Number(
                detalle.id
            ) !==
            notificacionId
        ) {

            throw new Error(
                "No fue posible recuperar correctamente la notificación."
            );

        }


        console.log(
            "Detalle recuperado:",
            "SÍ"
        );


        /* -------------------------------------------------
           MARCAR COMO LEÍDA
        ------------------------------------------------- */

        const lectura =
            await marcarNotificacionAdminLeida(
                superadmin.id,
                notificacionId
            );


        if (
            !lectura.ok
        ) {

            throw new Error(
                "No fue posible marcar la notificación como leída."
            );

        }


        console.log(
            "Marcada como leída:",
            "SÍ"
        );


        /* -------------------------------------------------
           VERIFICAR ESTADO DE LECTURA
        ------------------------------------------------- */

        const detalleLeido =
            await obtenerNotificacionAdmin(
                superadmin.id,
                notificacionId
            );


        if (
            !detalleLeido.leida
        ) {

            throw new Error(
                "La notificación continúa apareciendo como no leída."
            );

        }


        const noLeidasDespuesLeer =
            await contarNotificacionesAdminNoLeidas(
                superadmin.id
            );


        console.log(
            "No leídas después de leer:",
            noLeidasDespuesLeer
        );


        if (
            noLeidasDespuesLeer !==
            noLeidasAntes
        ) {

            throw new Error(
                "El contador no regresó al valor inicial después de marcar la notificación como leída."
            );

        }


        console.log(
            ""
        );


        console.log(
            "PRUEBA DE NOTIFICACIONES ADMIN: CORRECTA"
        );


    } finally {

        /*
         * Siempre intentamos eliminar la notificación
         * temporal.
         *
         * La lectura asociada también desaparecerá
         * mediante ON DELETE CASCADE.
         */

        if (
            notificacionId
        ) {

            try {

                await eliminarNotificacionPrueba(
                    notificacionId
                );


                console.log(
                    "Limpieza de prueba: CORRECTA"
                );


            } catch (
                errorLimpieza
            ) {

                console.error(
                    "Error limpiando la notificación temporal:",
                    errorLimpieza
                );

            }

        }

    }

}


/* =========================================================
   EJECUCIÓN
========================================================= */

ejecutarPrueba()
    .catch(
        error =>
        {

            console.error(
                ""
            );


            console.error(
                "PRUEBA DE NOTIFICACIONES ADMIN: ERROR"
            );


            console.error(
                error.message
            );


            process.exitCode =
                1;

        }
    )
    .finally(
        async () =>
        {

            try {

                await pool.end();

            } catch (
                error
            ) {

                console.error(
                    "No fue posible cerrar el pool:",
                    error.message
                );

            }

        }
    );