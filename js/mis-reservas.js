/* =========================================================
   AUTORENTCAR - MIS RESERVACIONES
========================================================= */

let reservacionesUsuario = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarReservacionesUsuario();
    configurarFiltrosReservaciones();
    configurarModalesReservaciones();
});

/* =========================================================
   CONTEXTO DE AGENCIA
========================================================= */

function obtenerSlugAgenciaMisReservas() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const slug =
        String(
            parametros.get("agencia") ||
            "autorentcar"
        )
            .trim()
            .toLowerCase();


    return slug ||
        "autorentcar";

}


function obtenerClaveReservacionesMisReservas() {

    return `autorentcarReservaciones:${obtenerSlugAgenciaMisReservas()}`;

}


function obtenerClaveUltimaReservacionMisReservas() {

    return `autorentcarUltimaReservacion:${obtenerSlugAgenciaMisReservas()}`;

}


/* =========================================================
   VALIDAR AGENCIA DE RESERVACIÓN
========================================================= */

function reservacionPerteneceAgenciaActual(
    reservacion
) {

    const slugActual =
        obtenerSlugAgenciaMisReservas();


    const slugReservacion =
        String(
            reservacion?.agencia?.slug ||
            reservacion?.vehiculo?.agenciaSlug ||
            ""
        )
            .trim()
            .toLowerCase();


    /*
     * Permitimos reservaciones antiguas que todavía
     * no tengan información de agencia.
     */

    if (!slugReservacion) {

        return true;

    }


    return (
        slugReservacion ===
        slugActual
    );

}

/* =========================================================
   CARGAR DATOS
========================================================= */

/* =========================================================
   ESTADO AMIGABLE DESDE MARIADB
========================================================= */

function obtenerTextoEstadoServidorMisReservas(
    estado
) {

    const estadoSeguro =
        String(
            estado ||
            ""
        )
            .trim()
            .toLowerCase();


    const estados = {

        pendiente:
            "Pendiente de confirmación",

        pendiente_pago:
            "Pendiente de pago",

        confirmada:
            "Confirmada",

        en_curso:
            "En curso",

        finalizada:
            "Finalizada",

        rechazada:
            "Rechazada",

        cancelada:
            "Cancelada"

    };


    return (
        estados[estadoSeguro] ||
        estado ||
        "Pendiente de confirmación"
    );

}


/* =========================================================
   CONSULTAR RESERVACIÓN REAL EN MARIADB
========================================================= */

async function consultarReservacionServidorMisReservas(
    reservacion
) {

    const codigo =
        String(
            reservacion?.codigo ||
            ""
        ).trim();


    const correo =
        String(
            reservacion?.cliente?.correo ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !codigo ||
        !correo
    ) {

        return null;

    }


    const slug =
        obtenerSlugAgenciaMisReservas();


    const respuesta =
        await fetch(
            `/api/agencias/${encodeURIComponent(
                slug
            )}/reservaciones/consulta`,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        codigo,
                        correo

                    })

            }
        );


    let datos;


    try {

        datos =
            await respuesta.json();

    } catch (error) {

        return null;

    }


    if (
        !respuesta.ok ||
        !datos?.ok ||
        !datos?.reservacion
    ) {

        return null;

    }


    return datos.reservacion;

}


/* =========================================================
   APLICAR DATOS REALES DEL SERVIDOR
========================================================= */

