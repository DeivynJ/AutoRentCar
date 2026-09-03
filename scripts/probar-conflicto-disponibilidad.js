/* =========================================================
   AUTORENTCAR
   PRUEBA COMPLETA DEL MOTOR DE DISPONIBILIDAD

   Todas las reservaciones de prueba se crean dentro
   de una transacción.

   Al finalizar SIEMPRE se ejecuta ROLLBACK.
========================================================= */

const path = require("path");


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
    obtenerDisponibilidadModelo
} = require(
    "../services/disponibilidadService"
);


/* =========================================================
   DATOS REALES PARA LA PRUEBA

   Agencia 2 = The NeneRentCar
   Modelo 1 = Honda CRV

   Según nuestras pruebas:
   Unidades operativas = 2
========================================================= */

const AGENCIA_ID = 2;
const MODELO_ID = 1;


/* =========================================================
   PREFIJO ÚNICO DE ESTA EJECUCIÓN
========================================================= */

const PREFIJO_PRUEBA =
    `TEST-DISP-${Date.now()}`;


/* =========================================================
   MOSTRAR RESULTADO
========================================================= */

function mostrarResultado(
    titulo,
    resultado,
    esperado = null
) {

    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        ` ${titulo}`
    );

    console.log(
        "=============================================="
    );

    console.log(
        `Inicio: ${resultado.periodo.inicio}`
    );

    console.log(
        `Fin:    ${resultado.periodo.fin}`
    );

    console.log("");

    console.log(
        `Capacidad operativa:       ${resultado.capacidadOperativa}`
    );

    console.log(
        `Máximo comprometido:       ${resultado.cantidadComprometida}`
    );

    console.log(
        `Cantidad disponible:       ${resultado.cantidadDisponible}`
    );

    console.log(
        `Reservaciones solapadas:   ${resultado.reservasSolapadas}`
    );


    if (esperado) {

        console.log("");

        const compromisoCorrecto =
            resultado.cantidadComprometida ===
            esperado.comprometido;


        const disponibilidadCorrecta =
            resultado.cantidadDisponible ===
            esperado.disponible;


        const reservasCorrectas =
            resultado.reservasSolapadas ===
            esperado.reservas;


        if (
            compromisoCorrecto &&
            disponibilidadCorrecta &&
            reservasCorrectas
        ) {

            console.log(
                "✅ Resultado esperado."
            );

        } else {

            console.log(
                "❌ El resultado no coincide con lo esperado."
            );

            console.log(
                `Esperado → comprometido: ${esperado.comprometido}, disponible: ${esperado.disponible}, reservas: ${esperado.reservas}`
            );

        }

    }

}


/* =========================================================
   INSERTAR RESERVACIÓN TEMPORAL
========================================================= */

async function insertarReservaTemporal(
    conexion,
    modelo,
    {
        codigo,
        fechaRecogida,
        horaRecogida,
        fechaEntrega,
        horaEntrega,
        cantidad = 1
    }
) {

    const precio =
        Number(
            modelo.precio_diario ||
            0
        );


    await conexion.query(
        `
        INSERT INTO reservaciones (

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

            cliente_telefono,

            precio_diario,

            subtotal,

            costo_adicionales,

            descuento,

            total,

            comentarios,

            estado,

            origen

        )

        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            0,
            0,
            ?,
            ?,
            'pendiente',
            'panel'
        )
        `,
        [

            AGENCIA_ID,

            codigo,

            MODELO_ID,

            cantidad,

            "PRUEBA TEMPORAL",

            "PRUEBA TEMPORAL",

            fechaRecogida,

            horaRecogida,

            fechaEntrega,

            horaEntrega,

            "Cliente de prueba",

            "0000000000",

            precio,

            precio * cantidad,

            precio * cantidad,

            "Reservación temporal para probar disponibilidad."

        ]
    );

}


/* =========================================================
   PROGRAMA PRINCIPAL
========================================================= */

