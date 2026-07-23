/* =========================================================
   AUTORENTCAR - SISTEMA DE RESERVACIONES
========================================================= */

let vehiculoReserva = null;
let descuentoReserva = 0;
let reservacionEnProceso = false;

let cantidadVehiculosReserva = 1;
let cantidadDisponibleReserva = 0;

document.addEventListener("DOMContentLoaded", () => {
    cargarVehiculoReserva();
    cargarBusquedaReserva();
    configurarFechasReserva();
    configurarCantidadVehiculos();
    configurarCalculoReserva();
    configurarCodigoPromocional();
    configurarEnvioReservacion();

    actualizarDisponibilidadReserva();
    actualizarResumenReserva();
});

/* =========================================================
   CARGAR VEHÍCULO SELECCIONADO
========================================================= */

function cargarVehiculoReserva() {
    const guardado = localStorage.getItem(
        "autorentcarVehiculoSeleccionado"
    );

    if (!guardado) {
        vehiculoReserva = null;
        cantidadDisponibleReserva = 0;

        actualizarDisponibilidadReserva();
        actualizarResumenReserva();

        return;
    }

    try {
        vehiculoReserva = JSON.parse(guardado);
    } catch (error) {
        vehiculoReserva = null;

        localStorage.removeItem(
            "autorentcarVehiculoSeleccionado"
        );

        console.error(
            "No se pudo cargar el vehículo seleccionado.",
            error
        );
    }

    const contenedor = document.getElementById(
        "vehiculo-reserva-seleccionado"
    );

    if (!contenedor || !vehiculoReserva) {
        actualizarDisponibilidadReserva();
        actualizarResumenReserva();

        return;
    }

    const cantidadTotal =
        obtenerCantidadTotalVehiculoReserva();

    contenedor.innerHTML = `
        <img
            src="${escaparReservaHTML(
                vehiculoReserva.imagen || ""
            )}"
            alt="${escaparReservaHTML(
                vehiculoReserva.nombre ||
                "Vehículo seleccionado"
            )}"
            class="vehiculo-reserva-imagen"
        >

        <div class="vehiculo-reserva-datos">

            <span class="subtitulo">
                ${escaparReservaHTML(
                    vehiculoReserva.categoriaTexto ||
                    vehiculoReserva.categoria ||
                    "Sin categoría"
                )}
            </span>

            <h3>
                ${escaparReservaHTML(
                    vehiculoReserva.nombre ||
                    "Vehículo"
                )}
            </h3>

            <p>
                ${escaparReservaHTML(
                    vehiculoReserva.transmision ||
                    "Sin información"
                )}
                ·
                ${Number(
                    vehiculoReserva.pasajeros || 0
                )} pasajeros
                ·
                ${escaparReservaHTML(
                    vehiculoReserva.combustible ||
                    "Sin información"
                )}
            </p>

            <p class="unidades-flota-reserva">
                <i class="fa-solid fa-car-side"></i>

                ${formatearCantidadVehiculos(
                    cantidadTotal
                )} en la flota
            </p>

            <div class="vehiculo-precio">

                <strong>
                    ${formatearMonedaReserva(
                        vehiculoReserva.precio
                    )}
                </strong>

                <span>por vehículo y día</span>

            </div>

        </div>
    `;

    actualizarDisponibilidadReserva();
    actualizarResumenReserva();
}

/* =========================================================
   CARGAR BÚSQUEDA ANTERIOR
========================================================= */

function cargarBusquedaReserva() {
    const guardada = localStorage.getItem(
        "autorentcarBusqueda"
    );

    if (!guardada) {
        return;
    }

    try {
        const busqueda = JSON.parse(guardada);

        asignarValor(
            "reserva-ubicacion",
            busqueda?.lugar
        );

        asignarValor(
            "reserva-entrega-lugar",
            busqueda?.lugar
        );

        asignarValor(
            "reserva-fecha-recogida",
            busqueda?.fechaRecogida
        );

        asignarValor(
            "reserva-fecha-entrega",
            busqueda?.fechaEntrega
        );
    } catch (error) {
        localStorage.removeItem(
            "autorentcarBusqueda"
        );

        console.error(
            "No se pudo cargar la búsqueda anterior.",
            error
        );
    }
}

function asignarValor(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento && valor) {
        elemento.value = valor;
    }
}

/* =========================================================
   FECHAS
========================================================= */