function aplicarReservacionServidorMisReservas(
    reservacionLocal,
    reservacionServidor
) {

    if (
        !reservacionLocal ||
        !reservacionServidor
    ) {

        return reservacionLocal;

    }


    reservacionLocal.id =
        Number(
            reservacionServidor.id ||
            reservacionLocal.id ||
            0
        );


    reservacionLocal.codigo =
        reservacionServidor.codigo ||
        reservacionLocal.codigo;


    reservacionLocal.estadoServidor =
        reservacionServidor.estado ||
        reservacionLocal.estadoServidor ||
        "pendiente";


    reservacionLocal.estado =
        obtenerTextoEstadoServidorMisReservas(
            reservacionServidor.estado
        );


    reservacionLocal.agencia = {

        ...reservacionLocal.agencia,

        id:
            Number(
                reservacionServidor
                    .agencia
                    ?.id ||
                reservacionLocal
                    .agencia
                    ?.id ||
                0
            ),

        nombre:
            reservacionServidor
                .agencia
                ?.nombre ||
            reservacionLocal
                .agencia
                ?.nombre ||
            "",

        slug:
            reservacionServidor
                .agencia
                ?.slug ||
            reservacionLocal
                .agencia
                ?.slug ||
            obtenerSlugAgenciaMisReservas()

    };


    reservacionLocal.vehiculo = {

        ...reservacionLocal.vehiculo,

        id:
            Number(
                reservacionServidor
                    .modelo
                    ?.id ||
                reservacionLocal
                    .vehiculo
                    ?.id ||
                0
            ),

        nombre:
            reservacionServidor
                .modelo
                ?.nombre ||
            reservacionLocal
                .vehiculo
                ?.nombre ||
            "",

        marca:
            reservacionServidor
                .modelo
                ?.marca ||
            reservacionLocal
                .vehiculo
                ?.marca ||
            "",

        categoria:
            reservacionServidor
                .modelo
                ?.categoria ||
            reservacionLocal
                .vehiculo
                ?.categoria ||
            "",

        transmision:
            reservacionServidor
                .modelo
                ?.transmision ||
            reservacionLocal
                .vehiculo
                ?.transmision ||
            "",

        combustible:
            reservacionServidor
                .modelo
                ?.combustible ||
            reservacionLocal
                .vehiculo
                ?.combustible ||
            "",

        pasajeros:
            Number(
                reservacionServidor
                    .modelo
                    ?.pasajeros ||
                reservacionLocal
                    .vehiculo
                    ?.pasajeros ||
                0
            ),

        puertas:
            Number(
                reservacionServidor
                    .modelo
                    ?.puertas ||
                reservacionLocal
                    .vehiculo
                    ?.puertas ||
                0
            ),

        equipaje:
            Number(
                reservacionServidor
                    .modelo
                    ?.equipaje ||
                reservacionLocal
                    .vehiculo
                    ?.equipaje ||
                0
            ),

        aire:
            Boolean(
                reservacionServidor
                    .modelo
                    ?.aire
            ),

        imagen:
            reservacionServidor
                .modelo
                ?.imagen ||
            reservacionLocal
                .vehiculo
                ?.imagen ||
            "",

        precio:
            Number(
                reservacionServidor
                    .precioDiario ||
                reservacionLocal
                    .vehiculo
                    ?.precio ||
                0
            )

    };


    reservacionLocal.cantidadVehiculos =
        Number(
            reservacionServidor
                .cantidadVehiculos ||
            reservacionLocal
                .cantidadVehiculos ||
            1
        );


    reservacionLocal.fechaRecogida =
        reservacionServidor
            .periodo
            ?.fechaRecogida ||
        reservacionLocal.fechaRecogida;


    reservacionLocal.horaRecogida =
        reservacionServidor
            .periodo
            ?.horaRecogida ||
        reservacionLocal.horaRecogida;


    reservacionLocal.fechaEntrega =
        reservacionServidor
            .periodo
            ?.fechaEntrega ||
        reservacionLocal.fechaEntrega;


    reservacionLocal.horaEntrega =
        reservacionServidor
            .periodo
            ?.horaEntrega ||
        reservacionLocal.horaEntrega;


    reservacionLocal.lugarRecogida =
        reservacionServidor
            .lugarRecogida ||
        reservacionLocal.lugarRecogida;


    reservacionLocal.lugarEntrega =
        reservacionServidor
            .lugarEntrega ||
        reservacionLocal.lugarEntrega;


    reservacionLocal.cliente = {

        ...reservacionLocal.cliente,

        nombre:
            reservacionServidor
                .cliente
                ?.nombre ||
            reservacionLocal
                .cliente
                ?.nombre ||
            "",

        correo:
            reservacionServidor
                .cliente
                ?.correo ||
            reservacionLocal
                .cliente
                ?.correo ||
            "",

        telefono:
            reservacionServidor
                .cliente
                ?.telefono ||
            reservacionLocal
                .cliente
                ?.telefono ||
            ""

    };


    reservacionLocal.adicionales =
        Array.isArray(
            reservacionServidor.adicionales
        )
            ? reservacionServidor.adicionales
            : reservacionLocal.adicionales;


    reservacionLocal.codigoPromocional =
        reservacionServidor
            .codigoPromocional ||
        null;


    reservacionLocal.dias =
        Number(
            reservacionServidor.dias ||
            0
        );


    reservacionLocal.precioDiario =
        Number(
            reservacionServidor
                .precioDiario ||
            0
        );


    reservacionLocal.subtotal =
        Number(
            reservacionServidor.subtotal ||
            0
        );


    reservacionLocal.costoAdicionales =
        Number(
            reservacionServidor
                .costoAdicionales ||
            0
        );


    reservacionLocal.descuento =
        Number(
            reservacionServidor.descuento ||
            0
        );


    reservacionLocal.total =
        Number(
            reservacionServidor.total ||
            0
        );


    reservacionLocal.fechaRegistro =
        reservacionServidor
            .fechaRegistro ||
        reservacionLocal.fechaRegistro;


    return reservacionLocal;

}


