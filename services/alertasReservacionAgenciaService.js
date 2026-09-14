const {
    pool
} = require("../config/database");


const {
    crearNotificacionAgencia
} =
    require("./notificacionAgenciaService");



async function generarAlertasEntregaPendiente() {

    const conexion =
        await pool.getConnection();


    try {


        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.agencia_id,
                    r.codigo,
                    r.fecha_recogida,
                    r.hora_recogida,

                    COUNT(rv.id) AS unidades_asignadas

                FROM reservaciones r


                LEFT JOIN reservacion_vehiculos rv

                    ON rv.reservacion_id = r.id

                    AND rv.estado = 'asignado'


                WHERE

                    r.estado = 'confirmada'

                    AND r.fecha_recogida = CURDATE()


                GROUP BY

                    r.id


                HAVING

                    unidades_asignadas =
                    (
                        SELECT
                            cantidad_vehiculos

                        FROM reservaciones

                        WHERE id = r.id
                    )

                `
            );



        for (
            const reservacion
            of reservaciones
        ) {


            const fechaEvento =
    new Date(reservacion.fecha_recogida)
        .toISOString()
        .split("T")[0];


const claveEvento =
    `reservacion:${reservacion.id}:entrega:${fechaEvento}`;



            await crearNotificacionAgencia({

                agenciaId:
                    reservacion.agencia_id,


                categoria:
                    "reservaciones",


                tipo:
                    "entrega_pendiente",


                claveEvento,


                titulo:
                    "Vehículo pendiente de entrega",


                mensaje:
                    `La reservación ${reservacion.codigo} tiene entrega programada para hoy a las ${reservacion.hora_recogida}.`,


                destinoUrl:
                    `/panel/reservaciones/${reservacion.id}`,


                entidadTipo:
                    "reservacion",


                entidadId:
                    reservacion.id,


                nivel:
                    "info",


                audiencia:
                    "todos"

            });

        }


    } finally {

        conexion.release();

    }

}

async function generarAlertasDevolucionPendiente() {

    const conexion =
        await pool.getConnection();


    let revisadas =
        0;

    let creadas =
        0;

    let duplicadas =
        0;


    try {

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,

                    r.agencia_id,

                    r.codigo,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%Y-%m-%d'
                    ) AS fecha_evento,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i'
                    ) AS hora_entrega,

                    (
                        SELECT
                            GROUP_CONCAT(
                                v.codigo_interno
                                ORDER BY v.codigo_interno
                                SEPARATOR ', '
                            )

                        FROM reservacion_vehiculos rv

                        INNER JOIN vehiculos v
                            ON v.id = rv.vehiculo_id

                        WHERE
                            rv.reservacion_id = r.id
                            AND rv.estado = 'asignado'

                    ) AS unidades_asignadas

                FROM reservaciones r

                WHERE

                    r.estado = 'en_curso'

                    AND r.fecha_entrega = CURDATE()

                    AND
                    (
                        SELECT
                            COUNT(*)

                        FROM reservacion_vehiculos rv2

                        WHERE
                            rv2.reservacion_id = r.id
                            AND rv2.estado = 'asignado'
                    ) = r.cantidad_vehiculos

                ORDER BY
                    r.hora_entrega ASC,
                    r.id ASC
                `
            );


        revisadas =
            reservaciones.length;


        for (
            const reservacion
            of reservaciones
        ) {

            const claveEvento =
                `reservacion:${reservacion.id}:devolucion:${reservacion.fecha_evento}`;


            const unidades =
                reservacion.unidades_asignadas ||
                "Unidad asignada";


            const resultado =
                await crearNotificacionAgencia({

                    agenciaId:
                        reservacion.agencia_id,

                    categoria:
                        "reservaciones",

                    tipo:
                        "devolucion_pendiente",

                    claveEvento,

                    titulo:
                        "Vehículo pendiente de devolución",

                    mensaje:
                        `La reservación ${reservacion.codigo} tiene devolución programada para hoy a las ${reservacion.hora_entrega}. Unidad(es): ${unidades}.`,

                    destinoUrl:
                        `/panel/reservaciones/${reservacion.id}`,

                    entidadTipo:
                        "reservacion",

                    entidadId:
                        reservacion.id,

                    nivel:
                        "advertencia",

                    audiencia:
                        "todos",

                    conexion

                });


            if (
                resultado.creada
            ) {

                creadas++;

            }


            if (
                resultado.duplicada
            ) {

                duplicadas++;

            }

        }


        return {

            revisadas,

            creadas,

            duplicadas

        };


    } finally {

        conexion.release();

    }

}

async function generarAlertasDevolucionAtrasada() {

    const conexion =
        await pool.getConnection();


    let revisadas =
        0;

    let creadas =
        0;

    let duplicadas =
        0;


    try {

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,

                    r.agencia_id,

                    r.codigo,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%Y-%m-%d'
                    ) AS fecha_entrega,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i'
                    ) AS hora_entrega,

                    (
                        SELECT
                            GROUP_CONCAT(
                                v.codigo_interno
                                ORDER BY v.codigo_interno
                                SEPARATOR ', '
                            )

                        FROM reservacion_vehiculos rv

                        INNER JOIN vehiculos v
                            ON v.id = rv.vehiculo_id

                        WHERE
                            rv.reservacion_id = r.id
                            AND rv.estado = 'asignado'

                    ) AS unidades_asignadas

                FROM reservaciones r

                WHERE

                    r.estado = 'en_curso'

                    AND NOW() >
                        TIMESTAMP(
                            r.fecha_entrega,
                            r.hora_entrega
                        )

                    AND
                    (
                        SELECT
                            COUNT(*)

                        FROM reservacion_vehiculos rv2

                        WHERE
                            rv2.reservacion_id = r.id
                            AND rv2.estado = 'asignado'

                    ) = r.cantidad_vehiculos

                ORDER BY
                    r.fecha_entrega ASC,
                    r.hora_entrega ASC,
                    r.id ASC
                `
            );


        revisadas =
            reservaciones.length;


        for (
            const reservacion
            of reservaciones
        ) {

            const claveEvento =
                `reservacion:${reservacion.id}:devolucion_atrasada`;


            const unidades =
                reservacion.unidades_asignadas ||
                "Unidad asignada";


            const resultado =
                await crearNotificacionAgencia({

                    agenciaId:
                        reservacion.agencia_id,

                    categoria:
                        "reservaciones",

                    tipo:
                        "devolucion_atrasada",

                    claveEvento,

                    titulo:
                        "Devolución de vehículo atrasada",

                    mensaje:
                        `La reservación ${reservacion.codigo} tenía devolución programada para el ${reservacion.fecha_entrega} a las ${reservacion.hora_entrega} y todavía se encuentra en curso. Unidad(es): ${unidades}.`,

                    destinoUrl:
                        `/panel/reservaciones/${reservacion.id}`,

                    entidadTipo:
                        "reservacion",

                    entidadId:
                        reservacion.id,

                    nivel:
                        "critica",

                    audiencia:
                        "todos",

                    conexion

                });


            if (
                resultado.creada
            ) {

                creadas++;

            }


            if (
                resultado.duplicada
            ) {

                duplicadas++;

            }

        }


        return {

            revisadas,

            creadas,

            duplicadas

        };


    } finally {

        conexion.release();

    }

}

module.exports = {

    generarAlertasEntregaPendiente,

    generarAlertasDevolucionPendiente,

    generarAlertasDevolucionAtrasada

};