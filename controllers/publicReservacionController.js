const {
    crearReservacionWeb
} = require(
    "../services/reservacionService"
);

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
   CREAR RESERVACIÓN PÚBLICA
========================================================= */

async function crearReservacionPublica(
    req,
    res
) {

    try {

        /* -------------------------------------------------
           SLUG

           La agencia se resolverá nuevamente desde
           MariaDB dentro del servicio.

           Nunca aceptamos agencia_id desde el navegador.
        ------------------------------------------------- */

        const slug =
            String(
                req.params.slug ||
                ""
            )
                .trim()
                .toLowerCase();


        if (!slug) {

            return res
                .status(400)
                .json({

                    ok:
                        false,

                    codigo:
                        "AGENCIA_INVALIDA",

                    mensaje:
                        "La agencia indicada no es válida."

                });

        }


        /* -------------------------------------------------
           CREAR RESERVACIÓN

           req.body contiene únicamente datos solicitados
           por el cliente.

           El servicio vuelve a determinar:
           - agencia
           - modelo
           - disponibilidad
           - precio
           - adicionales
           - promoción
           - importes
           - código
           - estado
           - origen
        ------------------------------------------------- */

        const reservacion =
            await crearReservacionWeb({

                slug,

                datos:
                    req.body

            });

        /* =========================================================
   NOTIFICAR A LA AGENCIA

   La reservación ya fue confirmada en MariaDB.

   Una falla de notificación NO debe cancelar
   ni modificar la reservación creada.
========================================================= */

try {

    const agenciaId =
        Number(
            reservacion.agencia?.id
        );


    const reservacionId =
        Number(
            reservacion.id
        );


    if (
        Number.isInteger(
            agenciaId
        ) &&
        agenciaId > 0 &&
        Number.isInteger(
            reservacionId
        ) &&
        reservacionId > 0
    ) {

        await crearNotificacionAgencia({

            agenciaId,

            categoria:
                "reservaciones",

            tipo:
                "reservacion_nueva",

            titulo:
                "Nueva reservación pendiente",

            mensaje:
                `Se registró una nueva reservación con el código ${reservacion.codigo}.`,

            destinoUrl:
                "/panel/reservaciones",

            entidadTipo:
                "reservacion",

            entidadId:
                reservacionId,

            nivel:
                "info"

        });

    } else {

        console.error(
            "No fue posible crear la notificación: la reservación no contiene una agencia o ID válido."
        );

    }


} catch (errorNotificacion) {

    /*
     * IMPORTANTE:
     *
     * La reserva ya existe.
     *
     * No lanzamos nuevamente el error porque eso
     * podría hacer creer al navegador que la
     * reservación falló y provocar un segundo POST.
     */

    console.error(
        "Reservación creada, pero falló la notificación de agencia:",
        errorNotificacion
    );

}


        /* -------------------------------------------------
           RESPUESTA PÚBLICA

           No devolvemos datos internos como:
           - agencia_id
           - IDs de unidades físicas
           - VIN
           - placa
           - código interno
           - documento completo del cliente
           - licencia
        ------------------------------------------------- */

        return res
            .status(201)
            .json({

                ok:
                    true,


                reservacion: {

                    id:
                        reservacion.id,

                    codigo:
                        reservacion.codigo,


                    agencia:
                        reservacion.agencia,


                    modelo:
                        reservacion.modelo,


                    cantidadVehiculos:
                        reservacion
                            .cantidadVehiculos,


                    periodo:
                        reservacion.periodo,


                    lugarRecogida:
                        reservacion
                            .lugarRecogida,

                    lugarEntrega:
                        reservacion
                            .lugarEntrega,


                    cliente: {

                        nombre:
                            reservacion
                                .cliente
                                .nombre,

                        correo:
                            reservacion
                                .cliente
                                .correo,

                        telefono:
                            reservacion
                                .cliente
                                .telefono

                    },


                    adicionales:
                        reservacion
                            .adicionales,


                    codigoPromocional:
                        reservacion
                            .codigoPromocional,


                    dias:
                        reservacion.dias,

                    precioDiario:
                        reservacion
                            .precioDiario,

                    subtotal:
                        reservacion.subtotal,

                    costoAdicionales:
                        reservacion
                            .costoAdicionales,

                    descuento:
                        reservacion.descuento,

                    total:
                        reservacion.total,


                    estado:
                        reservacion.estado

                }

            });


    } catch (error) {

        /* -------------------------------------------------
           ERRORES CONTROLADOS
        ------------------------------------------------- */

        if (
            error.codigo
        ) {

            const respuesta = {

                ok:
                    false,

                codigo:
                    error.codigo,

                mensaje:
                    error.message

            };


            /*
             * Solo cuando cambia la disponibilidad
             * resulta útil informar la cantidad actual.
             */

            if (
                error.codigo ===
                "DISPONIBILIDAD_INSUFICIENTE" &&
                error.cantidadDisponible !==
                    undefined
            ) {

                respuesta
                    .cantidadDisponible =
                        error
                            .cantidadDisponible;

            }


            return res
                .status(
                    error.status ||
                    400
                )
                .json(
                    respuesta
                );

        }


        console.error(
            "Error creando reservación pública:",
            error
        );


        return res
            .status(500)
            .json({

                ok:
                    false,

                mensaje:
                    "No fue posible crear la reservación."

            });

    }

}