/* =========================================================
   SINCRONIZAR LISTADO CON MARIADB
========================================================= */

async function sincronizarReservacionesMisReservas(
    reservaciones
) {

    return Promise.all(
        reservaciones.map(
            async (reservacion) => {

                try {

                    const reservacionServidor =
                        await consultarReservacionServidorMisReservas(
                            reservacion
                        );


                    if (
                        !reservacionServidor
                    ) {

                        return reservacion;

                    }


                    return aplicarReservacionServidorMisReservas(
                        reservacion,
                        reservacionServidor
                    );

                } catch (error) {

                    console.error(
                        "No fue posible actualizar una reservación desde el servidor:",
                        error
                    );


                    /*
                     * Si el servidor no está disponible,
                     * conservamos la información local.
                     */
                    return reservacion;

                }

            }
        )
    );

}
async function cargarReservacionesUsuario() {

    const contenido =
        localStorage.getItem(
            obtenerClaveReservacionesMisReservas()
        );


    if (!contenido) {

        reservacionesUsuario = [];

    } else {

        try {

            const reservaciones =
                JSON.parse(
                    contenido
                );


            reservacionesUsuario =
                Array.isArray(
                    reservaciones
                )
                    ? reservaciones.filter(
                        reservacionPerteneceAgenciaActual
                    )
                    : [];

        } catch (error) {

            reservacionesUsuario = [];


            console.error(
                "No fue posible cargar las reservaciones.",
                error
            );

        }

    }


    /*
     * Primero mostramos la copia local inmediatamente.
     */
    actualizarEstadisticasReservaciones();
    aplicarFiltrosReservaciones();


    if (
        reservacionesUsuario.length === 0
    ) {

        return;

    }


    /*
     * Después consultamos MariaDB y actualizamos
     * solamente los datos que el servidor confirma.
     */
    const reservacionesSincronizadas =
        await sincronizarReservacionesMisReservas(
            reservacionesUsuario
        );


    reservacionesUsuario =
        reservacionesSincronizadas;


    localStorage.setItem(
        obtenerClaveReservacionesMisReservas(),
        JSON.stringify(
            reservacionesUsuario
        )
    );


    /*
     * Volvemos a pintar con el estado real.
     */
    actualizarEstadisticasReservaciones();
    aplicarFiltrosReservaciones();

}

