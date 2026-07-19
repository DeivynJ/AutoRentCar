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
    try {
        reservacionesUsuario = JSON.parse(
            localStorage.getItem("autorentcarReservaciones")
        ) || [];
    } catch (error) {
        reservacionesUsuario = [];
        console.error("No fue posible cargar las reservaciones.", error);
    }

    actualizarEstadisticasReservaciones();
    aplicarFiltrosReservaciones();
}

/* =========================================================
   FILTROS
========================================================= */

function configurarFiltrosReservaciones() {
    const buscar = document.getElementById("buscar-reservacion");
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
        document.getElementById("buscar-reservacion")?.value || ""
    );

    const estado = document.getElementById(
        "filtrar-estado-reserva"
    )?.value || "todos";

    const orden = document.getElementById(
        "ordenar-reservaciones"
    )?.value || "recientes";

    let resultados = reservacionesUsuario.filter((reserva) => {
        const contenido = normalizarReservaTexto(
            [
                reserva.codigo,
                reserva.cliente?.nombre,
                reserva.vehiculo?.nombre,
                reserva.lugarRecogida,
                reserva.estado
            ].join(" ")
        );

        const coincideTexto = contenido.includes(texto);
        const estadoNormalizado = obtenerEstadoNormalizado(
            reserva.estado
        );

        const coincideEstado =
            estado === "todos" ||
            estadoNormalizado === estado;

        return coincideTexto && coincideEstado;
    });

    resultados = ordenarReservaciones(resultados, orden);

    mostrarReservaciones(resultados);
}

function ordenarReservaciones(lista, tipo) {
    const copia = [...lista];

    switch (tipo) {
        case "antiguas":
            return copia.sort(
                (a, b) =>
                    new Date(a.fechaRegistro) -
                    new Date(b.fechaRegistro)
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
                    new Date(b.fechaRegistro) -
                    new Date(a.fechaRegistro)
            );
    }
}

/* =========================================================
   MOSTRAR TARJETAS
========================================================= */

function mostrarReservaciones(lista) {
    const contenedor = document.getElementById(
        "lista-reservaciones"
    );

    const sinReservaciones = document.getElementById(
        "sin-reservaciones"
    );

    if (!contenedor) {
        return;
    }

    if (!lista.length) {
        contenedor.innerHTML = "";
        sinReservaciones?.classList.add("visible");
        return;
    }

    sinReservaciones?.classList.remove("visible");

    contenedor.innerHTML = lista
        .map(crearTarjetaReservacion)
        .join("");
}

