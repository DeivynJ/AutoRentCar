/* =========================================================
   AUTORENTCAR
   PRUEBA CONTROLADA DE UMBRALES DE SUSCRIPCIÓN
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
    generarAlertasSuscripcionesAdmin
} = require(
    "../services/alertasSuscripcionAdminService"
);


/* =========================================================
   ESCENARIOS
========================================================= */

const escenarios =
    [
        {
            dias:
                7,

            codigo:
                "vence_7",

            esperaAgencia:
                true
        },

        {
            dias:
                3,

            codigo:
                "vence_3",

            esperaAgencia:
                true
        },

        {
            dias:
                1,

            codigo:
                "vence_1",

            esperaAgencia:
                true
        },

        {
            dias:
                0,

            codigo:
                "vence_hoy",

            esperaAgencia:
                true
        },

        {
            dias:
                -1,

            codigo:
                "vencida",

            esperaAgencia:
                false
        }
    ];


/* =========================================================
   EJECUTAR
========================================================= */

async function ejecutar() {

    let conexion;

    let suscripcionId =
        null;

    let agenciaId =
        null;

    let fechaOriginal =
        null;

    const clavesGeneradas =
        [];


    try {

        conexion =
            await pool.getConnection();


        /* =================================================
           BUSCAR UNA SUSCRIPCIÓN ACTIVA
           QUE SEA LA ÚLTIMA DE SU AGENCIA
        ================================================= */

        const suscripciones =
            await conexion.query(
                `
                SELECT

                    s.id
                        AS suscripcion_id,

                    s.agencia_id,

                    a.nombre
                        AS agencia_nombre,

                    DATE_FORMAT(
                        s.fecha_fin,
                        '%Y-%m-%d'
                    )
                        AS fecha_fin_original

                FROM suscripciones s

                INNER JOIN agencias a

                    ON a.id =
                        s.agencia_id

                INNER JOIN
                (
                    SELECT

                        agencia_id,

                        MAX(id)
                            AS suscripcion_id

                    FROM suscripciones

                    GROUP BY
                        agencia_id

                ) ultima

                    ON ultima.suscripcion_id =
                        s.id

                WHERE

                    s.estado =
                        'activa'

                    AND s.fecha_fin IS NOT NULL

                ORDER BY
                    s.id ASC

                LIMIT 1
                `
            );


        if (
            !suscripciones.length
        ) {

            throw new Error(
                "No se encontró una suscripción activa para realizar la prueba."
            );

        }


        const suscripcion =
            suscripciones[0];


        suscripcionId =
            Number(
                suscripcion.suscripcion_id
            );


        agenciaId =
            Number(
                suscripcion.agencia_id
            );


        fechaOriginal =
            suscripcion.fecha_fin_original;


        console.log(
            "\n========================================"
        );

        console.log(
            "PRUEBA DE ALERTAS DE SUSCRIPCIÓN"
        );

        console.log(
            "========================================"
        );


        console.log(
            "Agencia:",
            suscripcion.agencia_nombre
        );


        console.log(
            "Suscripción:",
            `#${suscripcionId}`
        );


        console.log(
            "Fecha original:",
            fechaOriginal
        );


        /* =================================================
           PROBAR CADA UMBRAL
        ================================================= */

        for (
            const escenario
            of escenarios
        ) {

            console.log(
                "\n----------------------------------------"
            );

            console.log(
                `ESCENARIO: ${escenario.dias} día(s)`
            );

            console.log(
                "----------------------------------------"
            );


            /*
             * Modificamos temporalmente fecha_fin.
             *
             * Los valores vienen de una lista fija
             * definida dentro del propio script.
             */

            await conexion.query(
                `
                UPDATE suscripciones

                SET fecha_fin =
                    DATE_ADD(
                        CURDATE(),
                        INTERVAL ${escenario.dias} DAY
                    )

                WHERE
                    id = ?
                `,
                [
                    suscripcionId
                ]
            );


            const fechaPruebaFilas =
                await conexion.query(
                    `
                    SELECT

                        DATE_FORMAT(
                            fecha_fin,
                            '%Y-%m-%d'
                        ) AS fecha_fin

                    FROM suscripciones

                    WHERE
                        id = ?

                    LIMIT 1
                    `,
                    [
                        suscripcionId
                    ]
                );


            const fechaPrueba =
                fechaPruebaFilas[0]
                    .fecha_fin;


            const claveEvento =
                `suscripcion:${suscripcionId}:${escenario.codigo}:${fechaPrueba}`;


            clavesGeneradas.push(
                claveEvento
            );


            console.log(
                "Fecha temporal:",
                fechaPrueba
            );


            /* =================================================
               PRIMERA EJECUCIÓN
            ================================================= */

            const primera =
                await generarAlertasSuscripcionesAdmin();


            console.log(
                "Primera ejecución:",
                primera
            );


            /* =================================================
               VALIDAR NOTIFICACIÓN SUPERADMIN
            ================================================= */

            const adminFilas =
                await conexion.query(
                    `
                    SELECT

                        id,
                        titulo,
                        nivel,
                        clave_evento

                    FROM notificaciones_admin

                    WHERE
                        clave_evento = ?

                    LIMIT 1
                    `,
                    [
                        claveEvento
                    ]
                );


            if (
                adminFilas.length !==
                1
            ) {

                throw new Error(
                    `No se creó correctamente la notificación SuperAdmin para ${escenario.dias} día(s).`
                );

            }


            console.log(
                "SuperAdmin:",
                adminFilas[0].titulo,
                `(${adminFilas[0].nivel})`
            );


            /* =================================================
               VALIDAR NOTIFICACIÓN DE AGENCIA
            ================================================= */

            const agenciaFilas =
                await conexion.query(
                    `
                    SELECT

                        id,
                        titulo,
                        nivel,
                        audiencia,
                        clave_evento

                    FROM notificaciones_agencia

                    WHERE
                        agencia_id = ?

                        AND clave_evento = ?

                    LIMIT 1
                    `,
                    [
                        agenciaId,
                        claveEvento
                    ]
                );


            if (
                escenario.esperaAgencia
            ) {

                if (
                    agenciaFilas.length !==
                    1
                ) {

                    throw new Error(
                        `La agencia no recibió la alerta correspondiente a ${escenario.dias} día(s).`
                    );

                }


                if (
                    agenciaFilas[0]
                        .audiencia !==
                    "administradores"
                ) {

                    throw new Error(
                        "La alerta de suscripción de la agencia no está limitada a administradores."
                    );

                }


                console.log(
                    "Agencia:",
                    agenciaFilas[0].titulo,
                    `(${agenciaFilas[0].audiencia})`
                );

            } else {

                if (
                    agenciaFilas.length !==
                    0
                ) {

                    throw new Error(
                        "Se creó una alerta de agencia después del vencimiento cuando no debía."
                    );

                }


                console.log(
                    "Agencia:",
                    "sin nueva notificación, como se esperaba"
                );

            }


            /* =================================================
               SEGUNDA EJECUCIÓN
               DEBE DETECTAR DUPLICADO
            ================================================= */

            const segunda =
                await generarAlertasSuscripcionesAdmin();


            console.log(
                "Segunda ejecución:",
                segunda
            );


            const adminConteo =
                await conexion.query(
                    `
                    SELECT

                        COUNT(*) AS total

                    FROM notificaciones_admin

                    WHERE
                        clave_evento = ?
                    `,
                    [
                        claveEvento
                    ]
                );


            if (
                Number(
                    adminConteo[0].total
                ) !==
                1
            ) {

                throw new Error(
                    "Se creó una notificación SuperAdmin duplicada."
                );

            }


            const agenciaConteo =
                await conexion.query(
                    `
                    SELECT

                        COUNT(*) AS total

                    FROM notificaciones_agencia

                    WHERE
                        agencia_id = ?

                        AND clave_evento = ?
                    `,
                    [
                        agenciaId,
                        claveEvento
                    ]
                );


            const esperadoAgencia =
                escenario.esperaAgencia
                    ? 1
                    : 0;


            if (
                Number(
                    agenciaConteo[0].total
                ) !==
                esperadoAgencia
            ) {

                throw new Error(
                    "La deduplicación de las notificaciones de agencia no funcionó correctamente."
                );

            }


            console.log(
                "Deduplicación:",
                "OK ✅"
            );

        }


        console.log(
            "\n========================================"
        );

        console.log(
            "TODOS LOS UMBRALES FUNCIONARON ✅"
        );

        console.log(
            "========================================"
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

        /* =================================================
           RESTAURAR FECHA ORIGINAL
        ================================================= */

        if (
            conexion &&
            suscripcionId &&
            fechaOriginal
        ) {

            try {

                await conexion.query(
                    `
                    UPDATE suscripciones

                    SET fecha_fin = ?

                    WHERE
                        id = ?
                    `,
                    [
                        fechaOriginal,
                        suscripcionId
                    ]
                );


                console.log(
                    "\nFecha original restaurada:",
                    fechaOriginal
                );


            } catch (error) {

                console.error(
                    "❌ No se pudo restaurar fecha_fin:",
                    error.message
                );

                process.exitCode =
                    1;

            }

        }


        /* =================================================
           ELIMINAR SOLO NOTIFICACIONES DE ESTA PRUEBA
        ================================================= */

        if (
            conexion &&
            clavesGeneradas.length
        ) {

            try {

                for (
                    const claveEvento
                    of clavesGeneradas
                ) {

                    await conexion.query(
                        `
                        DELETE
                        FROM notificaciones_admin

                        WHERE
                            clave_evento = ?
                        `,
                        [
                            claveEvento
                        ]
                    );


                    await conexion.query(
                        `
                        DELETE
                        FROM notificaciones_agencia

                        WHERE
                            agencia_id = ?

                            AND clave_evento = ?
                        `,
                        [
                            agenciaId,
                            claveEvento
                        ]
                    );

                }


                console.log(
                    "Notificaciones de prueba eliminadas."
                );


            } catch (error) {

                console.error(
                    "❌ Error eliminando las notificaciones de prueba:",
                    error.message
                );

                process.exitCode =
                    1;

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


ejecutar();