/* =========================================================
   FILTROS
========================================================= */

function configurarFiltrosReservaciones() {
    const buscar = document.getElementById(
        "buscar-reservacion"
    );

    const estado = document.getElementById(
        "filtrar-estado-reserva"
    );

    const ordenar = document.getElementById(
        "ordenar-reservaciones"
    );

    buscar?.addEventListener(
        "input",
        aplicarFiltrosReservaciones
    );

    estado?.addEventListener(
        "change",
        aplicarFiltrosReservaciones
    );

    ordenar?.addEventListener(
        "change",
        aplicarFiltrosReservaciones
    );
}

function aplicarFiltrosReservaciones() {
    const texto = normalizarReservaTexto(
        document.getElementById(
            "buscar-reservacion"
        )?.value || ""
    );

    const estado =
        document.getElementById(
            "filtrar-estado-reserva"
        )?.value || "todos";

    const orden =
        document.getElementById(
            "ordenar-reservaciones"
        )?.value || "recientes";

    let resultados =
        reservacionesUsuario.filter(
            (reserva) => {
                const contenido =
                    normalizarReservaTexto(
                        [
                            reserva.codigo,
                            reserva.cliente?.nombre,
                            reserva.cliente?.documento,
                            reserva.cliente?.correo,
                            reserva.cliente?.telefono,
                            reserva.vehiculo?.nombre,
                            reserva.lugarRecogida,
                            reserva.lugarEntrega,
                            reserva.estado,
                            obtenerCantidadReservada(
                                reserva
                            )
                        ].join(" ")
                    );

                const coincideTexto =
                    contenido.includes(texto);

                const estadoNormalizado =
                    obtenerEstadoNormalizado(
                        reserva.estado
                    );

                const coincideEstado =
                    estado === "todos" ||
                    estadoNormalizado === estado;

                return (
                    coincideTexto &&
                    coincideEstado
                );
            }
        );

    resultados = ordenarReservaciones(
        resultados,
        orden
    );

    mostrarReservaciones(resultados);
}

function ordenarReservaciones(lista, tipo) {
    const copia = [...lista];

    switch (tipo) {
        case "antiguas":
            return copia.sort(
                (a, b) =>
                    obtenerTiempoFecha(
                        a.fechaRegistro
                    ) -
                    obtenerTiempoFecha(
                        b.fechaRegistro
                    )
            );

        case "precio-mayor":
            return copia.sort(
                (a, b) =>
                    Number(b.total || 0) -
                    Number(a.total || 0)
            );

        case "precio-menor":
            return copia.sort(
                (a, b) =>
                    Number(a.total || 0) -
                    Number(b.total || 0)
            );

        case "recientes":
        default:
            return copia.sort(
                (a, b) =>
                    obtenerTiempoFecha(
                        b.fechaRegistro
                    ) -
                    obtenerTiempoFecha(
                        a.fechaRegistro
                    )
            );
    }
}

function obtenerTiempoFecha(fechaTexto) {
    const fecha = new Date(
        fechaTexto || ""
    );

    if (Number.isNaN(fecha.getTime())) {
        return 0;
    }

    return fecha.getTime();
}

/* =========================================================
   MOSTRAR TARJETAS
========================================================= */

function mostrarReservaciones(lista) {
    const contenedor = document.getElementById(
        "lista-reservaciones"
    );

    const sinReservaciones =
        document.getElementById(
            "sin-reservaciones"
        );

    if (!contenedor) {
        return;
    }

    if (!lista.length) {
        contenedor.innerHTML = "";

        sinReservaciones?.classList.add(
            "visible"
        );

        return;
    }

    sinReservaciones?.classList.remove(
        "visible"
    );

    contenedor.innerHTML = lista
        .map(crearTarjetaReservacion)
        .join("");
}

