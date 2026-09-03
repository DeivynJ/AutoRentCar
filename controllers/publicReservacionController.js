const {
    crearReservacionWeb
} = require(
    "../services/reservacionService"
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
   EXPORTACIONES
========================================================= */

module.exports = {

    crearReservacionPublica

};