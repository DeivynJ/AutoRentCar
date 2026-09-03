/* =========================================================
   AUTORENTCAR
   PRUEBA CONTROLADA DE NOTIFICACIÓN DE AGENCIA
========================================================= */

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
    crearNotificacionAgencia
} = require(
    "../services/notificacionAgenciaService"
);


/* =========================================================
   PRUEBA
========================================================= */

async function probar() {

    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           BUSCAR LA RESERVACIÓN REAL DE PRUEBA
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.codigo,
                    r.agencia_id,
                    r.cantidad_vehiculos,
                    r.cliente_nombre,

                    m.marca,
                    m.nombre AS modelo_nombre

                FROM reservaciones r

                INNER JOIN modelos_vehiculos m

                    ON m.id =
                        r.modelo_id

                    AND m.agencia_id =
                        r.agencia_id

                WHERE
                    r.codigo = ?

                LIMIT 1
                `,
                [
                    "AR-260903-813C1124"
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw new Error(
                "No se encontró la reservación de prueba."
            );

        }


        const reservacion =
            reservaciones[0];


        /* -------------------------------------------------
           CREAR NOTIFICACIÓN
        ------------------------------------------------- */

        const notificacion =
            await crearNotificacionAgencia({

                agenciaId:
                    reservacion.agencia_id,

                categoria:
                    "reservaciones",

                tipo:
                    "reservacion_nueva",

                titulo:
                    "Nueva reservación pendiente",

                mensaje:
                    `${reservacion.cliente_nombre} solicitó ${reservacion.cantidad_vehiculos} ${reservacion.marca} ${reservacion.modelo_nombre}.`,

                destinoUrl:
                    "/panel/reservaciones",

                entidadTipo:
                    "reservacion",

                entidadId:
                    reservacion.id,

                nivel:
                    "info"

            });


        console.log(
            "\n=== NOTIFICACIÓN CREADA ===\n"
        );


        console.log(
            notificacion
        );


        console.log(
            "\nPrueba completada correctamente.\n"
        );


    } catch (error) {

        console.error(
            "\nERROR EN LA PRUEBA:\n"
        );

        console.error(
            error
        );


        process.exitCode =
            1;


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }


        await pool.end();

    }

}


/* =========================================================
   EJECUTAR
========================================================= */

probar();