function crearTarjetaReservacion(reserva) {
    const estado = obtenerEstadoNormalizado(
        reserva.estado
    );

    const codigoSeguro = escaparReservaHTML(
        reserva.codigo || ""
    );

    const cantidadVehiculos =
        obtenerCantidadReservada(reserva);

    const textoCantidad =
        formatearCantidadVehiculos(
            cantidadVehiculos
        );

    return `
        <article class="tarjeta-reservacion">

            <div class="tarjeta-reservacion-imagen">

                <img
                    src="${escaparReservaHTML(
                        reserva.vehiculo?.imagen || ""
                    )}"
                    alt="${escaparReservaHTML(
                        reserva.vehiculo?.nombre ||
                        "Vehículo"
                    )}"
                    loading="lazy"
                >

                <span class="estado-reservacion ${estado}">
                    ${escaparReservaHTML(
                        reserva.estado ||
                        "Pendiente de confirmación"
                    )}
                </span>

            </div>

            <div class="tarjeta-reservacion-contenido">

                <div class="reservacion-codigo-fecha">

                    <strong>
                        ${codigoSeguro}
                    </strong>

                    <span>
                        Registrada el
                        ${formatearFechaReservaListado(
                            reserva.fechaRegistro
                        )}
                    </span>

                </div>

                <h2>
                    ${escaparReservaHTML(
                        reserva.vehiculo?.nombre ||
                        "Vehículo"
                    )}
                </h2>

                <p class="nombre-cliente-reserva">
                    Reservado por
                    ${escaparReservaHTML(
                        reserva.cliente?.nombre ||
                        "Cliente"
                    )}
                </p>

                <div class="detalles-rapidos-reserva">

                    <span>
                        <i class="fa-solid fa-location-dot"></i>

                        ${escaparReservaHTML(
                            reserva.lugarRecogida ||
                            "Sin ubicación"
                        )}
                    </span>

                    <span>
                        <i class="fa-solid fa-calendar-day"></i>

                        ${formatearFechaSimpleReserva(
                            reserva.fechaRecogida
                        )}
                    </span>

                    <span>
                        <i class="fa-solid fa-clock"></i>

                        ${formatearDiasReserva(
                            reserva.dias
                        )}
                    </span>

                    <span>
                        <i class="fa-solid fa-car-side"></i>

                        ${textoCantidad}
                    </span>

                </div>

            </div>

            <div class="tarjeta-reservacion-acciones">

                <div class="precio-reserva-listado">

                    <span>Total estimado</span>

                    <strong>
                        ${formatearMonedaReserva(
                            reserva.total
                        )}
                    </strong>

                </div>

                <button
                    type="button"
                    class="boton-ver-reserva"
                    onclick="verDetalleReservacion(
                        '${codigoSeguro}'
                    )"
                >
                    Ver detalles
                    
                </button>

            </div>

        </article>
    `;
}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticasReservaciones() {
    const pendientes =
        reservacionesUsuario.filter(
            (reserva) =>
                obtenerEstadoNormalizado(
                    reserva.estado
                ) === "pendiente"
        ).length;

    const confirmadas =
        reservacionesUsuario.filter(
            (reserva) =>
                obtenerEstadoNormalizado(
                    reserva.estado
                ) === "confirmada"
        ).length;

    const canceladas =
        reservacionesUsuario.filter(
            (reserva) =>
                obtenerEstadoNormalizado(
                    reserva.estado
                ) === "cancelada"
        ).length;

    colocarReservaTexto(
        "total-reservaciones",
        reservacionesUsuario.length
    );

    colocarReservaTexto(
        "total-pendientes",
        pendientes
    );

    colocarReservaTexto(
        "total-confirmadas",
        confirmadas
    );

    colocarReservaTexto(
        "total-canceladas",
        canceladas
    );
}

/* =========================================================
   DETALLES
========================================================= */

