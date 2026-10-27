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

const {

    enviarCorreoReservacionConfirmada,

    enviarCorreoVehiculoEntregado,

    enviarCorreoDevolucionConfirmada

} = require(
    "../services/correoReservacionService"
);

const {

    asignarUnidadFisicaReservacion,

    obtenerUnidadesFisicasReservacion

} = require(
    "../services/panelReservacionVehiculoService"
);

const {
    entregarVehiculoReservacion,
    registrarDevolucionReservacion
} = require("../services/panelOperacionReservacionService");

const {

    obtenerDatosComprobanteReservacionPanel

} = require(
    "../services/comprobanteReservacionPanelService"
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


                /* =================================================
           FILTROS DEL LISTADO

           Todos los valores procedentes de req.query se
           normalizan y validan antes de utilizarlos.

           La agencia nunca procede de estos filtros.
        ================================================= */

        const busqueda =
            String(
                req.query.busqueda ||
                ""
            )
                .trim()
                .slice(
                    0,
                    120
                );


        const estadosPermitidos =
    new Set([
        "pendiente",
        "pendiente_pago",
        "pendiente_asignacion",
        "pendiente_entrega",
        "en_curso",
        "finalizada"
    ]);


        const estadoSolicitado =
            String(
                req.query.estado ||
                ""
            )
                .trim();


        const estado =
            estadosPermitidos.has(
                estadoSolicitado
            )
                ? estadoSolicitado
                : "";


        const origenesPermitidos =
            new Set([
                "web",
                "panel"
            ]);


        const origenSolicitado =
            String(
                req.query.origen ||
                ""
            )
                .trim();


        const origen =
            origenesPermitidos.has(
                origenSolicitado
            )
                ? origenSolicitado
                : "";


        const normalizarFechaFiltro =
            (valor) => {

                const fecha =
                    String(
                        valor ||
                        ""
                    )
                        .trim();


                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        fecha
                    )
                ) {

                    return "";

                }


                const fechaValidacion =
                    new Date(
                        `${fecha}T00:00:00`
                    );


                if (
                    Number.isNaN(
                        fechaValidacion.getTime()
                    )
                ) {

                    return "";

                }


                return fecha;

            };


        const fechaDesde =
            normalizarFechaFiltro(
                req.query.fecha_desde
            );


        const fechaHasta =
            normalizarFechaFiltro(
                req.query.fecha_hasta
            );


        const filtros = {

            busqueda,

            estado,

            origen,

            fechaDesde,

            fechaHasta

        };


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
        WHEN estado = 'pendiente_pago'
            THEN 1
        ELSE 0
    END
) AS pendientes_pago,

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