function configurarFechasReserva() {
    const recogida = document.getElementById(
        "reserva-fecha-recogida"
    );

    const entrega = document.getElementById(
        "reserva-fecha-entrega"
    );

    if (!recogida || !entrega) {
        return;
    }

    const hoy = obtenerFechaReserva();
    const manana = sumarDiasReserva(hoy, 1);

    recogida.min = hoy;
    entrega.min = manana;

    if (!recogida.value || recogida.value < hoy) {
        recogida.value = hoy;
    }

    const fechaMinimaEntrega = sumarDiasReserva(
        recogida.value,
        1
    );

    entrega.min = fechaMinimaEntrega;

    if (
        !entrega.value ||
        entrega.value <= recogida.value
    ) {
        entrega.value = fechaMinimaEntrega;
    }

    recogida.addEventListener("change", () => {
        if (!recogida.value) {
            actualizarDisponibilidadReserva();
            actualizarResumenReserva();

            return;
        }

        const siguiente = sumarDiasReserva(
            recogida.value,
            1
        );

        entrega.min = siguiente;

        if (
            !entrega.value ||
            entrega.value <= recogida.value
        ) {
            entrega.value = siguiente;
        }

        actualizarDisponibilidadReserva();
        actualizarResumenReserva();
    });

    entrega.addEventListener("change", () => {
        actualizarDisponibilidadReserva();
        actualizarResumenReserva();
    });

    actualizarDisponibilidadReserva();
    actualizarResumenReserva();
}

function obtenerFechaReserva() {
    const fecha = new Date();

    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(
            2,
            "0"
        ),
        String(fecha.getDate()).padStart(
            2,
            "0"
        )
    ].join("-");
}

function sumarDiasReserva(fechaTexto, dias) {
    if (!fechaTexto) {
        return "";
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

    fecha.setDate(fecha.getDate() + dias);

    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(
            2,
            "0"
        ),
        String(fecha.getDate()).padStart(
            2,
            "0"
        )
    ].join("-");
}

/* =========================================================
   CANTIDAD DE VEHÍCULOS
========================================================= */

function configurarCantidadVehiculos() {
    const campoCantidad = document.getElementById(
        "reserva-cantidad-vehiculos"
    );

    const botonDisminuir = document.getElementById(
        "disminuir-cantidad-vehiculos"
    );

    const botonAumentar = document.getElementById(
        "aumentar-cantidad-vehiculos"
    );

    if (!campoCantidad) {
        return;
    }

    cantidadVehiculosReserva = 1;
    campoCantidad.value = "1";

    botonDisminuir?.addEventListener("click", () => {
        establecerCantidadVehiculos(
            cantidadVehiculosReserva - 1
        );
    });

    botonAumentar?.addEventListener("click", () => {
        establecerCantidadVehiculos(
            cantidadVehiculosReserva + 1
        );
    });

    campoCantidad.addEventListener("input", () => {
        const cantidadIntroducida = Number(
            campoCantidad.value
        );

        if (!Number.isInteger(cantidadIntroducida)) {
            return;
        }

        cantidadVehiculosReserva =
            cantidadIntroducida;

        actualizarControlesCantidad();
        actualizarResumenReserva();
    });

    campoCantidad.addEventListener("change", () => {
        establecerCantidadVehiculos(
            Number(campoCantidad.value)
        );

        validarCampoReserva(campoCantidad);
    });

    actualizarControlesCantidad();
}

function establecerCantidadVehiculos(cantidad) {
    const campoCantidad = document.getElementById(
        "reserva-cantidad-vehiculos"
    );

    if (!campoCantidad) {
        return;
    }

    const limiteSuperior = Math.max(
        1,
        cantidadDisponibleReserva
    );

    let cantidadCorregida = Number(cantidad);

    if (!Number.isInteger(cantidadCorregida)) {
        cantidadCorregida = 1;
    }

    cantidadCorregida = Math.max(
        1,
        Math.min(
            cantidadCorregida,
            limiteSuperior
        )
    );

    cantidadVehiculosReserva =
        cantidadCorregida;

    campoCantidad.value = String(
        cantidadVehiculosReserva
    );

    actualizarControlesCantidad();
    actualizarResumenReserva();
    validarCampoReserva(campoCantidad);
}

function obtenerCantidadVehiculosSeleccionada() {
    const campoCantidad = document.getElementById(
        "reserva-cantidad-vehiculos"
    );

    const cantidad = Number(
        campoCantidad?.value ||
        cantidadVehiculosReserva ||
        1
    );

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {
        return 1;
    }

    return cantidad;
}

