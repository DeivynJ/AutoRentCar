/* =========================================================
   AUTORENTCAR - RESERVACIONES DEL PANEL DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);

const {

    cambiarEstadoReservacionPanel

} = require(
    "../services/panelReservacionService"
);


/* =========================================================
   MOSTRAR RESERVACIONES DE LA AGENCIA AUTENTICADA
========================================================= */

async function mostrarReservacionesPanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           TENANT SEGURO

           La agencia nunca se obtiene desde:
           - req.body
           - req.query
           - req.params

           Siempre procede del contexto autenticado.
        ------------------------------------------------- */

        const agenciaId =
            Number(
                req.agencia?.id
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           RESUMEN DE RESERVACIONES

           Siempre limitado a la propia agencia.
        ================================================= */

        const resumenFilas =
            await conexion.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        CASE
                            WHEN estado = 'pendiente'
                                THEN 1
                            ELSE 0
                        END
                    ) AS pendientes,

                    SUM(
                        CASE
                            WHEN estado = 'confirmada'
                                THEN 1
                            ELSE 0
                        END
                    ) AS confirmadas,

                    SUM(
                        CASE
                            WHEN estado = 'en_curso'
                                THEN 1
                            ELSE 0
                        END
                    ) AS en_curso,

                    SUM(
                        CASE
                            WHEN estado = 'finalizada'
                                THEN 1
                            ELSE 0
                        END
                    ) AS finalizadas,

                    SUM(
                        CASE
                            WHEN estado = 'rechazada'
                                THEN 1
                            ELSE 0
                        END
                    ) AS rechazadas,

                    SUM(
                        CASE
                            WHEN estado = 'cancelada'
                                THEN 1
                            ELSE 0
                        END
                    ) AS canceladas

                FROM reservaciones

                WHERE
                    agencia_id = ?
                `,
                [
                    agenciaId
                ]
            );


        const resumenFila =
            resumenFilas[0] ||
            {};


        const resumen = {

            total:
                Number(
                    resumenFila.total ||
                    0
                ),

            pendientes:
                Number(
                    resumenFila.pendientes ||
                    0
                ),

            confirmadas:
                Number(
                    resumenFila.confirmadas ||
                    0
                ),

            enCurso:
                Number(
                    resumenFila.en_curso ||
                    0
                ),

            finalizadas:
                Number(
                    resumenFila.finalizadas ||
                    0
                ),

            rechazadas:
                Number(
                    resumenFila.rechazadas ||
                    0
                ),

            canceladas:
                Number(
                    resumenFila.canceladas ||
                    0
                )

        };


        /* =================================================
           LISTADO

           No incluimos aquí:
           - documento completo
           - licencia
           - información de unidades físicas

           Esos datos pertenecerán a la vista de detalle.
        ================================================= */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,

                    r.codigo,

                    r.modelo_id,

                    r.cantidad_vehiculos,

                    r.lugar_recogida,
                    r.lugar_entrega,

                    r.fecha_recogida,
                    r.hora_recogida,

                    r.fecha_entrega,
                    r.hora_entrega,

                    r.cliente_nombre,
                    r.cliente_correo,
                    r.cliente_telefono,

                    r.total,

                    r.estado,
                    r.origen,

                    r.fecha_creacion,
                    r.fecha_actualizacion,

                    m.nombre
                        AS modelo_nombre,

                    m.marca
                        AS modelo_marca,

                    m.imagen
                        AS modelo_imagen

                FROM reservaciones r

                INNER JOIN modelos_vehiculos m

                    ON m.id =
                        r.modelo_id

                    AND m.agencia_id =
                        r.agencia_id

                WHERE
                    r.agencia_id = ?

                ORDER BY

                    CASE r.estado

                        WHEN 'pendiente'
                            THEN 1

                        WHEN 'confirmada'
                            THEN 2

                        WHEN 'en_curso'
                            THEN 3

                        WHEN 'finalizada'
                            THEN 4

                        WHEN 'cancelada'
                            THEN 5

                        WHEN 'rechazada'
                            THEN 6

                        ELSE 7

                    END ASC,

                    r.fecha_creacion DESC,

                    r.id DESC
                `,
                [
                    agenciaId
                ]
            );


        /* =================================================
           RENDER

           La vista será creada en el siguiente bloque.
        ================================================= */

        return res.render(
            "panel/reservaciones/index",
            {

                titulo:
                    "Reservaciones",

                subtituloPagina:
                    "Gestión de reservaciones",

                paginaActual:
                    "reservaciones",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                resumen,

                reservaciones

            }
        );


    } catch (error) {

        console.error(
            "Error cargando reservaciones del panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar las reservaciones de la agencia."
            );


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   MOSTRAR DETALLE DE UNA RESERVACIÓN
========================================================= */

async function mostrarDetalleReservacionPanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           AGENCIA AUTENTICADA

           Nunca obtenemos agencia_id desde parámetros,
           query o body.
        ------------------------------------------------- */

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const reservacionId =
            Number(
                req.params?.reservacionId
            );


        if (
            !Number.isInteger(
                agenciaId
            ) ||
            agenciaId <= 0
        ) {

            return res
                .status(403)
                .send(
                    "No fue posible identificar la agencia del usuario."
                );

        }


        if (
            !Number.isInteger(
                reservacionId
            ) ||
            reservacionId <= 0
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        conexion =
            await pool.getConnection();


        /* =================================================
           RESERVACIÓN

           La protección principal está en:

           r.id = ?
           AND r.agencia_id = ?

           Por tanto, una agencia no puede consultar
           la reservación de otra.
        ================================================= */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.codigo,

                    r.agencia_id,
                    r.modelo_id,

                    r.cantidad_vehiculos,

                    r.sucursal_recogida_id,
                    r.sucursal_entrega_id,

                    r.lugar_recogida,
                    r.lugar_entrega,

                    r.fecha_recogida,
                    r.hora_recogida,

                    r.fecha_entrega,
                    r.hora_entrega,

                    r.cliente_nombre,
                    r.cliente_documento,
                    r.cliente_correo,
                    r.cliente_telefono,
                    r.cliente_edad,
                    r.cliente_licencia,

                    r.precio_diario,
r.subtotal,
r.costo_adicionales,
r.descuento,
r.total,

r.tipo_anticipo_aplicado,
r.valor_anticipo_aplicado,
r.monto_anticipo_requerido,
r.fecha_limite_pago,

r.codigo_promocional,
                    r.comentarios,

                    r.estado,
                    r.origen,

                    r.creado_por_usuario_id,

                    r.fecha_creacion,
                    r.fecha_actualizacion,

                    m.nombre
                        AS modelo_nombre,

                    m.marca
                        AS modelo_marca,

                    m.imagen
                        AS modelo_imagen

                FROM reservaciones r

                INNER JOIN modelos_vehiculos m

                    ON m.id =
                        r.modelo_id

                    AND m.agencia_id =
                        r.agencia_id

                WHERE
                    r.id = ?

                    AND r.agencia_id = ?

                LIMIT 1
                `,
                [
                    reservacionId,
                    agenciaId
                ]
            );


        if (
            !reservaciones.length
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        const reservacion =
            reservaciones[0];


        /* =================================================
           ADICIONALES

           Se consultan únicamente utilizando la
           reservación previamente validada dentro
           de la agencia autenticada.
        ================================================= */

        const adicionales =
            await conexion.query(
                `
                SELECT

                    id,
                    codigo,
                    nombre,

                    precio_diario,
                    cantidad_vehiculos,
                    dias,
                    costo_total,

                    fecha_creacion

                FROM reservacion_adicionales

                WHERE
                    reservacion_id = ?

                ORDER BY
                    id ASC
                `,
                [
                    reservacion.id
                ]
            );


        /* =================================================
           DATOS ECONÓMICOS NORMALIZADOS
        ================================================= */

        const resumenPago = {

    precioDiario:
        Number(
            reservacion.precio_diario ||
            0
        ),

    subtotal:
        Number(
            reservacion.subtotal ||
            0
        ),

    adicionales:
        Number(
            reservacion.costo_adicionales ||
            0
        ),

    descuento:
        Number(
            reservacion.descuento ||
            0
        ),

    total:
        Number(
            reservacion.total ||
            0
        ),

    tipoAnticipo:
        reservacion.tipo_anticipo_aplicado ||
        null,

    valorAnticipo:
        Number(
            reservacion.valor_anticipo_aplicado ||
            0
        ),

    montoAnticipoRequerido:
        Number(
            reservacion.monto_anticipo_requerido ||
            0
        ),

    fechaLimitePago:
        reservacion.fecha_limite_pago ||
        null

};


        /* =================================================
           RENDER

           La vista se creará en el siguiente bloque.
        ================================================= */

        return res.render(
            "panel/reservaciones/detalle",
            {

                titulo:
                    `Reservación ${reservacion.codigo}`,

                subtituloPagina:
                    "Detalle de reservación",

                paginaActual:
                    "reservaciones",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                reservacion,

adicionales,

resumenPago,

queryResultado:
    req.query?.resultado ||
    null,

queryError:
    req.query?.error ||
    null

            }
        );


    } catch (error) {

        console.error(
            "Error cargando detalle de reservación:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar la reservación."
            );


    } finally {

        if (
            conexion
        ) {

            conexion.release();

        }

    }

}

/* =========================================================
   CONFIRMAR RESERVACIÓN
========================================================= */

async function confirmarReservacionPanel(
    req,
    res
) {

    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const reservacionId =
            Number(
                req.params?.reservacionId
            );


        const resultado =
            await cambiarEstadoReservacionPanel({

                agenciaId,

                reservacionId,

                nuevoEstado:
                    "confirmada"

            });


        return res.redirect(
    `/panel/reservaciones/${resultado.id}?resultado=${resultado.estado}`
);


    } catch (error) {

        console.error(
            "Error confirmando reservación:",
            error
        );


        if (
            error.codigo ===
            "RESERVACION_NO_ENCONTRADA"
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        if (
            error.codigo ===
            "RESERVACION_NO_PENDIENTE"
        ) {

            return res.redirect(
                `/panel/reservaciones/${req.params.reservacionId}?error=estado`
            );

        }


        if (
            error.codigo ===
            "ID_INVALIDO"
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        return res.redirect(
            `/panel/reservaciones/${req.params.reservacionId}?error=confirmar`
        );

    }

}

/* =========================================================
   RECHAZAR RESERVACIÓN
========================================================= */

async function rechazarReservacionPanel(
    req,
    res
) {

    try {

        const agenciaId =
            Number(
                req.agencia?.id
            );


        const reservacionId =
            Number(
                req.params?.reservacionId
            );


        const resultado =
            await cambiarEstadoReservacionPanel({

                agenciaId,

                reservacionId,

                nuevoEstado:
                    "rechazada"

            });


        return res.redirect(
            `/panel/reservaciones/${resultado.id}?resultado=rechazada`
        );


    } catch (error) {

        console.error(
            "Error rechazando reservación:",
            error
        );


        if (
            error.codigo ===
            "RESERVACION_NO_ENCONTRADA"
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        if (
            error.codigo ===
            "RESERVACION_NO_PENDIENTE"
        ) {

            return res.redirect(
                `/panel/reservaciones/${req.params.reservacionId}?error=estado`
            );

        }


        if (
            error.codigo ===
            "ID_INVALIDO"
        ) {

            return res
                .status(404)
                .send(
                    "Reservación no encontrada."
                );

        }


        return res.redirect(
            `/panel/reservaciones/${req.params.reservacionId}?error=rechazar`
        );

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarReservacionesPanel,

    mostrarDetalleReservacionPanel,

    confirmarReservacionPanel,

    rechazarReservacionPanel

};