function verDetalleReservacion(codigo) {
    const reserva =
        reservacionesUsuario.find(
            (elemento) =>
                elemento.codigo === codigo
        );

    const modal = document.getElementById(
        "modal-detalle-reserva"
    );

    const contenido = document.getElementById(
        "contenido-detalle-reserva"
    );

    if (!reserva || !modal || !contenido) {
        mostrarNotificacion(
            "Reservación no encontrada",
            "No fue posible encontrar la información solicitada."
        );

        return;
    }

    const cantidadVehiculos =
        obtenerCantidadReservada(reserva);

    const textoCantidad =
        formatearCantidadVehiculos(
            cantidadVehiculos
        );

    const precioDiario =
        obtenerNumeroReserva(
            reserva.precioDiario ??
            reserva.vehiculo?.precio
        );

    const dias =
        obtenerNumeroEnteroReserva(
            reserva.dias,
            0
        );

    const subtotalCalculado =
        precioDiario *
        dias *
        cantidadVehiculos;

    const subtotal =
        Number.isFinite(
            Number(reserva.subtotal)
        )
            ? Number(reserva.subtotal)
            : subtotalCalculado;

    contenido.innerHTML = `
        <div class="detalle-reserva-encabezado">

            <span>Código de reservación</span>

            <h2>
                ${escaparReservaHTML(
                    reserva.codigo
                )}
            </h2>

            <p>
                Estado:

                <strong>
                    ${escaparReservaHTML(
                        reserva.estado ||
                        "Pendiente de confirmación"
                    )}
                </strong>
            </p>

        </div>

        <div class="detalle-reserva-cuerpo">

            <div class="detalle-vehiculo-reserva">

                <img
                    src="${escaparReservaHTML(
                        reserva.vehiculo?.imagen ||
                        ""
                    )}"
                    alt="${escaparReservaHTML(
                        reserva.vehiculo?.nombre ||
                        "Vehículo"
                    )}"
                >

                <div>

                    <span class="subtitulo">
                        ${escaparReservaHTML(
                            reserva.vehiculo
                                ?.categoriaTexto ||
                            reserva.vehiculo
                                ?.categoria ||
                            "Sin categoría"
                        )}
                    </span>

                    <h2>
                        ${escaparReservaHTML(
                            reserva.vehiculo?.nombre ||
                            "Vehículo"
                        )}
                    </h2>

                    <p>
                        ${escaparReservaHTML(
                            reserva.vehiculo
                                ?.transmision ||
                            "Sin información"
                        )}

                        ·

                        ${Number(
                            reserva.vehiculo
                                ?.pasajeros || 0
                        )} pasajeros
                    </p>

                    <p>
                        <strong>
                            ${textoCantidad}
                        </strong>

                        reservados
                    </p>

                </div>

            </div>

            <div class="rejilla-detalle-reservacion">

                ${crearDatoDetalle(
                    "Cliente",
                    reserva.cliente?.nombre
                )}

                ${crearDatoDetalle(
                    "Documento",
                    reserva.cliente?.documento
                )}

                ${crearDatoDetalle(
                    "Correo",
                    reserva.cliente?.correo
                )}

                ${crearDatoDetalle(
                    "Teléfono",
                    reserva.cliente?.telefono
                )}

                ${crearDatoDetalle(
                    "Edad",
                    reserva.cliente?.edad
                        ? `${reserva.cliente.edad} años`
                        : "Sin información"
                )}

                ${crearDatoDetalle(
                    "Licencia",
                    reserva.cliente?.licencia
                )}

                ${crearDatoDetalle(
                    "Lugar de recogida",
                    reserva.lugarRecogida
                )}

                ${crearDatoDetalle(
                    "Lugar de devolución",
                    reserva.lugarEntrega
                )}

                ${crearDatoDetalle(
                    "Fecha de recogida",
                    formatearFechaSimpleReserva(
                        reserva.fechaRecogida
                    )
                )}

                ${crearDatoDetalle(
                    "Hora de recogida",
                    formatearHoraReserva(
                        reserva.horaRecogida
                    )
                )}

                ${crearDatoDetalle(
                    "Fecha de devolución",
                    formatearFechaSimpleReserva(
                        reserva.fechaEntrega
                    )
                )}

                ${crearDatoDetalle(
                    "Hora de devolución",
                    formatearHoraReserva(
                        reserva.horaEntrega
                    )
                )}

                ${crearDatoDetalle(
                    "Duración",
                    formatearDiasReserva(
                        dias
                    )
                )}

                ${crearDatoDetalle(
                    "Cantidad reservada",
                    textoCantidad
                )}

                ${crearDatoDetalle(
                    "Precio por vehículo/día",
                    formatearMonedaReserva(
                        precioDiario
                    )
                )}

                ${crearDatoDetalle(
                    "Subtotal de vehículos",
                    formatearMonedaReserva(
                        subtotal
                    )
                )}

                ${crearDatoDetalle(
                    "Servicios adicionales",
                    obtenerAdicionalesReserva(
                        reserva.adicionales
                    )
                )}

                ${crearDatoDetalle(
                    "Costo de adicionales",
                    formatearMonedaReserva(
                        reserva.costoAdicionales
                    )
                )}

                ${crearDatoDetalle(
                    "Código promocional",
                    reserva.codigoPromocional ||
                    "No aplicado"
                )}

                ${crearDatoDetalle(
                    "Descuento",
                    `-${formatearMonedaReserva(
                        reserva.descuento
                    )}`
                )}

                ${crearDatoDetalle(
                    "Comentarios",
                    reserva.comentarios ||
                    "Sin comentarios"
                )}

                ${
                    reserva.fechaCancelacion
                        ? crearDatoDetalle(
                            "Fecha de cancelación",
                            formatearFechaReservaListado(
                                reserva.fechaCancelacion
                            )
                        )
                        : ""
                }

                ${
                    reserva.fechaRestauracion
                        ? crearDatoDetalle(
                            "Última restauración",
                            formatearFechaReservaListado(
                                reserva.fechaRestauracion
                            )
                        )
                        : ""
                }

            </div>

            <div class="total-detalle-reserva">

                <span>Total estimado</span>

                <strong>
                    ${formatearMonedaReserva(
                        reserva.total
                    )}
                </strong>

            </div>

        </div>
    `;

    modal.classList.add("activo");
    actualizarBloqueoPagina();
}