function actualizarControlesCantidad() {
    const campoCantidad = document.getElementById(
        "reserva-cantidad-vehiculos"
    );

    const botonDisminuir = document.getElementById(
        "disminuir-cantidad-vehiculos"
    );

    const botonAumentar = document.getElementById(
        "aumentar-cantidad-vehiculos"
    );

    if (!campoCantidad) {
        return;
    }

    const limiteMaximo = Math.max(
        1,
        cantidadDisponibleReserva
    );

    campoCantidad.min = "1";
    campoCantidad.max = String(limiteMaximo);

    botonDisminuir?.toggleAttribute(
        "disabled",
        cantidadVehiculosReserva <= 1
    );

    botonAumentar?.toggleAttribute(
        "disabled",
        cantidadDisponibleReserva < 1 ||
        cantidadVehiculosReserva >=
            cantidadDisponibleReserva
    );

    campoCantidad.disabled =
        !vehiculoReserva ||
        cantidadDisponibleReserva < 1;
}

/* =========================================================
   DISPONIBILIDAD POR CANTIDAD
========================================================= */

function actualizarDisponibilidadReserva() {
    cantidadDisponibleReserva =
        calcularCantidadDisponibleReserva();

    const cantidadSeleccionada =
        obtenerCantidadVehiculosSeleccionada();

    if (
        cantidadDisponibleReserva > 0 &&
        cantidadSeleccionada >
            cantidadDisponibleReserva
    ) {
        cantidadVehiculosReserva =
            cantidadDisponibleReserva;

        const campoCantidad =
            document.getElementById(
                "reserva-cantidad-vehiculos"
            );

        if (campoCantidad) {
            campoCantidad.value = String(
                cantidadVehiculosReserva
            );
        }
    }

    if (cantidadDisponibleReserva < 1) {
        cantidadVehiculosReserva = 1;

        const campoCantidad =
            document.getElementById(
                "reserva-cantidad-vehiculos"
            );

        if (campoCantidad) {
            campoCantidad.value = "1";
        }
    }

    mostrarEstadoDisponibilidadReserva();
    actualizarControlesCantidad();
    actualizarResumenReserva();
}

function calcularCantidadDisponibleReserva() {
    if (!vehiculoReserva) {
        return 0;
    }

    const cantidadTotal =
        obtenerCantidadTotalVehiculoReserva();

    const fechaRecogida = obtenerValorCampo(
        "reserva-fecha-recogida"
    );

    const fechaEntrega = obtenerValorCampo(
        "reserva-fecha-entrega"
    );

    if (
        !fechaRecogida ||
        !fechaEntrega ||
        fechaEntrega <= fechaRecogida
    ) {
        return cantidadTotal;
    }

    const cantidadOcupada =
        calcularCantidadOcupadaReserva(
            fechaRecogida,
            fechaEntrega
        );

    return Math.max(
        0,
        cantidadTotal - cantidadOcupada
    );
}

function calcularCantidadOcupadaReserva(
    fechaRecogida,
    fechaEntrega
) {
    const reservaciones =
        obtenerReservacionesGuardadas();

    return reservaciones.reduce(
        (totalOcupado, reservacion) => {
            if (
                !esReservacionActiva(
                    reservacion
                )
            ) {
                return totalOcupado;
            }

            const mismoVehiculo =
                obtenerIdentificadorVehiculo(
                    reservacion.vehiculo
                ) ===
                obtenerIdentificadorVehiculo(
                    vehiculoReserva
                );

            if (!mismoVehiculo) {
                return totalOcupado;
            }

            const seCruzan =
                fechasReservacionSeCruzan(
                    fechaRecogida,
                    fechaEntrega,
                    reservacion.fechaRecogida,
                    reservacion.fechaEntrega
                );

            if (!seCruzan) {
                return totalOcupado;
            }

            const cantidadReservada =
                obtenerCantidadReservadaExistente(
                    reservacion
                );

            return (
                totalOcupado +
                cantidadReservada
            );
        },
        0
    );
}

function obtenerCantidadReservadaExistente(
    reservacion
) {
    const cantidad = Number(
        reservacion?.cantidadVehiculos
    );

    /*
     * Las reservaciones creadas antes de esta
     * actualización cuentan como una unidad.
     */
    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {
        return 1;
    }

    return cantidad;
}

function esReservacionActiva(reservacion) {
    const estado = normalizarEstadoReserva(
        reservacion?.estado
    );

    const estadosInactivos = [
        "cancelada",
        "cancelado",
        "finalizada",
        "finalizado",
        "completada",
        "completado",
        "rechazada",
        "rechazado"
    ];

    return !estadosInactivos.includes(
        estado
    );
}