pendientesPago:
    Number(
        resumenFila.pendientes_pago ||
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
        /* =================================================
           CONSTRUCCIÓN SEGURA DE FILTROS

           La condición de agencia siempre es obligatoria.
           Los demás filtros únicamente refinan el listado.
        ================================================= */

        const condicionesListado = [
            "r.agencia_id = ?"
        ];


        const parametrosListado = [
            agenciaId
        ];


        if (
            filtros.busqueda
        ) {

            const patronBusqueda =
                `%${filtros.busqueda}%`;


            condicionesListado.push(
                `
                (
                    r.codigo LIKE ?

                    OR r.cliente_nombre LIKE ?

                    OR r.cliente_correo LIKE ?

                    OR r.cliente_telefono LIKE ?

                    OR m.marca LIKE ?

                    OR m.nombre LIKE ?

                    OR CONCAT_WS(
                        ' ',
                        m.marca,
                        m.nombre
                    ) LIKE ?
                )
                `
            );


            parametrosListado.push(
                patronBusqueda,
                patronBusqueda,
                patronBusqueda,
                patronBusqueda,
                patronBusqueda,
                patronBusqueda,
                patronBusqueda
            );

        }


        /* =================================================
   FILTRO POR ETAPA OPERATIVA
================================================= */

if (
    [
        "pendiente",
        "pendiente_pago",
        "en_curso",
        "finalizada"
    ].includes(
        filtros.estado
    )
) {

    condicionesListado.push(
        "r.estado = ?"
    );


    parametrosListado.push(
        filtros.estado
    );

}


/* -------------------------------------------------
   PENDIENTE DE ASIGNAR UNIDAD

   Internamente la reservación ya está confirmada,
   pero todavía no tiene todas las unidades físicas.
------------------------------------------------- */

if (
    filtros.estado ===
    "pendiente_asignacion"
) {

    condicionesListado.push(
        `
        (
            r.estado = 'confirmada'

            AND (

                COALESCE(
                    r.cantidad_vehiculos,
                    0
                ) <= 0

                OR

                (
                    SELECT
                        COUNT(*)

                    FROM reservacion_vehiculos
                        rv_filtro_asignacion

                    WHERE
                        rv_filtro_asignacion.reservacion_id =
                            r.id

                        AND
                        rv_filtro_asignacion.estado =
                            'asignado'
                ) <
                COALESCE(
                    r.cantidad_vehiculos,
                    0
                )
            )
        )
        `
    );

}


/* -------------------------------------------------
   PENDIENTE DE ENTREGA

   Internamente continúa confirmada,
   pero ya tiene todas las unidades asignadas.
------------------------------------------------- */

if (
    filtros.estado ===
    "pendiente_entrega"
) {

    condicionesListado.push(
        `
        (
            r.estado = 'confirmada'

            AND
            COALESCE(
                r.cantidad_vehiculos,
                0
            ) > 0

            AND

            (
                SELECT
                    COUNT(*)

                FROM reservacion_vehiculos
                    rv_filtro_entrega

                WHERE
                    rv_filtro_entrega.reservacion_id =
                        r.id

                    AND
                    rv_filtro_entrega.estado =
                        'asignado'
            ) >=
            COALESCE(
                r.cantidad_vehiculos,
                0
            )
        )
        `
    );

}


        if (
            filtros.origen
        ) {

            condicionesListado.push(
                "r.origen = ?"
            );


            parametrosListado.push(
                filtros.origen
            );

        }


        if (
            filtros.fechaDesde
        ) {

            condicionesListado.push(
                "r.fecha_recogida >= ?"
            );


            parametrosListado.push(
                filtros.fechaDesde
            );

        }


        if (
            filtros.fechaHasta
        ) {

            condicionesListado.push(
                "r.fecha_recogida <= ?"
            );


            parametrosListado.push(
                filtros.fechaHasta
            );

        }


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

                    r.monto_anticipo_requerido,

                    (
                        SELECT
                            COUNT(*)

                        FROM reservacion_vehiculos rv

                        WHERE
                            rv.reservacion_id = r.id

                            AND rv.estado = 'asignado'

                    ) AS unidades_asignadas,

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

                    ${condicionesListado.join(
                        "\nAND "
                    )}

                ORDER BY

                    CASE r.estado

    WHEN 'pendiente'
        THEN 1

    WHEN 'pendiente_pago'
        THEN 2

    WHEN 'confirmada'
        THEN 3

    WHEN 'en_curso'
        THEN 4

    WHEN 'finalizada'
        THEN 5

    WHEN 'cancelada'
        THEN 6

    WHEN 'rechazada'
        THEN 7

    ELSE 8

                    END ASC,

                    r.fecha_creacion DESC,

                    r.id DESC
                `,
                                parametrosListado
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

                filtros,

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
   ESTADO TEMPORAL DE LA RESERVACIÓN

   Se consulta de forma independiente para no alterar
   la consulta principal del detalle.
================================================= */

const periodoTemporalFilas =
    await conexion.query(
        `
        SELECT

            CASE
                WHEN NOW() < TIMESTAMP(
                    fecha_recogida,
                    hora_recogida
                )
                    THEN 1
                ELSE 0
            END AS antes_recogida,

            CASE
                WHEN
                    NOW() >= TIMESTAMP(
                        fecha_recogida,
                        hora_recogida
                    )
                    AND
                    NOW() < TIMESTAMP(
                        fecha_entrega,
                        hora_entrega
                    )
                    THEN 1
                ELSE 0
            END AS periodo_activo,

            CASE
                WHEN NOW() >= TIMESTAMP(
                    fecha_entrega,
                    hora_entrega
                )
                    THEN 1
                ELSE 0
            END AS periodo_vencido

        FROM reservaciones

        WHERE
            id = ?
            AND agencia_id = ?

        LIMIT 1
        `,
        [
            reservacion.id,
            agenciaId
        ]
    );


const periodoTemporal =
    periodoTemporalFilas[0] ||
    {};


reservacion.antes_recogida =
    Number(
        periodoTemporal.antes_recogida ||
        0
    );


reservacion.periodo_activo =
    Number(
        periodoTemporal.periodo_activo ||
        0
    );


reservacion.periodo_vencido =
    Number(
        periodoTemporal.periodo_vencido ||
        0
    );


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
   PAGOS DE LA RESERVACIÓN

   Se limita por:

   reservacion_id
   +
   agencia_id

   Aunque la reservación ya fue validada, mantenemos
   también el filtro de agencia en la consulta de pagos.
================================================= */

const pagos =
    await conexion.query(
        `
        SELECT

            id,
            agencia_id,
            reservacion_id,

            metodo_pago_id,
            metodo_codigo,
            metodo_nombre,
            metodo_tipo,

            monto,
            moneda,

            referencia,
            fecha_pago,

            comprobante_ruta,
            comprobante_nombre_original,
            comprobante_mime,
            comprobante_tamano,

            origen,
            estado,

            validado_por_usuario_id,
            fecha_validacion,
            motivo_rechazo,

            fecha_creacion,
            fecha_actualizacion

        FROM pagos_reservacion

        WHERE
            reservacion_id = ?

            AND agencia_id = ?

        ORDER BY
            fecha_creacion DESC,
            id DESC
        `,
        [
            reservacion.id,
            agenciaId
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
           UNIDADES FÍSICAS DE LA RESERVACIÓN
        ================================================= */

        const unidadesReservacion =
            await obtenerUnidadesFisicasReservacion({

                agenciaId,

                reservacionId:
                    reservacion.id

            });


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

        pagos,

        resumenPago,

        unidadesReservacion,

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

            /* -------------------------------------------------
   CORREO DE RESERVACIÓN CONFIRMADA

   El estado ya fue actualizado.
   Un error del correo no debe afectar
   la confirmación.
------------------------------------------------- */

try {

    await enviarCorreoReservacionConfirmada({

        agenciaId,

        reservacionId

    });


} catch (
    errorCorreo
) {

    console.error(
        "No fue posible enviar correo de reservación confirmada:",
        {
            reservacionId,
            mensaje:
                errorCorreo.message
        }
    );

}


        return res.redirect(
    `/panel/reservaciones/${resultado.id}?resultado=${resultado.estado}`
);


    } catch (error) {


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
    "RESERVACION_VENCIDA"
) {

    return res.redirect(
        `/panel/reservaciones/${req.params.reservacionId}?error=reservacion_vencida`
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

        console.error(
    "Error inesperado confirmando reservación:",
    error
);

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


console.error(
    "Error inesperado rechazando reservación:",
    error
);

        return res.redirect(
            `/panel/reservaciones/${req.params.reservacionId}?error=rechazar`
        );

    }

}

/* =========================================================
   ASIGNAR UNIDAD FÍSICA A RESERVACIÓN
========================================================= */

async function asignarUnidadReservacionPanel(
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


        const vehiculoId =
            Number(
                req.body?.vehiculoId
            );


        /* =================================================
           VALIDACIONES BÁSICAS
        ================================================= */

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


        if (
            !Number.isInteger(
                vehiculoId
            ) ||
            vehiculoId <= 0
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidad_invalida`
            );

        }


        /* =================================================
           ASIGNACIÓN SEGURA

           El service vuelve a comprobar:
           - agencia;
           - reservación;
           - modelo;
           - estado;
           - cantidad;
           - disponibilidad temporal.
        ================================================= */

        const resultado =
            await asignarUnidadFisicaReservacion({

                agenciaId,

                reservacionId,

                vehiculoId

            });


        return res.redirect(
            `/panel/reservaciones/${resultado.reservacionId}?resultado=unidad_asignada`
        );


    } catch (error) {


        const reservacionId =
            Number(
                req.params?.reservacionId
            );


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
    "RESERVACION_VENCIDA"
) {

    return res.redirect(
        `/panel/reservaciones/${reservacionId}?error=reservacion_vencida`
    );

}

        if (
            error.codigo ===
            "RESERVACION_NO_CONFIRMADA"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidad_estado`
            );

        }


        if (
            error.codigo ===
            "CANTIDAD_COMPLETA"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidades_completas`
            );

        }


        if (
            error.codigo ===
                "VEHICULO_NO_ENCONTRADO" ||
            error.codigo ===
                "MODELO_NO_COINCIDE" ||
            error.codigo ===
                "VEHICULO_NO_OPERATIVO" ||
            error.codigo ===
                "VEHICULO_YA_ASIGNADO"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidad_invalida`
            );

        }


        if (
            error.codigo ===
            "VEHICULO_OCUPADO"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidad_ocupada`
            );

        }


        if (
            error.codigo ===
            "ID_INVALIDO"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=unidad_invalida`
            );

        }

        console.error(
    "Error inesperado asignando unidad física a reservación:",
    error
);


        return res.redirect(
            `/panel/reservaciones/${reservacionId}?error=asignar_unidad`
        );

    }

}


async function entregarVehiculoReservacionPanel(req, res) {

    const agenciaId =
        Number(req.agencia?.id);

    const reservacionId =
        Number(req.params?.reservacionId);


    if (
        !Number.isInteger(agenciaId) ||
        agenciaId <= 0 ||
        !Number.isInteger(reservacionId) ||
        reservacionId <= 0
    ) {

        return res.redirect(
            "/panel/reservaciones?error=entrega_invalida"
        );
    }


    try {

        const resultado =
    await entregarVehiculoReservacion({
        agenciaId,
        reservacionId
    });


/* -------------------------------------------------
   CORREO DE VEHÍCULO ENTREGADO

   La entrega ya fue confirmada.
   Un error del correo no debe afectar
   el inicio del alquiler.
------------------------------------------------- */

try {

    await enviarCorreoVehiculoEntregado({

        agenciaId,

        reservacionId

    });


} catch (
    errorCorreo
) {

    console.error(
        "No fue posible enviar correo de vehículo entregado:",
        {
            reservacionId,

            mensaje:
                errorCorreo.message
        }
    );

}


return res.redirect(
    `/panel/reservaciones/${resultado.reservacionId}?resultado=vehiculo_entregado`
);


    } catch (error) {


    if (
        error.codigo ===
        "RESERVACION_NO_ENCONTRADA"
    ) {

            return res.status(404).redirect(
                "/panel/reservaciones?error=reservacion_no_encontrada"
            );
        }


        if (
            error.codigo ===
            "RESERVACION_NO_CONFIRMADA"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=entrega_estado`
            );
        }

        if (
    error.codigo ===
    "ENTREGA_ANTICIPADA"
) {

    return res.redirect(
        `/panel/reservaciones/${reservacionId}?error=entrega_anticipada`
    );
}

