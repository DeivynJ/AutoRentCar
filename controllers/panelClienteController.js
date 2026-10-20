/* =========================================================
   AUTORENTCAR
   CLIENTES DEL PANEL DE AGENCIA
========================================================= */

const {
    pool
} = require(
    "../config/database"
);


/* =========================================================
   NORMALIZAR VALOR DE IDENTIFICACIÓN
========================================================= */

function normalizarValorCliente(
    valor
) {

    return String(
        valor ||
        ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   OBTENER CLAVE ÚNICA DEL CLIENTE

   Se mantiene el mismo criterio utilizado actualmente
   por el proyecto para contabilizar clientes:

   1. Documento
   2. Correo
   3. Teléfono
========================================================= */

function obtenerClaveCliente(
    reservacion
) {

    const documento =
        normalizarValorCliente(
            reservacion.cliente_documento
        );


    if (
        documento
    ) {

        return `documento:${documento}`;

    }


    const correo =
        normalizarValorCliente(
            reservacion.cliente_correo
        );


    if (
        correo
    ) {

        return `correo:${correo}`;

    }


    const telefono =
        normalizarValorCliente(
            reservacion.cliente_telefono
        );


    return `telefono:${telefono}`;

}


/* =========================================================
   MOSTRAR CLIENTES DE LA AGENCIA AUTENTICADA
========================================================= */

async function mostrarClientesPanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           SEGURIDAD MULTIAGENCIA

           La agencia procede exclusivamente del contexto
           autenticado.

           Nunca desde:
           - req.params
           - req.query
           - req.body
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


        /* -------------------------------------------------
           RESERVACIONES DE LA PROPIA AGENCIA

           Los datos del cliente son fotografías históricas
           almacenadas dentro de cada reservación.
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    id,
                    codigo,

                    cliente_nombre,
                    cliente_documento,
                    cliente_correo,
                    cliente_telefono,
                    cliente_edad,
                    cliente_licencia,

                    estado,

                    fecha_recogida,
                    fecha_entrega,
                    fecha_creacion

                FROM reservaciones

                WHERE
                    agencia_id = ?

                ORDER BY
                    fecha_creacion DESC,
                    id DESC
                `,
                [
                    agenciaId
                ]
            );


        /* -------------------------------------------------
           AGRUPAR RESERVACIONES POR CLIENTE
        ------------------------------------------------- */

        const clientesAgrupados =
            new Map();


        for (
            const reservacion
            of reservaciones
        ) {

            const clave =
                obtenerClaveCliente(
                    reservacion
                );


            if (
                !clientesAgrupados.has(
                    clave
                )
            ) {

                clientesAgrupados.set(
                    clave,
                    {

                        clave,

                        nombre:
                            reservacion.cliente_nombre,

                        documento:
                            reservacion.cliente_documento,

                        correo:
                            reservacion.cliente_correo,

                        telefono:
                            reservacion.cliente_telefono,

                        edad:
                            reservacion.cliente_edad,

                        licencia:
                            reservacion.cliente_licencia,

                        totalReservaciones:
                            0,

                        tieneReservacionActiva:
                            false,

                        ultimaReservacion:
                        {

                            id:
                                reservacion.id,

                            codigo:
                                reservacion.codigo,

                            estado:
                                reservacion.estado,

                            fechaRecogida:
                                reservacion.fecha_recogida,

                            fechaEntrega:
                                reservacion.fecha_entrega,

                            fechaCreacion:
                                reservacion.fecha_creacion

                        }

                    }
                );

            }


            const cliente =
                clientesAgrupados.get(
                    clave
                );


            cliente.totalReservaciones +=
                1;


            if (
                [
                    "pendiente",
                    "pendiente_pago",
                    "confirmada",
                    "en_curso"
                ].includes(
                    reservacion.estado
                )
            ) {

                cliente.tieneReservacionActiva =
                    true;

            }

        }


               const clientesTodos =
            Array.from(
                clientesAgrupados.values()
            );


        /* -------------------------------------------------
           RESUMEN GENERAL

           El resumen representa todos los clientes de la
           agencia, independientemente de los filtros que
           se apliquen al listado.
        ------------------------------------------------- */

        const resumen =
        {

            total:
                clientesTodos.length,

            recurrentes:
                clientesTodos.filter(
                    (cliente) =>
                        cliente.totalReservaciones >= 2
                ).length,

            conReservacionActiva:
                clientesTodos.filter(
                    (cliente) =>
                        cliente.tieneReservacionActiva
                ).length

        };


        /* -------------------------------------------------
           FILTROS DEL LISTADO
        ------------------------------------------------- */

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


        const actividadesPermitidas =
            new Set([
                "activa",
                "recurrente",
                "sin_activa"
            ]);


        const actividadSolicitada =
            String(
                req.query.actividad ||
                ""
            )
                .trim();


        const actividad =
            actividadesPermitidas.has(
                actividadSolicitada
            )
                ? actividadSolicitada
                : "";


        const filtros =
        {

            busqueda,

            actividad

        };


        /* -------------------------------------------------
           APLICAR FILTROS

           Los filtros trabajan únicamente sobre los
           clientes ya pertenecientes a req.agencia.id.
        ------------------------------------------------- */

        const textoBusqueda =
            busqueda.toLowerCase();


        const clientes =
            clientesTodos.filter(
                (cliente) => {

                    /* -----------------------------
                       BÚSQUEDA
                    ----------------------------- */

                    if (
                        textoBusqueda
                    ) {

                        const valoresBusqueda =
                        [

                            cliente.nombre,

                            cliente.documento,

                            cliente.correo,

                            cliente.telefono,

                            cliente
                                .ultimaReservacion
                                ?.codigo

                        ]
                            .map(
                                (valor) =>
                                    String(
                                        valor ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase()
                            );


                        const coincideBusqueda =
                            valoresBusqueda.some(
                                (valor) =>
                                    valor.includes(
                                        textoBusqueda
                                    )
                            );


                        if (
                            !coincideBusqueda
                        ) {

                            return false;

                        }

                    }


                    /* -----------------------------
                       ACTIVIDAD
                    ----------------------------- */

                    if (
                        actividad ===
                        "activa" &&
                        !cliente.tieneReservacionActiva
                    ) {

                        return false;

                    }


                    if (
                        actividad ===
                        "recurrente" &&
                        cliente.totalReservaciones < 2
                    ) {

                        return false;

                    }


                    if (
                        actividad ===
                        "sin_activa" &&
                        cliente.tieneReservacionActiva
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        return res.render(
            "panel/clientes/index",
            {

                titulo:
                    "Clientes",

                subtituloPagina:
                    "Gestión de clientes",

                paginaActual:
                    "clientes",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                clientes,
                
                resumen,
                
                filtros

            }
        );


    } catch (
        error
    ) {

        console.error(
            "Error mostrando clientes del panel:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar los clientes."
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
   MOSTRAR DETALLE DE UN CLIENTE
========================================================= */

async function mostrarDetalleClientePanel(
    req,
    res
) {

    let conexion;


    try {

        /* -------------------------------------------------
           AGENCIA AUTENTICADA
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


        /* -------------------------------------------------
           RESERVACIÓN UTILIZADA COMO REFERENCIA

           No representa un cliente_id real.

           Únicamente nos permite identificar de forma
           segura al cliente mientras esta primera versión
           del módulo se construye desde reservaciones.
        ------------------------------------------------- */

        const referenciaReservacionId =
            Number(
                req.params.referenciaReservacionId
            );


        if (
            !Number.isInteger(
                referenciaReservacionId
            ) ||
            referenciaReservacionId <= 0
        ) {

            return res
                .status(400)
                .send(
                    "Referencia de cliente no válida."
                );

        }


        conexion =
            await pool.getConnection();


        /* -------------------------------------------------
           OBTENER CLIENTE DE REFERENCIA

           La reservación debe pertenecer obligatoriamente
           a la agencia autenticada.
        ------------------------------------------------- */

        const referencias =
            await conexion.query(
                `
                SELECT

                    id,

                    cliente_nombre,
                    cliente_documento,
                    cliente_correo,
                    cliente_telefono,
                    cliente_edad,
                    cliente_licencia

                FROM reservaciones

                WHERE
                    id = ?

                    AND agencia_id = ?

                LIMIT 1
                `,
                [
                    referenciaReservacionId,
                    agenciaId
                ]
            );


        if (
            !referencias.length
        ) {

            return res
                .status(404)
                .send(
                    "Cliente no encontrado."
                );

        }


        const referencia =
            referencias[0];


        /* -------------------------------------------------
           IDENTIFICADOR DEL CLIENTE

           Mismo criterio utilizado en el listado:

           1. Documento
           2. Correo
           3. Teléfono

           campoCliente solo puede tomar uno de estos
           valores definidos por el servidor.
        ------------------------------------------------- */

        let campoCliente;
        let valorCliente;


        const documento =
            normalizarValorCliente(
                referencia.cliente_documento
            );


        const correo =
            normalizarValorCliente(
                referencia.cliente_correo
            );


        const telefono =
            normalizarValorCliente(
                referencia.cliente_telefono
            );


        if (
            documento
        ) {

            campoCliente =
                "cliente_documento";

            valorCliente =
                documento;

        } else if (
            correo
        ) {

            campoCliente =
                "cliente_correo";

            valorCliente =
                correo;

        } else {

            campoCliente =
                "cliente_telefono";

            valorCliente =
                telefono;

        }


        /* -------------------------------------------------
           HISTORIAL DEL CLIENTE

           campoCliente NO procede del navegador.
           Es seleccionado únicamente entre tres valores
           controlados por este archivo.
        ------------------------------------------------- */

        const reservaciones =
            await conexion.query(
                `
                SELECT

                    r.id,
                    r.codigo,

                    r.cliente_nombre,
                    r.cliente_documento,
                    r.cliente_correo,
                    r.cliente_telefono,
                    r.cliente_edad,
                    r.cliente_licencia,

                    r.cantidad_vehiculos,

                    r.fecha_recogida,
                    r.hora_recogida,

                    r.fecha_entrega,
                    r.hora_entrega,

                    r.estado,
                    r.origen,

                    r.total,

                    r.fecha_creacion,

                    m.marca
                        AS modelo_marca,

                    m.nombre
                        AS modelo_nombre

                FROM reservaciones r

                LEFT JOIN modelos_vehiculos m

                    ON m.id =
                        r.modelo_id

                    AND m.agencia_id =
                        r.agencia_id

                WHERE
                    r.agencia_id = ?

                    AND LOWER(
                        TRIM(
                            COALESCE(
                                r.${campoCliente},
                                ''
                            )
                        )
                    ) = ?

                ORDER BY
                    r.fecha_creacion DESC,
                    r.id DESC
                `,
                [
                    agenciaId,
                    valorCliente
                ]
            );


        if (
            !reservaciones.length
        ) {

            return res
                .status(404)
                .send(
                    "No se encontró historial para este cliente."
                );

        }


        /* -------------------------------------------------
           DATOS PRINCIPALES

           La primera reservación es la más reciente.
           Por eso utilizamos sus datos como información
           principal visible del perfil.
        ------------------------------------------------- */

        const ultimaInformacion =
            reservaciones[0];


        const cliente =
        {

            nombre:
                ultimaInformacion.cliente_nombre,

            documento:
                ultimaInformacion.cliente_documento,

            correo:
                ultimaInformacion.cliente_correo,

            telefono:
                ultimaInformacion.cliente_telefono,

            edad:
                ultimaInformacion.cliente_edad,

            licencia:
                ultimaInformacion.cliente_licencia

        };


        /* -------------------------------------------------
           RESUMEN DEL CLIENTE
        ------------------------------------------------- */

        const estadosActivos =
            new Set([
                "pendiente",
                "pendiente_pago",
                "confirmada",
                "en_curso"
            ]);


        const resumen =
        {

            totalReservaciones:
                reservaciones.length,

            reservacionesActivas:
                reservaciones.filter(
                    (reservacion) =>
                        estadosActivos.has(
                            reservacion.estado
                        )
                ).length,

            finalizadas:
                reservaciones.filter(
                    (reservacion) =>
                        reservacion.estado ===
                        "finalizada"
                ).length,

            recurrente:
                reservaciones.length >= 2

        };


        return res.render(
            "panel/clientes/detalle",
            {

                titulo:
                    "Detalle del cliente",

                subtituloPagina:
                    "Perfil del cliente",

                paginaActual:
                    "clientes",

                usuario:
                    req.usuarioAgencia,

                agencia:
                    req.agencia,

                suscripcion:
                    req.suscripcion,

                plan:
                    req.plan,

                cliente,

                resumen,

                reservaciones

            }
        );


    } catch (
        error
    ) {

        console.error(
            "Error mostrando detalle del cliente:",
            error
        );


        return res
            .status(500)
            .send(
                "No fue posible cargar el cliente."
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
   EXPORTACIONES
========================================================= */

module.exports = {

    mostrarClientesPanel,

    mostrarDetalleClientePanel

};