function obtenerAdicionalesReserva(
    adicionales
) {
    if (!Array.isArray(adicionales)) {
        return "Ninguno";
    }

    const nombres = adicionales
        .map((item) => item?.nombre)
        .filter(Boolean);

    return nombres.length
        ? nombres.join(", ")
        : "Ninguno";
}

function crearDatoDetalle(titulo, valor) {
    const contenido =
        valor === 0
            ? "0"
            : valor ||
            "Sin información";

    return `
        <article>

            <span>
                ${escaparReservaHTML(titulo)}
            </span>

            <strong>
                ${escaparReservaHTML(contenido)}
            </strong>

        </article>
    `;
}

/* =========================================================
   MODALES
========================================================= */

function configurarModalesReservaciones() {
    const modalDetalle =
        document.getElementById(
            "modal-detalle-reserva"
        );

    const cerrarDetalle =
        document.getElementById(
            "cerrar-detalle-reserva"
        );

    cerrarDetalle?.addEventListener(
        "click",
        () => {
            cerrarModalReserva(
                modalDetalle
            );
        }
    );

    modalDetalle?.addEventListener(
        "click",
        (evento) => {
            if (
                evento.target ===
                modalDetalle
            ) {
                cerrarModalReserva(
                    modalDetalle
                );
            }
        }
    );

    document.addEventListener(
        "keydown",
        (evento) => {
            if (evento.key !== "Escape") {
                return;
            }

            cerrarModalReserva(
                modalDetalle
            );
        }
    );
}