if (
    error.codigo ===
    "RESERVACION_VENCIDA"
) {

    return res.redirect(
        `/panel/reservaciones/${reservacionId}?error=entrega_vencida`
    );

}


        if (
            error.codigo ===
            "UNIDADES_INCOMPLETAS" ||
            error.codigo ===
            "SIN_UNIDADES"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=entrega_unidades`
            );
        }


        if ( 
    error.codigo === 
    "UNIDAD_OTRA_AGENCIA" || 
    error.codigo === 
    "MODELO_NO_COINCIDE" || 
    error.codigo === 
    "UNIDAD_NO_DISPONIBLE" 
) { 

    return res.redirect( 
        `/panel/reservaciones/${reservacionId}?error=entrega_unidad_invalida` 
    ); 
}


if ( 
    error.codigo === 
    "CAMBIO_ESTADO_FALLIDO" 
) { 

    return res.redirect( 
        `/panel/reservaciones/${reservacionId}?error=entrega_estado` 
    ); 
}


/* -------------------------------------------------
   ERROR REALMENTE INESPERADO
------------------------------------------------- */

console.error(
    "Error inesperado al entregar vehículo:",
    error
);


return res.redirect( 
    `/panel/reservaciones/${reservacionId}?error=entregar_vehiculo` 
);
    }
}


async function registrarDevolucionReservacionPanel(req, res) {

    const agenciaId =
        Number(req.agencia?.id);

    const reservacionId =
        Number(req.params?.reservacionId);


    if (
        !Number.isInteger(agenciaId) ||
        agenciaId <= 0 ||
        !Number.isInteger(reservacionId) ||
        reservacionId <= 0
    ) {

        return res.redirect(
            "/panel/reservaciones?error=devolucion_invalida"
        );
    }


    try {

        const resultado =
            await registrarDevolucionReservacion({
                agenciaId,
                reservacionId
            });

        /* -------------------------------------------------
   CORREO DE DEVOLUCIÓN CONFIRMADA

   La devolución ya fue registrada.
   Un error del correo no debe afectar
   la finalización de la reservación.
------------------------------------------------- */

try {

    await enviarCorreoDevolucionConfirmada({

        agenciaId,

        reservacionId

    });


} catch (
    errorCorreo
) {

    console.error(
        "No fue posible enviar correo de devolución confirmada:",
        {
            reservacionId,
            mensaje:
                errorCorreo.message
        }
    );

}


        return res.redirect(
            `/panel/reservaciones/${resultado.reservacionId}?resultado=vehiculo_devuelto`
        );


    } catch (error) {

      
        if (
            error.codigo ===
            "RESERVACION_NO_ENCONTRADA"
        ) {

            return res.status(404).redirect(
                "/panel/reservaciones?error=reservacion_no_encontrada"
            );
        }


        if (
            error.codigo ===
            "RESERVACION_NO_EN_CURSO"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=devolucion_estado`
            );
        }


        if (
            error.codigo ===
            "UNIDADES_INCOMPLETAS"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=devolucion_unidades`
            );
        }


        if (
            error.codigo ===
            "UNIDAD_OTRA_AGENCIA" ||
            error.codigo ===
            "MODELO_NO_COINCIDE" ||
            error.codigo ===
            "UNIDAD_NO_ALQUILADA"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=devolucion_unidad_invalida`
            );
        }


        if (
            error.codigo ===
            "CAMBIO_ESTADO_FALLIDO" ||
            error.codigo ===
            "DEVOLUCION_UNIDADES_FALLIDA"
        ) {

            return res.redirect(
                `/panel/reservaciones/${reservacionId}?error=devolucion_fallida`
            );
        }


        console.error(
    "Error inesperado al registrar devolución:",
    error
);

        return res.redirect(
            `/panel/reservaciones/${reservacionId}?error=registrar_devolucion`
        );
    }
}

