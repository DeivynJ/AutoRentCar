
const path =
    require(
        "path"
    );


/* =========================================================
   VARIABLES DE ENTORNO
========================================================= */

require("dotenv").config({
    path: path.join(
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
    crearReservacionWeb
} = require(
    "../services/reservacionService"
);


/* =========================================================
   PRUEBA DIRECTA DEL SERVICIO DE RESERVACIONES

   IMPORTANTE:
   - Crea una reservación real temporal.
   - Comprueba cabecera y adicionales.
   - La elimina al finalizar.
   - La FK ON DELETE CASCADE elimina los adicionales.
========================================================= */

async function ejecutarPrueba() {

    let reservacionCreada =
        null;


    try {

        console.log(
            "\n============================================"
        );

        console.log(
            "PRUEBA DE CREACIÓN REAL DE RESERVACIÓN"
        );

        console.log(
            "============================================\n"
        );


        /* -------------------------------------------------
           CREAR RESERVACIÓN TEMPORAL
        ------------------------------------------------- */

        reservacionCreada =
            await crearReservacionWeb({

                slug:
                    "the-nenerentcar",

                datos: {

                    modeloId:
                        1,

                    cantidad:
                        1,


                    lugarRecogida:
                        "Aeropuerto Internacional del Cibao",

                    lugarEntrega:
                        "Hotel de prueba en Santiago",


                    fechaRecogida:
                        "2026-10-20",

                    horaRecogida:
                        "10:00",


                    fechaEntrega:
                        "2026-10-23",

                    horaEntrega:
                        "10:00",


                    cliente: {

                        nombre:
                            "Cliente de Prueba",

                        documento:
                            "00100000000",

                        correo:
                            "prueba@autorentcar.test",

                        telefono:
                            "809-555-0101",

                        edad:
                            30,

                        licencia:
                            "PRUEBA-12345"

                    },


                    adicionales: [
                        "gps-adicional",
                        "asiento-infantil"
                    ],


                    codigoPromocional:
                        "AUTO15",


                    comentarios:
                        "Reservación temporal creada para probar el servicio."

                }

            });


        console.log(
            "✅ Reservación creada por el servicio.\n"
        );


        console.log(
            JSON.stringify(
                reservacionCreada,
                null,
                2
            )
        );


        /* -------------------------------------------------
           COMPROBAR CABECERA EN MARIADB
        ------------------------------------------------- */

        const reservaciones =
            await pool.query(
                `
                SELECT

                    id,
                    agencia_id,
                    codigo,

                    modelo_id,
                    cantidad_vehiculos,

                    lugar_recogida,
                    lugar_entrega,

                    fecha_recogida,
                    hora_recogida,

                    fecha_entrega,
                    hora_entrega,

                    cliente_nombre,

                    precio_diario,
                    subtotal,
                    costo_adicionales,
                    descuento,
                    total,

                    codigo_promocional,

                    estado,
                    origen

                FROM reservaciones

                WHERE
                    id = ?

                LIMIT 1
                `,
                [
                    reservacionCreada.id
                ]
            );


        console.log(
            "\n============================================"
        );

        console.log(
            "REGISTRO GUARDADO EN reservaciones"
        );

        console.log(
            "============================================\n"
        );


        console.log(
            reservaciones[0] ||
            "No se encontró la reservación."
        );


        /* -------------------------------------------------
           COMPROBAR SNAPSHOT DE ADICIONALES
        ------------------------------------------------- */

        const adicionales =
            await pool.query(
                `
                SELECT

                    id,
                    reservacion_id,
                    codigo,
                    nombre,
                    precio_diario,
                    cantidad_vehiculos,
                    dias,
                    costo_total

                FROM reservacion_adicionales

                WHERE
                    reservacion_id = ?

                ORDER BY
                    id ASC
                `,
                [
                    reservacionCreada.id
                ]
            );


        console.log(
            "\n============================================"
        );

        console.log(
            "ADICIONALES GUARDADOS"
        );

        console.log(
            "============================================\n"
        );


        console.log(
            adicionales
        );


        if (
            reservaciones.length !== 1
        ) {

            throw new Error(
                "La reservación no quedó almacenada correctamente."
            );

        }


        if (
            adicionales.length !== 2
        ) {

            throw new Error(
                "No se guardaron correctamente los dos adicionales."
            );

        }


        console.log(
            "\n✅ Cabecera y adicionales verificados correctamente."
        );


    } catch (error) {

        console.error(
            "\n❌ ERROR DURANTE LA PRUEBA"
        );


        console.error(
            "Código:",
            error.codigo ||
            error.code ||
            "SIN_CODIGO"
        );


        console.error(
            "Mensaje:",
            error.message
        );


        if (
            error.cantidadDisponible !==
            undefined
        ) {

            console.error(
                "Cantidad disponible:",
                error.cantidadDisponible
            );

        }


        process.exitCode =
            1;


    } finally {

        /* -------------------------------------------------
           LIMPIEZA

           Solo elimina la reservación creada por
           este mismo script.

           reservacion_adicionales se elimina
           automáticamente mediante ON DELETE CASCADE.
        ------------------------------------------------- */

        if (
            reservacionCreada &&
            reservacionCreada.id
        ) {

            try {

                console.log(
                    "\n============================================"
                );

                console.log(
                    "LIMPIEZA DE DATOS TEMPORALES"
                );

                console.log(
                    "============================================\n"
                );


                await pool.query(
                    `
                    DELETE FROM reservaciones

                    WHERE
                        id = ?
                    `,
                    [
                        reservacionCreada.id
                    ]
                );


                const reservacionesRestantes =
                    await pool.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM reservaciones

                        WHERE
                            id = ?
                        `,
                        [
                            reservacionCreada.id
                        ]
                    );


                const adicionalesRestantes =
                    await pool.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM reservacion_adicionales

                        WHERE
                            reservacion_id = ?
                        `,
                        [
                            reservacionCreada.id
                        ]
                    );


                console.log(
                    "Reservaciones temporales restantes:",
                    Number(
                        reservacionesRestantes[0]
                            .total
                    )
                );


                console.log(
                    "Adicionales temporales restantes:",
                    Number(
                        adicionalesRestantes[0]
                            .total
                    )
                );


                if (
                    Number(
                        reservacionesRestantes[0]
                            .total
                    ) === 0 &&
                    Number(
                        adicionalesRestantes[0]
                            .total
                    ) === 0
                ) {

                    console.log(
                        "\n✅ Base de datos limpia."
                    );

                } else {

                    console.error(
                        "\n❌ La limpieza no quedó completa."
                    );


                    process.exitCode =
                        1;

                }


            } catch (errorLimpieza) {

                console.error(
                    "\n❌ No fue posible limpiar la reservación temporal."
                );


                console.error(
                    errorLimpieza.message
                );


                process.exitCode =
                    1;

            }

        }


        try {

            await pool.end();

        } catch (
            errorPool
        ) {

            console.error(
                "No fue posible cerrar el pool:",
                errorPool.message
            );

        }

    }

}


ejecutarPrueba();