function cerrarModalReserva(modal) {
    modal?.classList.remove("activo");
    actualizarBloqueoPagina();
}

function actualizarBloqueoPagina() {
    const hayModalActivo =
        document.querySelector(
            ".modal.activo"
        );

    document.body.style.overflow =
        hayModalActivo
            ? "hidden"
            : "";
}

/* =========================================================
   ESTADOS
========================================================= */

function obtenerEstadoNormalizado(estado) {
    const valor =
        normalizarReservaTexto(
            estado || ""
        );

    if (valor.includes("cancel")) {
        return "cancelada";
    }

    if (valor.includes("rechaz")) {
        return "rechazada";
    }

    if (valor.includes("confirm")) {
        return "confirmada";
    }

    if (valor.includes("curso")) {
        return "en-curso";
    }

    if (
        valor.includes("entregado") ||
        valor.includes("entregada")
    ) {
        return "entregado";
    }

    if (
        valor.includes("final") ||
        valor.includes("complet")
    ) {
        return "finalizada";
    }

    return "pendiente";
}

/* =========================================================
   CANTIDAD DE VEHÍCULOS
========================================================= */

function obtenerCantidadReservada(reserva) {
    const cantidad = Number(
        reserva?.cantidadVehiculos
    );

    /*
     * Las reservaciones anteriores a esta mejora
     * se consideran reservaciones de una unidad.
     */
    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {
        return 1;
    }

    return cantidad;
}

function formatearCantidadVehiculos(
    cantidad
) {
    const total = Number(cantidad) || 0;

    if (total === 1) {
        return "1 vehículo";
    }

    return `${total} vehículos`;
}

function formatearDiasReserva(cantidad) {
    const dias =
        obtenerNumeroEnteroReserva(
            cantidad,
            0
        );

    if (dias === 1) {
        return "1 día";
    }

    return `${dias} días`;
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function normalizarReservaTexto(texto) {
    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();
}

function obtenerNumeroReserva(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function obtenerNumeroEnteroReserva(
    valor,
    alternativa = 0
) {
    const numero = Number(valor);

    return Number.isInteger(numero)
        ? numero
        : alternativa;
}

function formatearMonedaReserva(valor) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(
        obtenerNumeroReserva(valor)
    );
}

function formatearFechaReservaListado(
    fechaTexto
) {
    if (!fechaTexto) {
        return "Sin fecha";
    }

    const fecha = new Date(fechaTexto);

    if (Number.isNaN(fecha.getTime())) {
        return "Sin fecha";
    }

    return fecha.toLocaleDateString(
        "es-DO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatearFechaSimpleReserva(
    fechaTexto
) {
    if (!fechaTexto) {
        return "Sin fecha";
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (Number.isNaN(fecha.getTime())) {
        return "Sin fecha";
    }

    return fecha.toLocaleDateString(
        "es-DO",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatearFechaCompletaReserva(
    fechaTexto
) {
    if (!fechaTexto) {
        return "una fecha no disponible";
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (Number.isNaN(fecha.getTime())) {
        return fechaTexto;
    }

    return fecha.toLocaleDateString(
        "es-DO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function formatearHoraReserva(
    horaTexto
) {
    if (!horaTexto) {
        return "Sin información";
    }

    const partes = String(
        horaTexto
    ).split(":");

    if (partes.length < 2) {
        return horaTexto;
    }

    const hora = Number(partes[0]);
    const minutos = Number(partes[1]);

    if (
        !Number.isInteger(hora) ||
        !Number.isInteger(minutos)
    ) {
        return horaTexto;
    }

    const fecha = new Date();

    fecha.setHours(
        hora,
        minutos,
        0,
        0
    );

    return fecha.toLocaleTimeString(
        "es-DO",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function colocarReservaTexto(id, valor) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

function escaparReservaHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto ?? "");

    return elemento.innerHTML;
}