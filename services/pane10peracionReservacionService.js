const { pool } = require("../config/database");


function crearErrorOperacion(codigo, mensaje, status = 400) {

    const error = new Error(mensaje);

    error.codigo = codigo;
    error.status = status;

    return error;
}


function validarId(valor) {

    const id = Number(valor);

    return Number.isInteger(id) && id > 0;
}


async function entregarVehiculoReservacion({
    agenciaId,
    reservacionId
}) {

    if (
        !validarId(agenciaId) ||
        !validarId(reservacionId)
    ) {
        throw crearErrorOperacion(
            "ID_INVALIDO",
            "Los datos de la reservación no son válidos."
        );
    }


    const conexion = await pool.getConnection();


    try {

        await conexion.beginTransaction();


        /*
         * 1. Buscar y bloquear la reservación.
         */
        const reservaciones = await conexion.query(
    `
    SELECT
        id,
        agencia_id,
        modelo_id,
        cantidad_vehiculos,
        estado,

        fecha_recogida,
        hora_recogida,

        CASE
            WHEN NOW() >= TIMESTAMP(
                fecha_recogida,
                COALESCE(
                    hora_recogida,
                    '00:00:00'
                )
            )
                THEN 1
            ELSE 0
        END AS entrega_habilitada

    FROM reservaciones

    WHERE
        id = ?
        AND agencia_id = ?

    LIMIT 1

    FOR UPDATE
    `,
    [
        reservacionId,
        agenciaId
    ]
);


        if (!reservaciones.length) {

            throw crearErrorOperacion(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no fue encontrada.",
                404
            );
        }


        const reservacion = reservaciones[0];


        /*
         * 2. Solo una reservación confirmada
         *    puede pasar a entrega.
         */
        if (reservacion.estado !== "confirmada") {

            throw crearErrorOperacion(
                "RESERVACION_NO_CONFIRMADA",
                "La reservación debe estar confirmada antes de entregar el vehículo."
            );
        }

        /*
 * 3. No permitir entregar antes de
 *    la fecha y hora de recogida.
 */
if (
    Number(
        reservacion.entrega_habilitada
    ) !== 1
) {

    throw crearErrorOperacion(
        "ENTREGA_ANTICIPADA",
        "El vehículo todavía no puede ser entregado porque no ha llegado la fecha y hora de recogida."
    );
}

        /*
         * 3. Obtener las unidades físicas
         *    asignadas a esta reservación.
         */
        const unidades = await conexion.query(
            `
            SELECT
                rv.id AS relacion_id,
                rv.vehiculo_id,
                v.codigo_interno,
                v.placa,
                v.estado,
                v.modelo_id,
                v.agencia_id
            FROM reservacion_vehiculos rv
            INNER JOIN vehiculos v
                ON v.id = rv.vehiculo_id
            WHERE rv.reservacion_id = ?
              AND rv.estado = 'asignado'
            FOR UPDATE
            `,
            [
                reservacionId
            ]
        );


        const cantidadSolicitada =
            Number(reservacion.cantidad_vehiculos || 0);

        const cantidadAsignada =
            unidades.length;


        /*
         * 4. Deben estar asignadas todas las
         *    unidades solicitadas.
         */
        if (cantidadAsignada !== cantidadSolicitada) {

            throw crearErrorOperacion(
                "UNIDADES_INCOMPLETAS",
                "La reservación debe tener todas las unidades físicas asignadas antes de realizar la entrega."
            );
        }


        if (!cantidadAsignada) {

            throw crearErrorOperacion(
                "SIN_UNIDADES",
                "La reservación no tiene unidades físicas asignadas."
            );
        }


        /*
         * 5. Validar nuevamente cada unidad
         *    antes de entregarla.
         */
        for (const unidad of unidades) {

            if (
                Number(unidad.agencia_id) !== Number(agenciaId)
            ) {

                throw crearErrorOperacion(
                    "UNIDAD_OTRA_AGENCIA",
                    "Una de las unidades asignadas no pertenece a esta agencia."
                );
            }


            if (
                Number(unidad.modelo_id) !==
                Number(reservacion.modelo_id)
            ) {

                throw crearErrorOperacion(
                    "MODELO_NO_COINCIDE",
                    "Una de las unidades asignadas no corresponde al modelo reservado."
                );
            }


            if (
                ["mantenimiento", "inactivo", "alquilado"]
                    .includes(unidad.estado)
            ) {

                throw crearErrorOperacion(
                    "UNIDAD_NO_DISPONIBLE",
                    `La unidad ${unidad.codigo_interno} no está disponible para ser entregada.`
                );
            }
        }


        /*
         * 6. Cambiar la reservación:
         *
         * confirmada -> en_curso
         */
        const resultadoReservacion =
    await conexion.query(
                `
                UPDATE reservaciones
                SET estado = 'en_curso'
                WHERE id = ?
                  AND agencia_id = ?
                  AND estado = 'confirmada'
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (resultadoReservacion.affectedRows !== 1) {

            throw crearErrorOperacion(
                "CAMBIO_ESTADO_FALLIDO",
                "No fue posible iniciar el alquiler."
            );
        }


        /*
         * 7. Las unidades entregadas pasan
         *    a estado físico alquilado.
         */
        const idsVehiculos =
            unidades.map(
                unidad => Number(unidad.vehiculo_id)
            );


        const marcadores =
            idsVehiculos
                .map(() => "?")
                .join(", ");


        await conexion.query(
            `
            UPDATE vehiculos
            SET estado = 'alquilado'
            WHERE agencia_id = ?
              AND id IN (${marcadores})
            `,
            [
                agenciaId,
                ...idsVehiculos
            ]
        );


        await conexion.commit();


        return {

            reservacionId:
                Number(reservacion.id),

            estado:
                "en_curso",

            cantidadUnidades:
                cantidadAsignada,

            unidades:
                unidades.map(unidad => ({
                    id:
                        Number(unidad.vehiculo_id),

                    codigoInterno:
                        unidad.codigo_interno,

                    placa:
                        unidad.placa
                }))
        };


    } catch (error) {

        await conexion.rollback();

        throw error;

    } finally {

        conexion.release();
    }
}

async function registrarDevolucionReservacion({
    agenciaId,
    reservacionId
}) {

    if (
        !validarId(agenciaId) ||
        !validarId(reservacionId)
    ) {

        throw crearErrorOperacion(
            "ID_INVALIDO",
            "Los datos de la reservación no son válidos."
        );
    }


    const conexion =
        await pool.getConnection();


    try {

        await conexion.beginTransaction();


        /*
         * 1. Buscar y bloquear la reservación.
         */
        const reservaciones =
    await conexion.query(
                `
                SELECT
                    id,
                    agencia_id,
                    modelo_id,
                    cantidad_vehiculos,
                    estado
                FROM reservaciones
                WHERE id = ?
                  AND agencia_id = ?
                LIMIT 1
                FOR UPDATE
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (!reservaciones.length) {

            throw crearErrorOperacion(
                "RESERVACION_NO_ENCONTRADA",
                "La reservación no fue encontrada.",
                404
            );
        }


        const reservacion =
            reservaciones[0];


        /*
         * 2. Solo una reservación en curso
         *    puede registrar devolución.
         */
        if (
            reservacion.estado !==
            "en_curso"
        ) {

            throw crearErrorOperacion(
                "RESERVACION_NO_EN_CURSO",
                "La reservación debe estar en curso para registrar la devolución."
            );
        }


        /*
         * 3. Obtener las unidades utilizadas
         *    en esta reservación.
         */
        const unidades =
    await conexion.query(
                `
                SELECT
                    rv.vehiculo_id,
                    v.codigo_interno,
                    v.placa,
                    v.estado,
                    v.modelo_id,
                    v.agencia_id
                FROM reservacion_vehiculos rv
                INNER JOIN vehiculos v
                    ON v.id = rv.vehiculo_id
                WHERE rv.reservacion_id = ?
                  AND rv.estado = 'asignado'
                FOR UPDATE
                `,
                [
                    reservacionId
                ]
            );


        const cantidadSolicitada =
            Number(
                reservacion.cantidad_vehiculos ||
                0
            );


        if (
            !unidades.length ||
            unidades.length !==
                cantidadSolicitada
        ) {

            throw crearErrorOperacion(
                "UNIDADES_INCOMPLETAS",
                "No fue posible identificar correctamente todas las unidades de esta reservación."
            );
        }


        /*
         * 4. Validar las unidades antes
         *    de registrar la devolución.
         */
        for (const unidad of unidades) {

            if (
                Number(unidad.agencia_id) !==
                Number(agenciaId)
            ) {

                throw crearErrorOperacion(
                    "UNIDAD_OTRA_AGENCIA",
                    "Una de las unidades no pertenece a esta agencia."
                );
            }


            if (
                Number(unidad.modelo_id) !==
                Number(reservacion.modelo_id)
            ) {

                throw crearErrorOperacion(
                    "MODELO_NO_COINCIDE",
                    "Una de las unidades no corresponde al modelo de la reservación."
                );
            }


            if (
                unidad.estado !==
                "alquilado"
            ) {

                throw crearErrorOperacion(
                    "UNIDAD_NO_ALQUILADA",
                    `La unidad ${unidad.codigo_interno} no figura actualmente como alquilada.`
                );
            }
        }


        /*
         * 5. Finalizar la reservación.
         *
         * en_curso -> finalizada
         */
        const resultadoReservacion =
    await conexion.query(
                `
                UPDATE reservaciones
                SET estado = 'finalizada'
                WHERE id = ?
                  AND agencia_id = ?
                  AND estado = 'en_curso'
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            resultadoReservacion.affectedRows !==
            1
        ) {

            throw crearErrorOperacion(
                "CAMBIO_ESTADO_FALLIDO",
                "No fue posible finalizar la reservación."
            );
        }


        /*
         * 6. Las unidades físicas vuelven
         *    a estar disponibles.
         */
        const idsVehiculos =
            unidades.map(
                unidad =>
                    Number(
                        unidad.vehiculo_id
                    )
            );


        const marcadores =
            idsVehiculos
                .map(() => "?")
                .join(", ");


        const resultadoVehiculos =
    await conexion.query(
                `
                UPDATE vehiculos
                SET estado = 'disponible'
                WHERE agencia_id = ?
                  AND estado = 'alquilado'
                  AND id IN (${marcadores})
                `,
                [
                    agenciaId,
                    ...idsVehiculos
                ]
            );


        if (
            resultadoVehiculos.affectedRows !==
            idsVehiculos.length
        ) {

            throw crearErrorOperacion(
                "DEVOLUCION_UNIDADES_FALLIDA",
                "No fue posible liberar correctamente todas las unidades."
            );
        }


        await conexion.commit();


        return {

            reservacionId:
                Number(
                    reservacion.id
                ),

            estado:
                "finalizada",

            cantidadUnidades:
                unidades.length,

            unidades:
                unidades.map(
                    unidad => ({
                        id:
                            Number(
                                unidad.vehiculo_id
                            ),

                        codigoInterno:
                            unidad.codigo_interno,

                        placa:
                            unidad.placa
                    })
                )
        };


    } catch (error) {

        await conexion.rollback();

        throw error;

    } finally {

        conexion.release();
    }
}

module.exports = {
    entregarVehiculoReservacion,
    registrarDevolucionReservacion
};