function mostrarEstadoDisponibilidadReserva() {
    const contenedor = document.getElementById(
        "estado-disponibilidad-reserva"
    );

    const titulo = document.getElementById(
        "disponibilidad-unidades-reserva"
    );

    const mensaje = document.getElementById(
        "mensaje-disponibilidad-reserva"
    );

    if (!contenedor || !titulo || !mensaje) {
        return;
    }

    contenedor.classList.remove(
        "disponible",
        "agotado"
    );

    const icono = contenedor.querySelector("i");

    if (!vehiculoReserva) {
        titulo.textContent =
            "Selecciona un vehículo para continuar.";

        mensaje.textContent =
            "Regresa al catálogo y elige el modelo de tu preferencia.";

        cambiarIconoDisponibilidad(
            icono,
            "fa-circle-info"
        );

        return;
    }

    const fechaRecogida = obtenerValorCampo(
        "reserva-fecha-recogida"
    );

    const fechaEntrega = obtenerValorCampo(
        "reserva-fecha-entrega"
    );

    if (
        !fechaRecogida ||
        !fechaEntrega ||
        fechaEntrega <= fechaRecogida
    ) {
        const cantidadTotal =
            obtenerCantidadTotalVehiculoReserva();

        titulo.textContent =
            `${formatearCantidadVehiculos(
                cantidadTotal
            )} en la flota`;

        mensaje.textContent =
            "Selecciona fechas válidas para comprobar la disponibilidad exacta.";

        cambiarIconoDisponibilidad(
            icono,
            "fa-circle-info"
        );

        return;
    }

    if (cantidadDisponibleReserva < 1) {
        contenedor.classList.add(
            "agotado"
        );

        titulo.textContent =
            "No hay unidades disponibles para estas fechas.";

        mensaje.textContent =
            "Selecciona otro periodo o elige otro modelo del catálogo.";

        cambiarIconoDisponibilidad(
            icono,
            "fa-circle-xmark"
        );

        return;
    }

    contenedor.classList.add(
        "disponible"
    );

    titulo.textContent =
        `${formatearCantidadVehiculos(
            cantidadDisponibleReserva
        )} disponibles`;

    mensaje.textContent =
        cantidadDisponibleReserva === 1
            ? "Puedes solicitar la única unidad disponible para este periodo."
            : `Puedes solicitar entre 1 y ${cantidadDisponibleReserva} vehículos para este periodo.`;

    cambiarIconoDisponibilidad(
        icono,
        "fa-circle-check"
    );
}

function cambiarIconoDisponibilidad(
    icono,
    claseNueva
) {
    if (!icono) {
        return;
    }

    icono.className =
        `fa-solid ${claseNueva}`;
}

function obtenerCantidadTotalVehiculoReserva() {
    const cantidad = Number(
        vehiculoReserva?.cantidadTotal
    );

    /*
     * Compatibilidad con vehículos guardados
     * antes de incorporar cantidadTotal.
     */
    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {
        return 1;
    }

    return cantidad;
}

/* =========================================================
   CÁLCULO DEL ALQUILER
========================================================= */

function configurarCalculoReserva() {
    const adicionales = document.querySelectorAll(
        ".opcion-adicional input"
    );

    adicionales.forEach((opcion) => {
        opcion.addEventListener(
            "change",
            actualizarResumenReserva
        );
    });
}

function calcularDiasReserva() {
    const recogida = document.getElementById(
        "reserva-fecha-recogida"
    )?.value;

    const entrega = document.getElementById(
        "reserva-fecha-entrega"
    )?.value;

    if (
        !recogida ||
        !entrega ||
        entrega <= recogida
    ) {
        return 0;
    }

    const inicio = new Date(
        `${recogida}T00:00:00`
    );

    const final = new Date(
        `${entrega}T00:00:00`
    );

    if (
        Number.isNaN(inicio.getTime()) ||
        Number.isNaN(final.getTime())
    ) {
        return 0;
    }

    return Math.ceil(
        (final - inicio) /
        (1000 * 60 * 60 * 24)
    );
}

function actualizarResumenReserva() {
    const dias = calcularDiasReserva();

    const cantidadVehiculos =
        obtenerCantidadVehiculosSeleccionada();

    const precioDiario = Number(
        vehiculoReserva?.precio || 0
    );

    const subtotal =
        precioDiario *
        dias *
        cantidadVehiculos;

    let adicionales = 0;

    document
        .querySelectorAll(
            ".opcion-adicional input:checked"
        )
        .forEach((opcion) => {
            const precioAdicional = Number(
                opcion.dataset.precio || 0
            );

            /*
             * En esta versión los servicios
             * adicionales se cobran por vehículo
             * y por día.
             */
            adicionales +=
                precioAdicional *
                dias *
                cantidadVehiculos;
        });

    /*
     * AUTO15 se aplica únicamente sobre
     * el costo de los vehículos.
     */
    const descuento =
        subtotal * descuentoReserva;

    const total =
        subtotal +
        adicionales -
        descuento;

    colocarTexto(
        "resumen-precio-diario",
        formatearMonedaReserva(
            precioDiario
        )
    );

    colocarTexto(
        "resumen-cantidad-dias",
        dias
    );

    colocarTexto(
        "resumen-cantidad-vehiculos",
        cantidadVehiculos
    );

    colocarTexto(
        "resumen-subtotal",
        formatearMonedaReserva(
            subtotal
        )
    );

    colocarTexto(
        "resumen-adicionales",
        formatearMonedaReserva(
            adicionales
        )
    );

    colocarTexto(
        "resumen-descuento",
        `-${formatearMonedaReserva(
            descuento
        )}`
    );

    colocarTexto(
        "resumen-total",
        formatearMonedaReserva(
            Math.max(0, total)
        )
    );
}

function colocarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}

/* =========================================================
   CÓDIGO PROMOCIONAL
========================================================= */

function configurarCodigoPromocional() {
    const boton = document.getElementById(
        "aplicar-codigo"
    );

    const campo = document.getElementById(
        "codigo-promocional"
    );

    const mensaje = document.getElementById(
        "mensaje-codigo"
    );

    if (!boton || !campo || !mensaje) {
        return;
    }

    boton.addEventListener("click", () => {
        const codigo = campo.value
            .trim()
            .toUpperCase();

        if (!codigo) {
            descuentoReserva = 0;

            mensaje.textContent =
                "Escribe un código promocional.";

            mensaje.style.color = "#ef4444";

            actualizarResumenReserva();

            return;
        }

        if (codigo === "AUTO15") {
            descuentoReserva = 0.15;
            campo.value = "AUTO15";

            mensaje.textContent =
                "Código aplicado: 15 % de descuento sobre el costo de los vehículos. No aplica a los servicios adicionales.";

            mensaje.style.color = "#16a36a";

            mostrarNotificacion(
                "Descuento aplicado",
                "Se aplicó un 15 % sobre el costo de los vehículos. Los servicios adicionales no están incluidos."
            );
        } else {
            descuentoReserva = 0;

            mensaje.textContent =
                "El código introducido no es válido.";

            mensaje.style.color = "#ef4444";

            mostrarNotificacion(
                "Código no válido",
                "Revisa el código promocional e inténtalo nuevamente."
            );
        }

        actualizarResumenReserva();
    });

    campo.addEventListener("input", () => {
        if (
            campo.value
                .trim()
                .toUpperCase() !== "AUTO15" &&
            descuentoReserva > 0
        ) {
            descuentoReserva = 0;
            mensaje.textContent = "";

            actualizarResumenReserva();
        }
    });
}

/* =========================================================
   VALIDACIÓN Y REGISTRO
========================================================= */

