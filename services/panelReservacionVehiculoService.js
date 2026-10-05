/* =========================================================
   AUTORENTCAR
   ASIGNACIÓN DE UNIDADES FÍSICAS A RESERVACIONES
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   ERROR CONTROLADO
========================================================= */

function crearErrorAsignacionVehiculo(
    codigo,
    mensaje,
    status = 400
) {

    const error =
        new Error(
            mensaje
        );


    error.codigo =
        codigo;


    error.status =
        status;


    return error;

}


/* =========================================================
   VALIDAR ID
========================================================= */

function validarId(
    valor,
    nombre
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isInteger(
            numero
        ) ||
        numero <= 0
    ) {

        throw crearErrorAsignacionVehiculo(
            "ID_INVALIDO",
            `${nombre} no es válido.`
        );

    }


    return numero;

}


/* =========================================================
   ASIGNAR UNIDAD FÍSICA
========================================================= */

async function asignarUnidadFisicaReservacion({

    agenciaId,

    reservacionId,

    vehiculoId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    const vehiculoIdSeguro =
        validarId(
            vehiculoId,
            "El vehículo"
        );


    let conexion;

    let transaccionIniciada =
        false;


    try {

        conexion =
            await pool.getConnection();


        await conexion
            .beginTransaction();


        transaccionIniciada =
            true;


        /* =================================================
           BLOQUEAR Y VALIDAR RESERVACIÓN
        ================================================= */

        const reservaciones =
            await conexion.query(
                `
                SELECT

    id,
    agencia_id,
    modelo_id,
    cantidad_vehiculos,
    estado,
    fecha_recogida,
    hora_recogida,
    fecha_entrega,
    hora_entrega,

    CASE
        WHEN NOW() >= TIMESTAMP(
            fecha_recogida,
            hora_recogida
        )
            THEN 1
        ELSE 0
    END AS reservacion_vencida

FROM reservaciones

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorAsignacionVehiculo(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no existe dentro de esta agencia.",
                404
            );

        }

        const reservacion =
            reservaciones[0];

/* =================================================
   BLOQUEAR RESERVACIÓN VENCIDA
================================================= */

if (
    Number(
        reservacion.reservacion_vencida
    ) === 1
) {

    throw crearErrorAsignacionVehiculo(

        "RESERVACION_VENCIDA",

        "No es posible asignar una unidad porque la fecha de recogida de la reservación ya venció.",

        409

    );

}

        if (
            reservacion.estado !==
            "confirmada"
        ) {

            throw crearErrorAsignacionVehiculo(
                "RESERVACION_NO_CONFIRMADA",
                "Solo se pueden asignar unidades a una reservación confirmada.",
                409
            );

        }


        /* =================================================
           BLOQUEAR ASIGNACIONES ACTUALES
        ================================================= */

        const asignacionesActuales =
            await conexion.query(
                `
                SELECT
                    id,
                    vehiculo_id

                FROM reservacion_vehiculos

                WHERE
                    reservacion_id = ?

                    AND estado = 'asignado'

                FOR UPDATE
                `,
                [
                    reservacionIdSeguro
                ]
            );


        if (
            asignacionesActuales.length >=
            Number(
                reservacion.cantidad_vehiculos
            )
        ) {

            throw crearErrorAsignacionVehiculo(
                "CANTIDAD_COMPLETA",
                "La reservación ya tiene asignada la cantidad de vehículos solicitada.",
                409
            );

        }


        /* =================================================
           BLOQUEAR Y VALIDAR UNIDAD
        ================================================= */

        const vehiculos =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    modelo_id,
                    codigo_interno,
                    placa,
                    estado

                FROM vehiculos

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    vehiculoIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !vehiculos.length
        ) {

            throw crearErrorAsignacionVehiculo(
                "VEHICULO_NO_ENCONTRADO",
                "La unidad física no existe dentro de esta agencia.",
                404
            );

        }


        const vehiculo =
            vehiculos[0];


        if (
            Number(
                vehiculo.modelo_id
            ) !==
            Number(
                reservacion.modelo_id
            )
        ) {

            throw crearErrorAsignacionVehiculo(
                "MODELO_NO_COINCIDE",
                "La unidad seleccionada no pertenece al modelo solicitado en la reservación.",
                409
            );

        }


        if (
    vehiculo.estado ===
    "alquilado"
) {

    throw crearErrorAsignacionVehiculo(
        "VEHICULO_OCUPADO",
        "La unidad seleccionada se encuentra actualmente alquilada y todavía no ha sido devuelta.",
        409
    );

}


        if (
            [
                "mantenimiento",
                "inactivo"
            ].includes(
                vehiculo.estado
            )
        ) {

            throw crearErrorAsignacionVehiculo(
                "VEHICULO_NO_OPERATIVO",
                "La unidad seleccionada no está operativa para ser asignada.",
                409
            );

        }


        /* =================================================
           EVITAR DUPLICADO EN LA MISMA RESERVACIÓN
        ================================================= */

        const relacionExistente =
            await conexion.query(
                `
                SELECT
                    id,
                    estado

                FROM reservacion_vehiculos

                WHERE
                    reservacion_id = ?

                    AND vehiculo_id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [
                    reservacionIdSeguro,
                    vehiculoIdSeguro
                ]
            );


        if (
            relacionExistente.length &&
            relacionExistente[0].estado ===
                "asignado"
        ) {

            throw crearErrorAsignacionVehiculo(
                "VEHICULO_YA_ASIGNADO",
                "La unidad ya está asignada a esta reservación.",
                409
            );

        }


        /* =================================================
           VALIDAR SOLAPAMIENTO DE LA UNIDAD
        ================================================= */

        const conflictos =
            await conexion.query(
                `
                SELECT

                    rv.id,
                    rv.reservacion_id,
                    r.codigo

                FROM reservacion_vehiculos rv

                INNER JOIN reservaciones r

                    ON r.id =
                        rv.reservacion_id

                WHERE
                    rv.vehiculo_id = ?

                    AND rv.estado = 'asignado'

                    AND r.agencia_id = ?

                    AND r.id <> ?

                    AND (

    r.estado = 'en_curso'

    OR (

        r.estado = 'confirmada'

        AND (

            r.fecha_recogida < ?

            OR (

                r.fecha_recogida = ?

                AND r.hora_recogida < ?

            )

        )

        AND (

            r.fecha_entrega > ?

            OR (

                r.fecha_entrega = ?

                AND r.hora_entrega > ?

            )

        )

    )

)

                LIMIT 1

                FOR UPDATE
                `,
                [
                    vehiculoIdSeguro,
                    agenciaIdSeguro,
                    reservacionIdSeguro,

                    reservacion.fecha_entrega,
                    reservacion.fecha_entrega,
                    reservacion.hora_entrega,

                    reservacion.fecha_recogida,
                    reservacion.fecha_recogida,
                    reservacion.hora_recogida
                ]
            );


        if (
            conflictos.length
        ) {

            throw crearErrorAsignacionVehiculo(
                "VEHICULO_OCUPADO",
                `La unidad ya está asignada a la reservación ${conflictos[0].codigo} durante un período que se solapa.`,
                409
            );

        }


        /* =================================================
           CREAR O REACTIVAR ASIGNACIÓN
        ================================================= */

        if (
            relacionExistente.length
        ) {

            await conexion.query(
                `
                UPDATE reservacion_vehiculos

                SET
                    estado = 'asignado',
                    fecha_asignacion = CURRENT_TIMESTAMP

                WHERE
                    id = ?
                `,
                [
                    relacionExistente[0].id
                ]
            );

        } else {

            await conexion.query(
                `
                INSERT INTO reservacion_vehiculos (
                    reservacion_id,
                    vehiculo_id,
                    estado
                )
                VALUES (
                    ?,
                    ?,
                    'asignado'
                )
                `,
                [
                    reservacionIdSeguro,
                    vehiculoIdSeguro
                ]
            );

        }


        await conexion
            .commit();


        transaccionIniciada =
            false;


        return {

            reservacionId:
                reservacionIdSeguro,

            vehiculoId:
                vehiculoIdSeguro,

            codigoInterno:
                vehiculo.codigo_interno,

            placa:
                vehiculo.placa ||
                null

        };


    } catch (error) {

        if (
            conexion &&
            transaccionIniciada
        ) {

            try {

                await conexion
                    .rollback();

            } catch (
                rollbackError
            ) {

                console.error(
                    "Error revirtiendo asignación de unidad física:",
                    rollbackError
                );

            }

        }


        throw error;


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   OBTENER UNIDADES DE LA RESERVACIÓN
========================================================= */

async function obtenerUnidadesFisicasReservacion({

    agenciaId,

    reservacionId

}) {

    const agenciaIdSeguro =
        validarId(
            agenciaId,
            "La agencia"
        );


    const reservacionIdSeguro =
        validarId(
            reservacionId,
            "La reservación"
        );


    let conexion;


    try {

        conexion =
            await pool.getConnection();


        /* =================================================
           VALIDAR RESERVACIÓN Y TENANT
        ================================================= */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    agencia_id,
                    modelo_id,
                    cantidad_vehiculos,
                    estado,

                    fecha_recogida,
                    hora_recogida,

                    fecha_entrega,
                    hora_entrega

                FROM reservaciones

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionIdSeguro,
                    agenciaIdSeguro
                ]
            );


        if (
            !reservaciones.length
        ) {

            throw crearErrorAsignacionVehiculo(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no existe dentro de esta agencia.",
                404
            );

        }


        const reservacion =
            reservaciones[0];


        /* =================================================
           UNIDADES YA ASIGNADAS
        ================================================= */

        const unidadesAsignadas =
            await conexion.query(
                `
                SELECT

                    v.id,
                    v.codigo_interno,
                    v.placa,
                    v.color,
                    v.kilometraje,
                    v.estado,

                    v.sucursal_id,

                    s.nombre
                        AS sucursal_nombre,

                    rv.fecha_asignacion

                FROM reservacion_vehiculos rv

                INNER JOIN vehiculos v

                    ON v.id =
                        rv.vehiculo_id

                    AND v.agencia_id = ?

                INNER JOIN sucursales s

                    ON s.id =
                        v.sucursal_id

                    AND s.agencia_id =
                        v.agencia_id

                WHERE
                    rv.reservacion_id = ?

                    AND rv.estado =
                        'asignado'

                ORDER BY
                    v.codigo_interno ASC,
                    v.id ASC
                `,
                [
                    agenciaIdSeguro,
                    reservacionIdSeguro
                ]
            );


        /* =================================================
           UNIDADES CANDIDATAS

           Solo se buscan cuando:
           - la reservación está confirmada
           - todavía faltan unidades
        ================================================= */

        let unidadesCandidatas =
            [];


        if (
            reservacion.estado ===
                "confirmada" &&
            unidadesAsignadas.length <
                Number(
                    reservacion.cantidad_vehiculos
                )
        ) {

            unidadesCandidatas =
                await conexion.query(
                    `
                    SELECT

                        v.id,
                        v.codigo_interno,
                        v.placa,
                        v.color,
                        v.kilometraje,
                        v.estado,

                        v.sucursal_id,

                        s.nombre
                            AS sucursal_nombre

                    FROM vehiculos v

                    INNER JOIN sucursales s

                        ON s.id =
                            v.sucursal_id

                        AND s.agencia_id =
                            v.agencia_id

                    WHERE
                        v.agencia_id = ?

                        AND v.modelo_id = ?

                        AND v.estado NOT IN (
                        'mantenimiento',
                        'inactivo',
                        'alquilado'
                        
                        )

                        AND NOT EXISTS (

                            SELECT
                                1

                            FROM reservacion_vehiculos
                                rv_actual

                            WHERE
                                rv_actual.reservacion_id = ?

                                AND rv_actual.vehiculo_id =
                                    v.id

                                AND rv_actual.estado =
                                    'asignado'

                        )

                        AND NOT EXISTS (

                            SELECT
                                1

                            FROM reservacion_vehiculos
                                rv_conflicto

                            INNER JOIN reservaciones
                                r_conflicto

                                ON r_conflicto.id =
                                    rv_conflicto.reservacion_id

                            WHERE
                                rv_conflicto.vehiculo_id =
                                    v.id

                                AND rv_conflicto.estado =
                                    'asignado'

                                AND r_conflicto.agencia_id = ?

                                AND r_conflicto.id <> ?

                                AND (

    r_conflicto.estado = 'en_curso'

    OR (

        r_conflicto.estado = 'confirmada'

        AND (

            r_conflicto.fecha_recogida < ?

            OR (

                r_conflicto.fecha_recogida = ?

                AND
                r_conflicto.hora_recogida < ?

            )

        )

        AND (

            r_conflicto.fecha_entrega > ?

            OR (

                r_conflicto.fecha_entrega = ?

                AND
                r_conflicto.hora_entrega > ?

            )

        )

    )

)

)

                    ORDER BY
                        v.codigo_interno ASC,
                        v.id ASC
                    `,
                    [
                        agenciaIdSeguro,
                        reservacion.modelo_id,
                        reservacionIdSeguro,

                        agenciaIdSeguro,
                        reservacionIdSeguro,

                        reservacion.fecha_entrega,
                        reservacion.fecha_entrega,
                        reservacion.hora_entrega,

                        reservacion.fecha_recogida,
                        reservacion.fecha_recogida,
                        reservacion.hora_recogida
                    ]
                );

        }


        /* =================================================
           RESUMEN
        ================================================= */

        const cantidadSolicitada =
            Number(
                reservacion.cantidad_vehiculos ||
                0
            );


        const cantidadAsignada =
            unidadesAsignadas.length;


        return {

            puedeAsignar:
                reservacion.estado ===
                    "confirmada" &&
                cantidadAsignada <
                    cantidadSolicitada,

            cantidadSolicitada,

            cantidadAsignada,

            cantidadPendiente:
                Math.max(
                    cantidadSolicitada -
                        cantidadAsignada,
                    0
                ),

            unidadesAsignadas,

            unidadesCandidatas

        };


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

module.exports = {

    asignarUnidadFisicaReservacion,

    obtenerUnidadesFisicasReservacion

};