function crearTarjetaReservacion(reserva) {
    const estado = obtenerEstadoNormalizado(reserva.estado);
    const estaCancelada = estado === "cancelada";

    return `
        <article class="tarjeta-reservacion">

            <div class="tarjeta-reservacion-imagen">

                <img
                    src="${escaparReservaHTML(
                        reserva.vehiculo?.imagen || ""
                    )}"
                    alt="${escaparReservaHTML(
                        reserva.vehiculo?.nombre || "Vehículo"
                    )}"
                    loading="lazy"
                >

                <span class="estado-reservacion ${estado}">
                    ${escaparReservaHTML(
                        reserva.estado || "Pendiente"
                    )}
                </span>

            </div>

            <div class="tarjeta-reservacion-contenido">

                <div class="reservacion-codigo-fecha">

                    <strong>
                        ${escaparReservaHTML(reserva.codigo)}
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
                        reserva.vehiculo?.nombre || "Vehículo"
                    )}
                </h2>

                <p class="nombre-cliente-reserva">
                    Reservado por
                    ${escaparReservaHTML(
                        reserva.cliente?.nombre || "Cliente"
                    )}
                </p>

                <div class="detalles-rapidos-reserva">

                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${escaparReservaHTML(
                            reserva.lugarRecogida || ""
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
                        ${Number(reserva.dias || 0)} día(s)
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
                    onclick="verDetalleReservacion('${reserva.codigo}')"
                >
                    Ver detalles
                </button>

                ${
                    estaCancelada
                        ? `
                            <button
                                type="button"
                                class="boton-restaurar-reserva"
                                onclick="restaurarReservacion('${reserva.codigo}')"
                            >
                                Restaurar solicitud
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="boton-cancelar-reserva"
                                onclick="solicitarCancelarReservacion('${reserva.codigo}')"
                            >
                                Cancelar
                            </button>
                        `
                }

            </div>

        </article>
    `;
}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticasReservaciones() {
    const pendientes = reservacionesUsuario.filter(
        (reserva) =>
            obtenerEstadoNormalizado(reserva.estado) === "pendiente"
    ).length;

    const confirmadas = reservacionesUsuario.filter(
        (reserva) =>
            obtenerEstadoNormalizado(reserva.estado) === "confirmada"
    ).length;

    const canceladas = reservacionesUsuario.filter(
        (reserva) =>
            obtenerEstadoNormalizado(reserva.estado) === "cancelada"
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
    const reserva = reservacionesUsuario.find(
        (elemento) => elemento.codigo === codigo
    );

    const modal = document.getElementById(
        "modal-detalle-reserva"
    );

    const contenido = document.getElementById(
        "contenido-detalle-reserva"
    );

    if (!reserva || !modal || !contenido) {
        return;
    }

    contenido.innerHTML = `
        <div class="detalle-reserva-encabezado">

            <span>Código de reservación</span>

            <h2>${escaparReservaHTML(reserva.codigo)}</h2>

            <p>
                Estado:
                <strong>
                    ${escaparReservaHTML(reserva.estado)}
                </strong>
            </p>

        </div>

        <div class="detalle-reserva-cuerpo">

            <div class="detalle-vehiculo-reserva">

                <img
                    src="${escaparReservaHTML(
                        reserva.vehiculo?.imagen || ""
                    )}"
                    alt="${escaparReservaHTML(
                        reserva.vehiculo?.nombre || "Vehículo"
                    )}"
                >

                <div>

                    <span class="subtitulo">
                        ${escaparReservaHTML(
                            reserva.vehiculo?.categoriaTexto || ""
                        )}
                    </span>

                    <h2>
                        ${escaparReservaHTML(
                            reserva.vehiculo?.nombre || ""
                        )}
                    </h2>

                    <p>
                        ${escaparReservaHTML(
                            reserva.vehiculo?.transmision || ""
                        )}
                        ·
                        ${Number(
                            reserva.vehiculo?.pasajeros || 0
                        )} pasajeros
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
                    "Teléfono",
                    reserva.cliente?.telefono
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
                    "Fecha de entrega",
                    formatearFechaSimpleReserva(
                        reserva.fechaEntrega
                    )
                )}

                ${crearDatoDetalle(
                    "Duración",
                    `${Number(reserva.dias || 0)} día(s)`
                )}

                ${crearDatoDetalle(
                    "Servicios adicionales",
                    reserva.adicionales?.length
                        ? reserva.adicionales
                            .map((item) => item.nombre)
                            .join(", ")
                        : "Ninguno"
                )}

            </div>

            <div class="total-detalle-reserva">

                <span>Total estimado</span>

                <strong>
                    ${formatearMonedaReserva(reserva.total)}
                </strong>

            </div>

        </div>
    `;

    modal.classList.add("activo");
    document.body.style.overflow = "hidden";
}

function crearDatoDetalle(titulo, valor) {
    return `
        <article>
            <span>${escaparReservaHTML(titulo)}</span>
            <strong>
                ${escaparReservaHTML(
                    valor || "Sin información"
                )}
            </strong>
        </article>
    `;
}

/* =========================================================
   CANCELAR Y RESTAURAR
========================================================= */

function solicitarCancelarReservacion(codigo) {
    codigoReservaCancelar = codigo;

    const modal = document.getElementById(
        "modal-cancelar-reserva"
    );

    modal?.classList.add("activo");
    document.body.style.overflow = "hidden";
}

function confirmarCancelacionReservacion() {
    if (!codigoReservaCancelar) {
        return;
    }

    const indice = reservacionesUsuario.findIndex(
        (reserva) => reserva.codigo === codigoReservaCancelar
    );

    if (indice === -1) {
        return;
    }

    reservacionesUsuario[indice].estado = "Cancelada";

    guardarReservacionesActualizadas();
    cerrarModalCancelacion();

    mostrarNotificacion(
        "Reservación cancelada",
        `La solicitud ${codigoReservaCancelar} fue cancelada.`
    );

    codigoReservaCancelar = null;
}

function restaurarReservacion(codigo) {
    const indice = reservacionesUsuario.findIndex(
        (reserva) => reserva.codigo === codigo
    );

    if (indice === -1) {
        return;
    }

    reservacionesUsuario[indice].estado =
        "Pendiente de confirmación";

    guardarReservacionesActualizadas();

    mostrarNotificacion(
        "Reservación restaurada",
        `La solicitud ${codigo} volvió al estado pendiente.`
    );
}

function guardarReservacionesActualizadas() {
    localStorage.setItem(
        "autorentcarReservaciones",
        JSON.stringify(reservacionesUsuario)
    );

    const ultimaReservacion = JSON.parse(
        localStorage.getItem("autorentcarUltimaReservacion")
    );

    if (ultimaReservacion) {
        const actualizada = reservacionesUsuario.find(
            (reserva) =>
                reserva.codigo === ultimaReservacion.codigo
        );

        if (actualizada) {
            localStorage.setItem(
                "autorentcarUltimaReservacion",
                JSON.stringify(actualizada)
            );
        }
    }

    actualizarEstadisticasReservaciones();
    aplicarFiltrosReservaciones();
}

/* =========================================================
   MODALES
========================================================= */

function configurarModalesReservaciones() {
    const modalDetalle = document.getElementById(
        "modal-detalle-reserva"
    );

    const cerrarDetalle = document.getElementById(
        "cerrar-detalle-reserva"
    );

    const modalCancelar = document.getElementById(
        "modal-cancelar-reserva"
    );

    const volver = document.getElementById(
        "no-cancelar-reserva"
    );

    const confirmar = document.getElementById(
        "confirmar-cancelar-reserva"
    );

    cerrarDetalle?.addEventListener("click", () => {
        cerrarModalReserva(modalDetalle);
    });

    volver?.addEventListener("click", cerrarModalCancelacion);

    confirmar?.addEventListener(
        "click",
        confirmarCancelacionReservacion
    );

    modalDetalle?.addEventListener("click", (evento) => {
        if (evento.target === modalDetalle) {
            cerrarModalReserva(modalDetalle);
        }
    });

    modalCancelar?.addEventListener("click", (evento) => {
        if (evento.target === modalCancelar) {
            cerrarModalCancelacion();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Escape") {
            return;
        }

        cerrarModalReserva(modalDetalle);
        cerrarModalCancelacion();
    });
}

function cerrarModalReserva(modal) {
    modal?.classList.remove("activo");
    document.body.style.overflow = "";
}

function cerrarModalCancelacion() {
    const modal = document.getElementById(
        "modal-cancelar-reserva"
    );

    modal?.classList.remove("activo");
    document.body.style.overflow = "";
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function obtenerEstadoNormalizado(estado) {
    const valor = normalizarReservaTexto(estado || "");

    if (valor.includes("cancel")) {
        return "cancelada";
    }

    if (valor.includes("confirmada")) {
        return "confirmada";
    }

    return "pendiente";
}

function normalizarReservaTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function formatearMonedaReserva(valor) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(Number(valor) || 0);
}

function formatearFechaReservaListado(fechaTexto) {
    if (!fechaTexto) {
        return "Sin fecha";
    }

    return new Date(fechaTexto).toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatearFechaSimpleReserva(fechaTexto) {
    if (!fechaTexto) {
        return "Sin fecha";
    }

    const fecha = new Date(`${fechaTexto}T00:00:00`);

    return fecha.toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function colocarReservaTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

function escaparReservaHTML(texto) {
    const elemento = document.createElement("div");

    elemento.textContent = String(texto ?? "");

    return elemento.innerHTML;
}