function configurarEnvioReservacion() {
    const formulario = document.getElementById(
        "formulario-reservacion"
    );

    if (!formulario) {
        return;
    }

    const campos = formulario.querySelectorAll(
        "input[required], select[required]"
    );

    campos.forEach((campo) => {
        campo.addEventListener("blur", () => {
            validarCampoReserva(campo);
        });

        campo.addEventListener("input", () => {
            const contenedor = campo.closest(
                ".campo-reserva"
            );

            if (
                contenedor?.classList.contains(
                    "error"
                )
            ) {
                validarCampoReserva(campo);
            }
        });

        campo.addEventListener("change", () => {
            const contenedor = campo.closest(
                ".campo-reserva"
            );

            if (
                contenedor?.classList.contains(
                    "error"
                )
            ) {
                validarCampoReserva(campo);
            }
        });
    });

    formulario.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            if (reservacionEnProceso) {
                return;
            }

            if (!vehiculoReserva) {
                mostrarNotificacion(
                    "Vehículo requerido",
                    "Selecciona un vehículo antes de continuar."
                );

                return;
            }

            actualizarDisponibilidadReserva();

            let formularioValido = true;

            campos.forEach((campo) => {
                if (
                    !validarCampoReserva(campo)
                ) {
                    formularioValido = false;
                }
            });

            if (!formularioValido) {
                mostrarNotificacion(
                    "Datos incompletos",
                    "Revisa los campos señalados antes de continuar."
                );

                enfocarPrimerCampoConError(
                    formulario
                );

                return;
            }

            const dias = calcularDiasReserva();

            if (dias < 1) {
                mostrarNotificacion(
                    "Fechas incorrectas",
                    "La fecha de entrega debe ser posterior a la fecha de recogida."
                );

                return;
            }

            const cantidadSolicitada =
                obtenerCantidadVehiculosSeleccionada();

            if (
                cantidadDisponibleReserva < 1
            ) {
                mostrarNotificacion(
                    "Sin disponibilidad",
                    "No quedan unidades disponibles para las fechas seleccionadas."
                );

                return;
            }

            if (
                cantidadSolicitada >
                cantidadDisponibleReserva
            ) {
                mostrarNotificacion(
                    "Cantidad no disponible",
                    `Solo quedan ${formatearCantidadVehiculos(
                        cantidadDisponibleReserva
                    )} disponibles para esas fechas.`
                );

                actualizarControlesCantidad();

                return;
            }

            const aceptar =
                document.getElementById(
                    "aceptar-reserva"
                );

            if (!aceptar?.checked) {
                mostrarNotificacion(
                    "Aceptación necesaria",
                    "Debes aceptar los términos y condiciones."
                );

                return;
            }

            const reservacion =
                construirReservacion();

            if (!reservacion) {
                mostrarNotificacion(
                    "No se pudo registrar",
                    "Ocurrió un problema al preparar la reservación."
                );

                return;
            }

            /*
             * Se comprueba nuevamente justo antes
             * de guardar para evitar inconsistencias.
             */
            const disponibilidadFinal =
                calcularCantidadDisponibleReserva();

            if (
                reservacion.cantidadVehiculos >
                disponibilidadFinal
            ) {
                mostrarNotificacion(
                    "Disponibilidad actualizada",
                    `La disponibilidad cambió. Ahora solo quedan ${formatearCantidadVehiculos(
                        disponibilidadFinal
                    )}.`
                );

                actualizarDisponibilidadReserva();

                return;
            }

            reservacionEnProceso = true;

            const botonConfirmar =
                formulario.querySelector(
                    ".boton-confirmar-reserva"
                );

            if (botonConfirmar) {
                botonConfirmar.disabled = true;

                botonConfirmar.innerHTML = `
                    Registrando reservación
                    <i class="fa-solid fa-spinner fa-spin"></i>
                `;
            }

            try {
                const guardadas =
                    obtenerReservacionesGuardadas();

                guardadas.push(reservacion);

                localStorage.setItem(
                    "autorentcarReservaciones",
                    JSON.stringify(guardadas)
                );

                localStorage.setItem(
                    "autorentcarUltimaReservacion",
                    JSON.stringify(reservacion)
                );

                localStorage.removeItem(
                    "autorentcarVehiculoSeleccionado"
                );

                mostrarNotificacion(
                    "Reservación registrada",
                    `Tu solicitud ${reservacion.codigo} para ${formatearCantidadVehiculos(
                        reservacion.cantidadVehiculos
                    )} fue registrada correctamente.`
                );

                setTimeout(() => {
                    window.location.href =
                        "confirmacion.html";
                }, 1200);
            } catch (error) {
                reservacionEnProceso = false;

                if (botonConfirmar) {
                    botonConfirmar.disabled =
                        false;

                    botonConfirmar.innerHTML = `
                        Confirmar reservación
                        <i class="fa-solid fa-arrow-right"></i>
                    `;
                }

                console.error(
                    "No fue posible guardar la reservación.",
                    error
                );

                mostrarNotificacion(
                    "Error al registrar",
                    "No fue posible guardar la reservación. Inténtalo nuevamente."
                );
            }
        }
    );
}

/* =========================================================
   OBTENER RESERVACIONES GUARDADAS
========================================================= */

function obtenerReservacionesGuardadas() {
    const contenido = localStorage.getItem(
        "autorentcarReservaciones"
    );

    if (!contenido) {
        return [];
    }

    try {
        const reservaciones = JSON.parse(
            contenido
        );

        return Array.isArray(reservaciones)
            ? reservaciones
            : [];
    } catch (error) {
        console.error(
            "Las reservaciones guardadas no pudieron leerse.",
            error
        );

        return [];
    }
}

