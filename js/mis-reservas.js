/* =========================================================
   AUTORENTCAR - MIS RESERVACIONES
========================================================= */

let reservacionesUsuario = [];
let codigoReservaCancelar = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarReservacionesUsuario();
    configurarFiltrosReservaciones();
    configurarModalesReservaciones();
});

/* =========================================================
   CARGAR DATOS
========================================================= */

function cargarReservacionesUsuario() {
    const contenido = localStorage.getItem(
        "autorentcarReservaciones"
    );

    if (!contenido) {
        reservacionesUsuario = [];
    } else {
        try {
            const reservaciones = JSON.parse(
                contenido
            );

            reservacionesUsuario =
                Array.isArray(reservaciones)
                    ? reservaciones
                    : [];
        } catch (error) {
            reservacionesUsuario = [];

            console.error(
                "No fue posible cargar las reservaciones.",
                error
            );
        }
    }

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

    const estaCancelada =
        estado === "cancelada";

    const puedeCancelarse =
        ![
            "cancelada",
            "finalizada",
            "rechazada"
        ].includes(estado);

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

                ${
                    estaCancelada
                        ? `
                            <button
                                type="button"
                                class="boton-restaurar-reserva"
                                onclick="restaurarReservacion(
                                    '${codigoSeguro}'
                                )"
                            >
                                Restaurar solicitud
                            </button>
                        `
                        : puedeCancelarse
                            ? `
                                <button
                                    type="button"
                                    class="boton-cancelar-reserva"
                                    onclick="solicitarCancelarReservacion(
                                        '${codigoSeguro}'
                                    )"
                                >
                                    Cancelar
                                </button>
                            `
                            : ""
                }

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
                    "Lugar de entrega",
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
                    "Fecha de entrega",
                    formatearFechaSimpleReserva(
                        reserva.fechaEntrega
                    )
                )}

                ${crearDatoDetalle(
                    "Hora de entrega",
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
   CANCELAR
========================================================= */

function solicitarCancelarReservacion(codigo) {
    const reserva =
        reservacionesUsuario.find(
            (elemento) =>
                elemento.codigo === codigo
        );

    if (!reserva) {
        mostrarNotificacion(
            "Reservación no encontrada",
            "No fue posible localizar la solicitud."
        );

        return;
    }

    const estado = obtenerEstadoNormalizado(
        reserva.estado
    );

    if (estado === "cancelada") {
        mostrarNotificacion(
            "Reservación cancelada",
            "Esta reservación ya se encuentra cancelada."
        );

        return;
    }

    if (
        estado === "finalizada" ||
        estado === "rechazada"
    ) {
        mostrarNotificacion(
            "Acción no permitida",
            "Esta reservación no puede cancelarse."
        );

        return;
    }

    codigoReservaCancelar = codigo;

    const modal = document.getElementById(
        "modal-cancelar-reserva"
    );

    modal?.classList.add("activo");
    actualizarBloqueoPagina();
}

function confirmarCancelacionReservacion() {
    if (!codigoReservaCancelar) {
        return;
    }

    const indice =
        reservacionesUsuario.findIndex(
            (reserva) =>
                reserva.codigo ===
                codigoReservaCancelar
        );

    if (indice === -1) {
        mostrarNotificacion(
            "Reservación no encontrada",
            "No fue posible cancelar la solicitud."
        );

        codigoReservaCancelar = null;
        cerrarModalCancelacion();

        return;
    }

    const reserva =
        reservacionesUsuario[indice];

    const codigoCancelado =
        reserva.codigo;

    const cantidadLiberada =
        obtenerCantidadReservada(reserva);

    reserva.estado = "Cancelada";

    reserva.fechaCancelacion =
        new Date().toISOString();

    guardarReservacionesActualizadas();

    cerrarModalCancelacion();

    mostrarNotificacion(
        "Reservación cancelada",
        `La solicitud ${codigoCancelado} fue cancelada. ${formatearCantidadVehiculos(
            cantidadLiberada
        )} quedaron disponibles para esas fechas.`
    );

    codigoReservaCancelar = null;
}

/* =========================================================
   RESTAURAR
========================================================= */

function restaurarReservacion(codigo) {
    const indice =
        reservacionesUsuario.findIndex(
            (reserva) =>
                reserva.codigo === codigo
        );

    if (indice === -1) {
        mostrarNotificacion(
            "Reservación no encontrada",
            "No fue posible restaurar la solicitud."
        );

        return;
    }

    const reserva =
        reservacionesUsuario[indice];

    if (
        obtenerEstadoNormalizado(
            reserva.estado
        ) !== "cancelada"
    ) {
        mostrarNotificacion(
            "Acción no disponible",
            "Solo se pueden restaurar las reservaciones canceladas."
        );

        return;
    }

    const disponibilidad =
        obtenerDisponibilidadAlRestaurar(
            reserva
        );

    const cantidadSolicitada =
        obtenerCantidadReservada(reserva);

    if (
        disponibilidad.cantidadDisponible < 1
    ) {
        mostrarNotificacion(
            "No se puede restaurar",
            `No quedan unidades disponibles de ${reserva.vehiculo?.nombre || "este vehículo"} para el periodo del ${formatearFechaCompletaReserva(
                reserva.fechaRecogida
            )} al ${formatearFechaCompletaReserva(
                reserva.fechaEntrega
            )}.`
        );

        return;
    }

    if (
        cantidadSolicitada >
        disponibilidad.cantidadDisponible
    ) {
        mostrarNotificacion(
            "Cantidad insuficiente",
            `La solicitud necesita ${formatearCantidadVehiculos(
                cantidadSolicitada
            )}, pero solo quedan ${formatearCantidadVehiculos(
                disponibilidad.cantidadDisponible
            )} disponibles para esas fechas.`
        );

        return;
    }

    reserva.estado =
        "Pendiente de confirmación";

    reserva.fechaRestauracion =
        new Date().toISOString();

    /*
     * Se conserva la fecha de cancelación como
     * parte del historial de la solicitud.
     */

    guardarReservacionesActualizadas();

    mostrarNotificacion(
        "Reservación restaurada",
        `La solicitud ${codigo} volvió al estado pendiente con ${formatearCantidadVehiculos(
            cantidadSolicitada
        )}.`
    );
}

/* =========================================================
   DISPONIBILIDAD AL RESTAURAR
========================================================= */

function obtenerDisponibilidadAlRestaurar(
    reservaRestaurada
) {
    const cantidadTotal =
        obtenerCantidadTotalModelo(
            reservaRestaurada
        );

    const cantidadOcupada =
        calcularCantidadOcupadaAlRestaurar(
            reservaRestaurada
        );

    return {
        cantidadTotal,
        cantidadOcupada,

        cantidadDisponible:
            Math.max(
                0,
                cantidadTotal -
                cantidadOcupada
            )
    };
}

function calcularCantidadOcupadaAlRestaurar(
    reservaRestaurada
) {
    const identificador =
        obtenerIdentificadorVehiculoReserva(
            reservaRestaurada.vehiculo
        );

    return reservacionesUsuario.reduce(
        (
            cantidadOcupada,
            reservaExistente
        ) => {
            if (
                reservaExistente.codigo ===
                reservaRestaurada.codigo
            ) {
                return cantidadOcupada;
            }

            if (
                !esReservacionActivaParaInventario(
                    reservaExistente
                )
            ) {
                return cantidadOcupada;
            }

            const mismoVehiculo =
                obtenerIdentificadorVehiculoReserva(
                    reservaExistente.vehiculo
                ) === identificador;

            if (!mismoVehiculo) {
                return cantidadOcupada;
            }

            const fechasCruzadas =
                fechasReservasSeCruzan(
                    reservaRestaurada.fechaRecogida,
                    reservaRestaurada.fechaEntrega,
                    reservaExistente.fechaRecogida,
                    reservaExistente.fechaEntrega
                );

            if (!fechasCruzadas) {
                return cantidadOcupada;
            }

            return (
                cantidadOcupada +
                obtenerCantidadReservada(
                    reservaExistente
                )
            );
        },
        0
    );
}

function obtenerCantidadTotalModelo(
    reserva
) {
    const cantidadTotal = Number(
        reserva?.vehiculo?.cantidadTotal
    );

    /*
     * Compatibilidad con vehículos y reservaciones
     * creados antes de incorporar cantidadTotal.
     */
    if (
        !Number.isInteger(cantidadTotal) ||
        cantidadTotal < 1
    ) {
        return 1;
    }

    return cantidadTotal;
}

function esReservacionActivaParaInventario(
    reserva
) {
    const estado =
        obtenerEstadoNormalizado(
            reserva?.estado
        );

    return ![
        "cancelada",
        "finalizada",
        "rechazada"
    ].includes(estado);
}

function obtenerIdentificadorVehiculoReserva(
    vehiculo
) {
    if (!vehiculo) {
        return "";
    }

    if (
        vehiculo.id !== undefined &&
        vehiculo.id !== null
    ) {
        return String(vehiculo.id);
    }

    return normalizarReservaTexto(
        vehiculo.nombre || ""
    );
}

function fechasReservasSeCruzan(
    inicioNuevo,
    finNuevo,
    inicioExistente,
    finExistente
) {
    const nuevaFechaInicio =
        convertirFechaSimple(
            inicioNuevo
        );

    const nuevaFechaFin =
        convertirFechaSimple(
            finNuevo
        );

    const fechaExistenteInicio =
        convertirFechaSimple(
            inicioExistente
        );

    const fechaExistenteFin =
        convertirFechaSimple(
            finExistente
        );

    if (
        !nuevaFechaInicio ||
        !nuevaFechaFin ||
        !fechaExistenteInicio ||
        !fechaExistenteFin
    ) {
        return false;
    }

    /*
     * Una reservación nueva puede comenzar el
     * mismo día en que termina la anterior.
     */
    return (
        nuevaFechaInicio <
            fechaExistenteFin &&
        nuevaFechaFin >
            fechaExistenteInicio
    );
}

function convertirFechaSimple(fechaTexto) {
    if (!fechaTexto) {
        return null;
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (Number.isNaN(fecha.getTime())) {
        return null;
    }

    return fecha;
}

/* =========================================================
   GUARDAR CAMBIOS
========================================================= */

function guardarReservacionesActualizadas() {
    try {
        localStorage.setItem(
            "autorentcarReservaciones",
            JSON.stringify(
                reservacionesUsuario
            )
        );

        actualizarUltimaReservacionGuardada();

        actualizarEstadisticasReservaciones();
        aplicarFiltrosReservaciones();
    } catch (error) {
        console.error(
            "No fue posible guardar los cambios.",
            error
        );

        mostrarNotificacion(
            "Error al guardar",
            "No fue posible guardar los cambios en la reservación."
        );
    }
}

function actualizarUltimaReservacionGuardada() {
    const contenido = localStorage.getItem(
        "autorentcarUltimaReservacion"
    );

    if (!contenido) {
        return;
    }

    let ultimaReservacion = null;

    try {
        ultimaReservacion = JSON.parse(
            contenido
        );
    } catch (error) {
        localStorage.removeItem(
            "autorentcarUltimaReservacion"
        );

        console.error(
            "La última reservación guardada no pudo leerse.",
            error
        );

        return;
    }

    if (!ultimaReservacion?.codigo) {
        return;
    }

    const actualizada =
        reservacionesUsuario.find(
            (reserva) =>
                reserva.codigo ===
                ultimaReservacion.codigo
        );

    if (!actualizada) {
        return;
    }

    localStorage.setItem(
        "autorentcarUltimaReservacion",
        JSON.stringify(actualizada)
    );
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

    const modalCancelar =
        document.getElementById(
            "modal-cancelar-reserva"
        );

    const volver = document.getElementById(
        "no-cancelar-reserva"
    );

    const confirmar =
        document.getElementById(
            "confirmar-cancelar-reserva"
        );

    cerrarDetalle?.addEventListener(
        "click",
        () => {
            cerrarModalReserva(
                modalDetalle
            );
        }
    );

    volver?.addEventListener(
        "click",
        cerrarModalCancelacion
    );

    confirmar?.addEventListener(
        "click",
        confirmarCancelacionReservacion
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

    modalCancelar?.addEventListener(
        "click",
        (evento) => {
            if (
                evento.target ===
                modalCancelar
            ) {
                cerrarModalCancelacion();
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

            cerrarModalCancelacion();
        }
    );
}

function cerrarModalReserva(modal) {
    modal?.classList.remove("activo");
    actualizarBloqueoPagina();
}

function cerrarModalCancelacion() {
    const modal = document.getElementById(
        "modal-cancelar-reserva"
    );

    modal?.classList.remove("activo");

    codigoReservaCancelar = null;

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