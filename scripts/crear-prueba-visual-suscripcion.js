/* =========================================================
   AUTORENTCAR
   PRUEBA VISUAL DE ALERTAS DE SUSCRIPCIÓN
========================================================= */

/* =========================================================
   VARIABLES DE ENTORNO
========================================================= */

require("dotenv").config();


const {
    pool
} = require(
    "../config/database"
);


const {
    crearNotificacionAdmin
} = require(
    "../services/notificacionAdminService"
);


const {
    crearNotificacionAgencia
} = require(
    "../services/notificacionAgenciaService"
);


/* =========================================================
   EJECUTAR
========================================================= */

async function ejecutar() {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /* =================================================
           TOMAR THE NENERENTCAR
        ================================================= */

        const agencias =
            await conexion.query(
                `
                SELECT

                    a.id
                        AS agencia_id,

                    a.nombre,

                    s.id
                        AS suscripcion_id

                FROM agencias a

                INNER JOIN suscripciones s

                    ON s.agencia_id =
                        a.id

                WHERE
                    a.id = 2

                ORDER BY
                    s.id DESC

                LIMIT 1
                `
            );


        if (
            !agencias.length
        ) {

            throw new Error(
                "No se encontró la agencia #2."
            );

        }


        const datos =
            agencias[0];


        const marca =
            Date.now();


        /* =================================================
           SUPERADMIN
        ================================================= */

        const admin =
            await crearNotificacionAdmin(
                {

                    categoria:
                        "suscripciones",

                    tipo:
                        "prueba_visual_suscripcion",

                    claveEvento:
                        `prueba-visual-admin:${marca}`,

                    titulo:
                        "Suscripción próxima a vencer",

                    mensaje:
                        `${datos.nombre} tiene 3 días restantes de suscripción.`,

                    destinoUrl:
                        `/admin/agencias/${datos.agencia_id}/suscripcion`,

                    entidadTipo:
                        "suscripcion",

                    entidadId:
                        datos.suscripcion_id,

                    nivel:
                        "advertencia"

                },
                conexion
            );


        /* =================================================
           ADMINISTRADOR DE AGENCIA
        ================================================= */

        const agencia =
            await crearNotificacionAgencia({

                agenciaId:
                    datos.agencia_id,

                categoria:
                    "suscripciones",

                tipo:
                    "prueba_visual_suscripcion",

                claveEvento:
                    `prueba-visual-agencia:${marca}`,

                titulo:
                    "Tu suscripción está por vencer",

                mensaje:
                    "Tu suscripción al plan Inicial vence en 3 días. Te recomendamos realizar la renovación a tiempo.",

                destinoUrl:
                    "/panel",

                entidadTipo:
                    "suscripcion",

                entidadId:
                    datos.suscripcion_id,

                nivel:
                    "advertencia",

                audiencia:
                    "administradores",

                conexion

            });


        console.log(
            "\n✅ Notificaciones visuales creadas."
        );


        console.log(
            "SuperAdmin ID:",
            admin.id
        );


        console.log(
            "Agencia ID:",
            agencia.id
        );


        console.log(
            "\nIMPORTANTE:"
        );


        console.log(
            "Estas dos notificaciones NO se eliminan automáticamente."
        );


    } catch (error) {

        console.error(
            "\n❌ Error:"
        );

        console.error(
            error
        );


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }


        await pool.end();

    }

}


ejecutar();