function enfocarPrimerCampoConError(
    formulario
) {
    const primerCampo =
        formulario.querySelector(
            ".campo-reserva.error input, " +
            ".campo-reserva.error select"
        );

    if (primerCampo) {
        primerCampo.focus();

        primerCampo.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/* =========================================================
   VALIDAR CADA CAMPO
========================================================= */

function validarCampoReserva(campo) {
    const contenedor = campo.closest(
        ".campo-reserva"
    );

    const error = contenedor?.querySelector(
        ".error-reserva"
    );

    const valor = campo.value.trim();
    let mensaje = "";

    if (!valor) {
        mensaje =
            "Este campo es obligatorio.";
    }

    if (
        campo.id === "reserva-nombre" &&
        valor &&
        valor.length < 3
    ) {
        mensaje =
            "Escribe un nombre válido.";
    }

    if (
        campo.id === "reserva-documento" &&
        valor &&
        !validarDocumentoReserva(valor)
    ) {
        mensaje =
            "Escribe una cédula o pasaporte válido.";
    }

    if (
        campo.id === "reserva-correo" &&
        valor &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            valor
        )
    ) {
        mensaje =
            "Escribe un correo electrónico válido.";
    }

    if (
        campo.id === "reserva-telefono" &&
        valor &&
        !validarTelefonoReserva(valor)
    ) {
        mensaje =
            "Escribe un número de teléfono válido.";
    }

    if (
        campo.id === "reserva-edad" &&
        valor
    ) {
        const edad = Number(valor);

        if (
            !Number.isInteger(edad) ||
            edad < 18 ||
            edad > 85
        ) {
            mensaje =
                "La edad debe estar entre 18 y 85 años.";
        }
    }

    if (
        campo.id === "reserva-licencia" &&
        valor &&
        !validarLicenciaReserva(valor)
    ) {
        mensaje =
            "Escribe un número de licencia válido.";
    }

    if (
        campo.id ===
            "reserva-fecha-recogida" &&
        valor
    ) {
        const hoy = obtenerFechaReserva();

        if (valor < hoy) {
            mensaje =
                "La fecha de recogida no puede ser anterior a hoy.";
        }
    }

    if (
        campo.id ===
            "reserva-fecha-entrega" &&
        valor
    ) {
        const fechaRecogida =
            obtenerValorCampo(
                "reserva-fecha-recogida"
            );

        if (
            fechaRecogida &&
            valor <= fechaRecogida
        ) {
            mensaje =
                "La fecha de entrega debe ser posterior a la fecha de recogida.";
        }
    }

    if (
        campo.id ===
            "reserva-cantidad-vehiculos" &&
        valor
    ) {
        const cantidad = Number(valor);

        if (
            !Number.isInteger(cantidad) ||
            cantidad < 1
        ) {
            mensaje =
                "Selecciona al menos un vehículo.";
        } else if (
            cantidadDisponibleReserva < 1
        ) {
            mensaje =
                "No hay unidades disponibles para estas fechas.";
        } else if (
            cantidad >
            cantidadDisponibleReserva
        ) {
            mensaje =
                `Solo hay ${formatearCantidadVehiculos(
                    cantidadDisponibleReserva
                )} disponibles.`;
        }
    }

    if (mensaje) {
        contenedor?.classList.add("error");

        if (error) {
            error.textContent = mensaje;
        }

        return false;
    }

    contenedor?.classList.remove("error");

    if (error) {
        error.textContent = "";
    }

    return true;
}

/* =========================================================
   VALIDACIONES AUXILIARES
========================================================= */

function validarDocumentoReserva(valor) {
    const documento = valor
        .trim()
        .replace(/\s+/g, "");

    const cedulaDominicana =
        /^\d{3}-?\d{7}-?\d{1}$/.test(
            documento
        );

    const pasaporte =
        /^(?=.*[A-Za-z0-9])[A-Za-z0-9-]{6,20}$/.test(
            documento
        );

    return (
        cedulaDominicana ||
        pasaporte
    );
}

function validarLicenciaReserva(valor) {
    const licencia = valor
        .trim()
        .replace(/\s+/g, "");

    return /^[A-Za-z0-9-]{5,25}$/.test(
        licencia
    );
}

function validarTelefonoReserva(valor) {
    const formatoPermitido =
        /^[0-9+\-()\s]{8,20}$/.test(
            valor
        );

    const cantidadDigitos = valor
        .replace(/\D/g, "")
        .length;

    return (
        formatoPermitido &&
        cantidadDigitos >= 8 &&
        cantidadDigitos <= 15
    );
}

/* =========================================================
   CONSTRUIR OBJETO DE RESERVACIÓN
========================================================= */

function construirReservacion() {
    if (!vehiculoReserva) {
        return null;
    }

    const dias = calcularDiasReserva();

    const cantidadVehiculos =
        obtenerCantidadVehiculosSeleccionada();

    const precioDiario = Number(
        vehiculoReserva.precio || 0
    );

    const subtotal =
        precioDiario *
        dias *
        cantidadVehiculos;

    const adicionalesSeleccionados = [];

    let costoAdicionales = 0;

    document
        .querySelectorAll(
            ".opcion-adicional input:checked"
        )
        .forEach((opcion) => {
            const contenedor =
                opcion.closest(
                    ".opcion-adicional"
                );

            const nombre =
                contenedor
                    ?.querySelector("strong")
                    ?.textContent
                    ?.trim() ||
                "Servicio adicional";

            const precio = Number(
                opcion.dataset.precio || 0
            );

            const costoTotal =
                precio *
                dias *
                cantidadVehiculos;

            adicionalesSeleccionados.push({
                nombre,
                precioDiario: precio,
                aplicaPorVehiculo: true,
                cantidadVehiculos,
                costoTotal
            });

            costoAdicionales +=
                costoTotal;
        });

    const descuento =
        subtotal * descuentoReserva;

    const total =
        subtotal +
        costoAdicionales -
        descuento;

    const codigo =
        crearCodigoReservacion();

    return {
        codigo,

        fechaRegistro:
            new Date().toISOString(),

        estado:
            "Pendiente de confirmación",

        vehiculo: {
            ...vehiculoReserva
        },

        cantidadVehiculos,

        cantidadDisponibleAlReservar:
            cantidadDisponibleReserva,

        lugarRecogida:
            obtenerValorCampo(
                "reserva-ubicacion"
            ),

        lugarEntrega:
            obtenerValorCampo(
                "reserva-entrega-lugar"
            ),

        fechaRecogida:
            obtenerValorCampo(
                "reserva-fecha-recogida"
            ),

        fechaEntrega:
            obtenerValorCampo(
                "reserva-fecha-entrega"
            ),

        horaRecogida:
            obtenerValorCampo(
                "reserva-hora-recogida"
            ),

        horaEntrega:
            obtenerValorCampo(
                "reserva-hora-entrega"
            ),

        cliente: {
            nombre:
                obtenerValorCampo(
                    "reserva-nombre"
                ),

            documento:
                obtenerValorCampo(
                    "reserva-documento"
                ),

            correo:
                obtenerValorCampo(
                    "reserva-correo"
                ).toLowerCase(),

            telefono:
                obtenerValorCampo(
                    "reserva-telefono"
                ),

            edad: Number(
                obtenerValorCampo(
                    "reserva-edad"
                )
            ),

            licencia:
                obtenerValorCampo(
                    "reserva-licencia"
                )
        },

        comentarios:
            obtenerValorCampo(
                "reserva-comentarios"
            ),

        adicionales:
            adicionalesSeleccionados,

        codigoPromocional:
            descuentoReserva > 0
                ? "AUTO15"
                : null,

        porcentajeDescuento:
            descuentoReserva * 100,

        dias,
        precioDiario,
        subtotal,
        costoAdicionales,
        descuento,
        total
    };
}

function obtenerValorCampo(id) {
    const elemento =
        document.getElementById(id);

    return elemento?.value?.trim() || "";
}

function crearCodigoReservacion() {
    const fecha = Date.now()
        .toString()
        .slice(-8);

    const aleatorio = Math.floor(
        100 +
        Math.random() * 900
    );

    return `AR-${fecha}-${aleatorio}`;
}

/* =========================================================
   IDENTIFICACIÓN Y CRUCE DE FECHAS
========================================================= */

function obtenerIdentificadorVehiculo(
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

    return String(
        vehiculo.nombre || ""
    )
        .toLowerCase()
        .trim();
}

function fechasReservacionSeCruzan(
    inicioNuevo,
    finNuevo,
    inicioExistente,
    finExistente
) {
    const nuevaFechaInicio = new Date(
        `${inicioNuevo}T00:00:00`
    );

    const nuevaFechaFin = new Date(
        `${finNuevo}T00:00:00`
    );

    const fechaExistenteInicio = new Date(
        `${inicioExistente}T00:00:00`
    );

    const fechaExistenteFin = new Date(
        `${finExistente}T00:00:00`
    );

    if (
        Number.isNaN(
            nuevaFechaInicio.getTime()
        ) ||
        Number.isNaN(
            nuevaFechaFin.getTime()
        ) ||
        Number.isNaN(
            fechaExistenteInicio.getTime()
        ) ||
        Number.isNaN(
            fechaExistenteFin.getTime()
        )
    ) {
        return false;
    }

    /*
     * Se permite iniciar una reservación el mismo
     * día en que termina la reservación anterior.
     */
    return (
        nuevaFechaInicio <
            fechaExistenteFin &&
        nuevaFechaFin >
            fechaExistenteInicio
    );
}

function normalizarEstadoReserva(estado) {
    return String(estado || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();
}

/* =========================================================
   FUNCIONES DE FORMATO Y SEGURIDAD
========================================================= */

function formatearCantidadVehiculos(
    cantidad
) {
    const total = Number(cantidad) || 0;

    if (total === 1) {
        return "1 unidad";
    }

    return `${total} unidades`;
}

function formatearMonedaReserva(valor) {
    const numero = Number(valor);

    const cantidad =
        Number.isFinite(numero)
            ? numero
            : 0;

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(cantidad);
}

function escaparReservaHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto ?? "");

    return elemento.innerHTML;
}