/* =========================================================
   CONSULTAR RESERVACIÓN PÚBLICA
========================================================= */

async function consultarReservacionPublica(
    req,
    res
) {

    let conexion;


    try {

        const slug =
            String(
                req.params.slug ||
                ""
            )
                .trim()
                .toLowerCase();


        const codigo =
            String(
                req.body?.codigo ||
                ""
            )
                .trim()
                .toUpperCase();


        const correo =
            String(
                req.body?.correo ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            !slug ||
            !codigo ||
            !correo
        ) {

            return res
                .status(400)
                .json({

                    ok:
                        false,

                    mensaje:
                        "Debes indicar el código de reservación y el correo utilizado al realizarla."

                });

        }


        if (
            codigo.length > 40 ||
            correo.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                correo
            )
        ) {

            return res
                .status(400)
                .json({

                    ok:
                        false,

                    mensaje:
                        "Los datos indicados no son válidos."

                });

        }


        conexion =
            await pool.getConnection();


        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.codigo,

                    r.cantidad_vehiculos,

                    r.lugar_recogida,
                    r.lugar_entrega,

                    DATE_FORMAT(
                        r.fecha_recogida,
                        '%Y-%m-%d'
                    ) AS fecha_recogida,

                    TIME_FORMAT(
                        r.hora_recogida,
                        '%H:%i:%s'
                    ) AS hora_recogida,

                    DATE_FORMAT(
                        r.fecha_entrega,
                        '%Y-%m-%d'
                    ) AS fecha_entrega,

                    TIME_FORMAT(
                        r.hora_entrega,
                        '%H:%i:%s'
                    ) AS hora_entrega,

                    r.cliente_nombre,
                    r.cliente_correo,
                    r.cliente_telefono,

                    r.precio_diario,
                    r.subtotal,
                    r.costo_adicionales,
                    r.descuento,
                    r.total,

                    r.codigo_promocional,
                    r.estado,
                    r.fecha_creacion,

                    GREATEST(
                        1,
                        DATEDIFF(
                            r.fecha_entrega,
                            r.fecha_recogida
                        )
                    ) AS dias,

                    a.id AS agencia_id,
                    a.nombre AS agencia_nombre,
                    a.slug AS agencia_slug,

                    m.id AS modelo_id,
                    m.nombre AS modelo_nombre,
                    m.marca AS modelo_marca,
                    m.categoria AS modelo_categoria,
                    m.transmision AS modelo_transmision,
                    m.combustible AS modelo_combustible,
                    m.pasajeros AS modelo_pasajeros,
                    m.puertas AS modelo_puertas,
                    m.equipaje AS modelo_equipaje,
                    m.aire_acondicionado AS modelo_aire,
                    m.imagen AS modelo_imagen

                FROM reservaciones r

                INNER JOIN agencias a
                    ON a.id = r.agencia_id

                INNER JOIN modelos_vehiculos m
                    ON m.id = r.modelo_id
                    AND m.agencia_id = r.agencia_id

                WHERE
                    a.slug = ?
                    AND r.codigo = ?
                    AND r.cliente_correo = ?
                    AND r.origen = 'web'

                LIMIT 1
                `,
                [
                    slug,
                    codigo,
                    correo
                ]
            );


        if (
            reservaciones.length === 0
        ) {

            return res
                .status(404)
                .json({

                    ok:
                        false,

                    mensaje:
                        "No fue posible encontrar una reservación con los datos proporcionados."

                });

        }


        const reservacion =
            reservaciones[0];


        const adicionalesFilas =
            await conexion.query(
                `
                SELECT

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
                    reservacion.id
                ]
            );


        const adicionales =
            adicionalesFilas.map(
                (adicional) => ({

                    codigo:
                        adicional.codigo,

                    nombre:
                        adicional.nombre,

                    precioDiario:
                        Number(
                            adicional.precio_diario
                        ),

                    cantidadVehiculos:
                        Number(
                            adicional.cantidad_vehiculos
                        ),

                    dias:
                        Number(
                            adicional.dias
                        ),

                    costoTotal:
                        Number(
                            adicional.costo_total
                        )

                })
            );


        res.set(
            "Cache-Control",
            "no-store"
        );


        return res.json({

            ok:
                true,

            reservacion: {

                id:
                    Number(
                        reservacion.id
                    ),

                codigo:
                    reservacion.codigo,

                agencia: {

                    id:
                        Number(
                            reservacion.agencia_id
                        ),

                    nombre:
                        reservacion.agencia_nombre,

                    slug:
                        reservacion.agencia_slug

                },

                modelo: {

                    id:
                        Number(
                            reservacion.modelo_id
                        ),

                    nombre:
                        reservacion.modelo_nombre,

                    marca:
                        reservacion.modelo_marca,

                    categoria:
                        reservacion.modelo_categoria,

                    transmision:
                        reservacion.modelo_transmision,

                    combustible:
                        reservacion.modelo_combustible,

                    pasajeros:
                        Number(
                            reservacion.modelo_pasajeros ||
                            0
                        ),

                    puertas:
                        Number(
                            reservacion.modelo_puertas ||
                            0
                        ),

                    equipaje:
                        Number(
                            reservacion.modelo_equipaje ||
                            0
                        ),

                    aire:
                        Boolean(
                            reservacion.modelo_aire
                        ),

                    imagen:
                        reservacion.modelo_imagen ||
                        ""

                },

                cantidadVehiculos:
                    Number(
                        reservacion.cantidad_vehiculos
                    ),

                periodo: {

                    fechaRecogida:
                        reservacion.fecha_recogida,

                    horaRecogida:
                        reservacion.hora_recogida,

                    fechaEntrega:
                        reservacion.fecha_entrega,

                    horaEntrega:
                        reservacion.hora_entrega

                },

                lugarRecogida:
                    reservacion.lugar_recogida ||
                    "",

                lugarEntrega:
                    reservacion.lugar_entrega ||
                    "",

                cliente: {

                    nombre:
                        reservacion.cliente_nombre,

                    correo:
                        reservacion.cliente_correo,

                    telefono:
                        reservacion.cliente_telefono

                },

                adicionales,

                codigoPromocional:
                    reservacion.codigo_promocional ||
                    null,

                dias:
                    Number(
                        reservacion.dias
                    ),

                precioDiario:
                    Number(
                        reservacion.precio_diario
                    ),

                subtotal:
                    Number(
                        reservacion.subtotal
                    ),

                costoAdicionales:
                    Number(
                        reservacion.costo_adicionales
                    ),

                descuento:
                    Number(
                        reservacion.descuento
                    ),

                total:
                    Number(
                        reservacion.total
                    ),

                estado:
                    reservacion.estado,

                fechaRegistro:
                    reservacion.fecha_creacion

            }

        });


    } catch (error) {

        console.error(
            "Error consultando reservación pública:",
            error
        );


        return res
            .status(500)
            .json({

                ok:
                    false,

                mensaje:
                    "No fue posible consultar la reservación."

            });


    } finally {

        if (conexion) {

            conexion.release();

        }

    }

}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {

    crearReservacionPublica,
    consultarReservacionPublica

};