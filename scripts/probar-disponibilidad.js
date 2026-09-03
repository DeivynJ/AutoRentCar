/* =========================================================
   AUTORENTCAR
   PRUEBA DEL MOTOR DE DISPONIBILIDAD

   IMPORTANTE:
   Este script es únicamente de lectura.
   No crea, modifica ni elimina datos.
========================================================= */

const path = require("path");
const readline = require("readline");


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


/* =========================================================
   BASE DE DATOS
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   SERVICIO DE DISPONIBILIDAD
========================================================= */

const {
    obtenerDisponibilidadModelo
} = require(
    "../services/disponibilidadService"
);


/* =========================================================
   CONSOLA INTERACTIVA
========================================================= */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function preguntar(texto) {

    return new Promise(
        (resolve) => {

            rl.question(
                texto,
                (respuesta) => {

                    resolve(
                        respuesta.trim()
                    );

                }
            );

        }
    );

}


/* =========================================================
   PROGRAMA PRINCIPAL
========================================================= */

async function probarDisponibilidad() {

    let conexion;


    try {

        console.log("");
        console.log(
            "=============================================="
        );

        console.log(
            " AUTORENTCAR - PRUEBA DE DISPONIBILIDAD"
        );

        console.log(
            "=============================================="
        );

        console.log("");


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           AGENCIAS DISPONIBLES
        ------------------------------------------------- */

        const agencias =
            await conexion.query(
                `
                SELECT
                    id,
                    nombre,
                    slug,
                    estado
                FROM agencias
                ORDER BY id ASC
                `
            );


        if (
            agencias.length ===
            0
        ) {

            console.log(
                "❌ No existen agencias registradas."
            );

            return;

        }


        console.log(
            "AGENCIAS"
        );

        console.log(
            "----------------------------------------------"
        );


        for (
            const agencia
            of agencias
        ) {

            console.log(
                `${Number(agencia.id)} - ${agencia.nombre} (${agencia.estado})`
            );

        }


        console.log("");


        const agenciaId =
            await preguntar(
                "ID de la agencia a probar: "
            );


        /* -------------------------------------------------
           VALIDAR AGENCIA
        ------------------------------------------------- */

        const agenciaSeleccionada =
            agencias.find(
                (agencia) =>
                    Number(agencia.id) ===
                    Number(agenciaId)
            );


        if (
            !agenciaSeleccionada
        ) {

            console.log("");
            console.log(
                "❌ La agencia indicada no existe."
            );

            return;

        }


        /* -------------------------------------------------
           MODELOS DE LA AGENCIA
        ------------------------------------------------- */

        const modelos =
            await conexion.query(
                `
                SELECT

                    m.id,

                    m.nombre,

                    m.marca,

                    m.estado,

                    m.precio_diario,

                    COUNT(v.id) AS total_unidades,

                    SUM(
                        CASE
                            WHEN v.estado NOT IN (
                                'mantenimiento',
                                'inactivo'
                            )
                            THEN 1
                            ELSE 0
                        END
                    ) AS unidades_operativas

                FROM modelos_vehiculos m

                LEFT JOIN vehiculos v
                    ON v.modelo_id = m.id
                    AND v.agencia_id = m.agencia_id

                WHERE
                    m.agencia_id = ?

                GROUP BY
                    m.id,
                    m.nombre,
                    m.marca,
                    m.estado,
                    m.precio_diario

                ORDER BY
                    m.id ASC
                `,
                [
                    Number(
                        agenciaSeleccionada.id
                    )
                ]
            );


        if (
            modelos.length ===
            0
        ) {

            console.log("");
            console.log(
                "❌ Esta agencia no tiene modelos registrados."
            );

            return;

        }


        console.log("");
        console.log(
            `MODELOS DE ${agenciaSeleccionada.nombre.toUpperCase()}`
        );

        console.log(
            "----------------------------------------------"
        );


        for (
            const modelo
            of modelos
        ) {

            console.log(
                [
                    `${Number(modelo.id)} -`,
                    `${modelo.marca}`,
                    `${modelo.nombre}`,
                    `| Estado: ${modelo.estado}`,
                    `| Unidades: ${Number(modelo.total_unidades || 0)}`,
                    `| Operativas: ${Number(modelo.unidades_operativas || 0)}`
                ].join(" ")
            );

        }


        console.log("");


        const modeloId =
            await preguntar(
                "ID del modelo a probar: "
            );


        const modeloSeleccionado =
            modelos.find(
                (modelo) =>
                    Number(modelo.id) ===
                    Number(modeloId)
            );


        if (
            !modeloSeleccionado
        ) {

            console.log("");
            console.log(
                "❌ El modelo indicado no pertenece a esta agencia."
            );

            return;

        }


        /* -------------------------------------------------
           PERÍODO A CONSULTAR
        ------------------------------------------------- */

        console.log("");
        console.log(
            "PERÍODO DE PRUEBA"
        );

        console.log(
            "----------------------------------------------"
        );


        const fechaRecogida =
            await preguntar(
                "Fecha de recogida (YYYY-MM-DD): "
            );


        const horaRecogida =
            await preguntar(
                "Hora de recogida (HH:MM): "
            );


        const fechaEntrega =
            await preguntar(
                "Fecha de entrega (YYYY-MM-DD): "
            );


        const horaEntrega =
            await preguntar(
                "Hora de entrega (HH:MM): "
            );


        /* -------------------------------------------------
           EJECUTAR SERVICIO
        ------------------------------------------------- */

        const resultado =
            await obtenerDisponibilidadModelo({

                agenciaId:
                    Number(
                        agenciaSeleccionada.id
                    ),

                modeloId:
                    Number(
                        modeloSeleccionado.id
                    ),

                fechaRecogida,

                horaRecogida,

                fechaEntrega,

                horaEntrega

            });


        /* -------------------------------------------------
           MOSTRAR RESULTADO
        ------------------------------------------------- */

        console.log("");
        console.log(
            "=============================================="
        );

        console.log(
            " RESULTADO"
        );

        console.log(
            "=============================================="
        );

        console.log("");


        console.log(
            `Agencia: ${agenciaSeleccionada.nombre}`
        );


        console.log(
            `Modelo: ${resultado.modelo.marca} ${resultado.modelo.nombre}`
        );


        console.log(
            `Precio diario: ${resultado.modelo.precioDiario}`
        );


        console.log("");


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


        console.log("");


        if (
            resultado.disponible
        ) {

            console.log(
                `✅ Hay ${resultado.cantidadDisponible} vehículo(s) disponible(s) para ese período.`
            );

        } else {

            console.log(
                "❌ No hay vehículos disponibles para ese período."
            );

        }


        console.log("");

        console.log(
            "✅ Prueba terminada. No se modificó ningún dato."
        );


    } catch (error) {

        console.log("");

        console.error(
            "❌ ERROR EN LA PRUEBA"
        );

        console.error(
            "----------------------------------------------"
        );


        if (
            error.codigo
        ) {

            console.error(
                `Código: ${error.codigo}`
            );

        }


        console.error(
            `Detalle: ${error.message}`
        );


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }


        rl.close();


        await pool.end();

    }

}


/* =========================================================
   EJECUTAR
========================================================= */

probarDisponibilidad();