/* =========================================================
   OBTENER DATOS DEL COMPROBANTE PARA EL PANEL
========================================================= */

async function obtenerComprobanteReservacionPanel(
    req,
    res
) {

    try {

        /* -------------------------------------------------
           AGENCIA AUTENTICADA

           Nunca se acepta agencia_id desde:
           - params
           - query
           - body
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
                .json(
                    {
                        ok:
                            false,

                        mensaje:
                            "No fue posible identificar la agencia del usuario."
                    }
                );

        }


        const reservacionId =
            Number(
                req.params.reservacionId
            );


        if (
            !Number.isInteger(
                reservacionId
            ) ||
            reservacionId <= 0
        ) {

            return res
                .status(400)
                .json(
                    {
                        ok:
                            false,

                        mensaje:
                            "La reservación no es válida."
                    }
                );

        }


        const reservacion =
            await obtenerDatosComprobanteReservacionPanel(
                {
                    agenciaId,

                    reservacionId
                }
            );


        return res.json(
            {
                ok:
                    true,

                reservacion
            }
        );


    } catch (
        error
    ) {

        const status =
            Number.isInteger(
                error.status
            )
                ? error.status
                : 500;


        if (
            status >= 500
        ) {

            console.error(
                "Error obteniendo comprobante de reservación del panel:",
                error
            );

        }


        return res
            .status(
                status
            )
            .json(
                {
                    ok:
                        false,

                    mensaje:
                        status >= 500
                            ? "No fue posible preparar el comprobante."
                            : error.message
                }
            );

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarReservacionesPanel,

    mostrarDetalleReservacionPanel,

    obtenerComprobanteReservacionPanel,

    confirmarReservacionPanel,

    rechazarReservacionPanel,

    asignarUnidadReservacionPanel,

    entregarVehiculoReservacionPanel,

    registrarDevolucionReservacionPanel

};