async function ejecutarPrueba() {

    let conexion =
        null;


    let transaccionIniciada =
        false;


    try {

        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           VALIDAR MODELO
        ------------------------------------------------- */

        const modelos =
            await conexion.query(
                `
                SELECT

                    id,

                    agencia_id,

                    nombre,

                    marca,

                    precio_diario,

                    estado

                FROM modelos_vehiculos

                WHERE

                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    MODELO_ID,
                    AGENCIA_ID
                ]
            );


        if (
            modelos.length ===
            0
        ) {

            throw new Error(
                "No se encontró el modelo configurado para la prueba."
            );

        }


        const modelo =
            modelos[0];


        console.log("");
        console.log(
            "=============================================="
        );

        console.log(
            " AUTORENTCAR - PRUEBA COMPLETA"
        );

        console.log(
            "=============================================="
        );

        console.log("");

        console.log(
            `Modelo: ${modelo.marca} ${modelo.nombre}`
        );

        console.log(
            `Prefijo temporal: ${PREFIJO_PRUEBA}`
        );


        /* -------------------------------------------------
           INICIAR TRANSACCIÓN
        ------------------------------------------------- */

        await conexion.beginTransaction();

        transaccionIniciada =
            true;


        /* =================================================
           GRUPO 1

           RESERVA:
           12 sep 10:00 → 15 sep 10:00
           cantidad: 1
        ================================================= */

        await insertarReservaTemporal(
            conexion,
            modelo,
            {

                codigo:
                    `${PREFIJO_PRUEBA}-A`,

                fechaRecogida:
                    "2026-09-12",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-09-15",

                horaEntrega:
                    "10:00",

                cantidad:
                    1

            }
        );


        console.log("");
        console.log(
            "✅ Primera reservación temporal creada."
        );


        /* =================================================
           PRUEBA 1
           MISMO PERÍODO
        ================================================= */

        const prueba1 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-09-12",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-09-15",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 1 - MISMO PERÍODO",
            prueba1,
            {
                comprometido: 1,
                disponible: 1,
                reservas: 1
            }
        );


        /* =================================================
           PRUEBA 2
           SOLAPAMIENTO PARCIAL
        ================================================= */

        const prueba2 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-09-14",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-09-18",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 2 - SOLAPAMIENTO PARCIAL",
            prueba2,
            {
                comprometido: 1,
                disponible: 1,
                reservas: 1
            }
        );


        /* =================================================
           PRUEBA 3
           EMPIEZA EXACTAMENTE CUANDO TERMINA
        ================================================= */

        const prueba3 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-09-15",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-09-18",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 3 - LÍMITE POSTERIOR",
            prueba3,
            {
                comprometido: 0,
                disponible: 2,
                reservas: 0
            }
        );


        /* =================================================
           PRUEBA 4
           TERMINA EXACTAMENTE CUANDO COMIENZA
        ================================================= */

        const prueba4 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-09-10",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-09-12",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 4 - LÍMITE ANTERIOR",
            prueba4,
            {
                comprometido: 0,
                disponible: 2,
                reservas: 0
            }
        );


        /* =================================================
           GRUPO 2
           DOS RESERVAS CONSECUTIVAS

           Reserva B:
           10 oct → 12 oct
           cantidad 1

           Reserva C:
           12 oct → 14 oct
           cantidad 1

           Consulta:
           10 oct → 14 oct

           Hay dos reservas encontradas,
           pero nunca coinciden.

           PICO CORRECTO = 1
        ================================================= */

        await insertarReservaTemporal(
            conexion,
            modelo,
            {

                codigo:
                    `${PREFIJO_PRUEBA}-B`,

                fechaRecogida:
                    "2026-10-10",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-12",

                horaEntrega:
                    "10:00",

                cantidad:
                    1

            }
        );


        await insertarReservaTemporal(
            conexion,
            modelo,
            {

                codigo:
                    `${PREFIJO_PRUEBA}-C`,

                fechaRecogida:
                    "2026-10-12",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-14",

                horaEntrega:
                    "10:00",

                cantidad:
                    1

            }
        );


        const prueba5 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-10-10",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-14",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 5 - DOS RESERVAS CONSECUTIVAS",
            prueba5,
            {
                comprometido: 1,
                disponible: 1,
                reservas: 2
            }
        );


        /* =================================================
           GRUPO 3
           DOS RESERVAS QUE SÍ COINCIDEN

           Reserva D:
           20 oct → 24 oct
           cantidad 1

           Reserva E:
           22 oct → 26 oct
           cantidad 1

           Entre 22 y 24 hay dos vehículos
           comprometidos simultáneamente.

           PICO CORRECTO = 2
        ================================================= */

        await insertarReservaTemporal(
            conexion,
            modelo,
            {

                codigo:
                    `${PREFIJO_PRUEBA}-D`,

                fechaRecogida:
                    "2026-10-20",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-24",

                horaEntrega:
                    "10:00",

                cantidad:
                    1

            }
        );


        await insertarReservaTemporal(
            conexion,
            modelo,
            {

                codigo:
                    `${PREFIJO_PRUEBA}-E`,

                fechaRecogida:
                    "2026-10-22",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-26",

                horaEntrega:
                    "10:00",

                cantidad:
                    1

            }
        );


        const prueba6 =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    AGENCIA_ID,

                modeloId:
                    MODELO_ID,

                fechaRecogida:
                    "2026-10-20",

                horaRecogida:
                    "10:00",

                fechaEntrega:
                    "2026-10-26",

                horaEntrega:
                    "10:00",

                conexion

            });


        mostrarResultado(
            "PRUEBA 6 - DOS RESERVAS SIMULTÁNEAS",
            prueba6,
            {
                comprometido: 2,
                disponible: 0,
                reservas: 2
            }
        );


        /* =================================================
           ROLLBACK
        ================================================= */

        await conexion.rollback();

        transaccionIniciada =
            false;


        console.log("");
        console.log(
            "=============================================="
        );

        console.log(
            " ROLLBACK REALIZADO"
        );

        console.log(
            "=============================================="
        );


        /* -------------------------------------------------
           COMPROBAR LIMPIEZA
        ------------------------------------------------- */

        const comprobacion =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total

                FROM reservaciones

                WHERE
                    codigo LIKE ?
                `,
                [
                    `${PREFIJO_PRUEBA}%`
                ]
            );


        const totalRestante =
            Number(
                comprobacion[0]
                    ?.total ||
                0
            );


        console.log("");

        console.log(
            `Reservaciones temporales restantes: ${totalRestante}`
        );


        if (
            totalRestante ===
            0
        ) {

            console.log(
                "✅ La base de datos quedó limpia."
            );

        } else {

            console.log(
                "❌ Existen reservaciones temporales restantes."
            );

        }


    } catch (error) {

        console.log("");

        console.error(
            "❌ ERROR EN LA PRUEBA"
        );

        console.error(
            "----------------------------------------------"
        );

        console.error(
            error.message
        );


        if (
            conexion &&
            transaccionIniciada
        ) {

            try {

                await conexion.rollback();

                console.log(
                    "✅ Se ejecutó ROLLBACK después del error."
                );

            } catch (
                errorRollback
            ) {

                console.error(
                    "❌ No se pudo completar el ROLLBACK."
                );

            }

        }


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

ejecutarPrueba();