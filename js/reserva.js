/* =========================================================
   AUTORENTCAR - SISTEMA DE RESERVACIONES
========================================================= */

let vehiculoReserva = null;
let descuentoReserva = 0;
let reservacionEnProceso = false;

document.addEventListener("DOMContentLoaded", () => {
    cargarVehiculoReserva();
    cargarBusquedaReserva();
    configurarFechasReserva();
    configurarCalculoReserva();
    configurarCodigoPromocional();
    configurarEnvioReservacion();
});

/* =========================================================
   CARGAR VEHÍCULO SELECCIONADO
========================================================= */

function cargarVehiculoReserva() {
    const guardado = localStorage.getItem(
        "autorentcarVehiculoSeleccionado"
    );

    if (!guardado) {
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
        actualizarResumenReserva();
        return;
    }

    contenedor.innerHTML = `
        <img
            src="${vehiculoReserva.imagen}"
            alt="${vehiculoReserva.nombre}"
            class="vehiculo-reserva-imagen"
        >

        <div class="vehiculo-reserva-datos">

            <span class="subtitulo">
                ${vehiculoReserva.categoriaTexto}
            </span>

            <h3>${vehiculoReserva.nombre}</h3>

            <p>
                ${vehiculoReserva.transmision} ·
                ${vehiculoReserva.pasajeros} pasajeros ·
                ${vehiculoReserva.combustible}
            </p>

            <div class="vehiculo-precio">
                <strong>
                    US$${Number(
                        vehiculoReserva.precio
                    ).toFixed(2)}
                </strong>

                <span>por día</span>
            </div>

        </div>
    `;

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
            busqueda.lugar
        );

        asignarValor(
            "reserva-entrega-lugar",
            busqueda.lugar
        );

        asignarValor(
            "reserva-fecha-recogida",
            busqueda.fechaRecogida
        );

        asignarValor(
            "reserva-fecha-entrega",
            busqueda.fechaEntrega
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

        actualizarResumenReserva();
    });

    entrega.addEventListener(
        "change",
        actualizarResumenReserva
    );

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

    const precioDiario = Number(
        vehiculoReserva?.precio || 0
    );

    const subtotal = precioDiario * dias;

    let adicionales = 0;

    document
        .querySelectorAll(
            ".opcion-adicional input:checked"
        )
        .forEach((opcion) => {
            const precioAdicional = Number(
                opcion.dataset.precio || 0
            );

            adicionales +=
                precioAdicional * dias;
        });

    /*
     * El descuento AUTO15 se aplica únicamente
     * al costo del vehículo.
     */
    const descuento =
        subtotal * descuentoReserva;

    const total =
        subtotal +
        adicionales -
        descuento;

    colocarTexto(
        "resumen-precio-diario",
        `US$${precioDiario.toFixed(2)}`
    );

    colocarTexto(
        "resumen-cantidad-dias",
        dias
    );

    colocarTexto(
        "resumen-subtotal",
        `US$${subtotal.toFixed(2)}`
    );

    colocarTexto(
        "resumen-adicionales",
        `US$${adicionales.toFixed(2)}`
    );

    colocarTexto(
        "resumen-descuento",
        `-US$${descuento.toFixed(2)}`
    );

    colocarTexto(
        "resumen-total",
        `US$${Math.max(
            0,
            total
        ).toFixed(2)}`
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
                "Código aplicado: 15 % de descuento sobre el costo del vehículo. No aplica a los servicios adicionales.";

            mensaje.style.color = "#16a36a";

            mostrarNotificacion(
                "Descuento aplicado",
                "Se aplicó un 15 % sobre el costo del vehículo. Los servicios adicionales no están incluidos."
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

            const conflicto =
                verificarConflictoReservacion(
                    reservacion
                );

            if (conflicto) {
                mostrarNotificacion(
                    "Vehículo no disponible",
                    `Este vehículo ya tiene una reservación activa del ${formatearFechaConflicto(
                        conflicto.fechaRecogida
                    )} al ${formatearFechaConflicto(
                        conflicto.fechaEntrega
                    )}.`
                );

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

                /*
                 * Se elimina el vehículo temporal
                 * después de guardar correctamente.
                 */
                localStorage.removeItem(
                    "autorentcarVehiculoSeleccionado"
                );

                mostrarNotificacion(
                    "Reservación registrada",
                    `Tu solicitud ${reservacion.codigo} fue registrada correctamente.`
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
        const reservaciones =
            JSON.parse(contenido);

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

    /*
     * Acepta:
     * - Cédula dominicana con o sin guiones.
     * - Pasaporte alfanumérico de 6 a 20 caracteres.
     */
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

    const precioDiario = Number(
        vehiculoReserva.precio || 0
    );

    const subtotal =
        precioDiario * dias;

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

            adicionalesSeleccionados.push({
                nombre,
                precioDiario: precio
            });

            costoAdicionales +=
                precio * dias;
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
   DISPONIBILIDAD DEL VEHÍCULO
========================================================= */

function verificarConflictoReservacion(
    nuevaReservacion
) {
    const reservacionesGuardadas =
        obtenerReservacionesGuardadas();

    return reservacionesGuardadas.find(
        (reservacionExistente) => {
            const mismoVehiculo =
                obtenerIdentificadorVehiculo(
                    reservacionExistente.vehiculo
                ) ===
                obtenerIdentificadorVehiculo(
                    nuevaReservacion.vehiculo
                );

            if (!mismoVehiculo) {
                return false;
            }

            const estado =
                normalizarEstadoReserva(
                    reservacionExistente.estado
                );

            const reservacionActiva =
                estado !== "cancelada" &&
                estado !== "cancelado" &&
                estado !== "finalizada" &&
                estado !== "finalizado" &&
                estado !== "completada" &&
                estado !== "completado";

            if (!reservacionActiva) {
                return false;
            }

            return fechasReservacionSeCruzan(
                nuevaReservacion.fechaRecogida,
                nuevaReservacion.fechaEntrega,
                reservacionExistente.fechaRecogida,
                reservacionExistente.fechaEntrega
            );
        }
    );
}

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
     * Permite que una nueva reservación comience
     * el mismo día en que termina la reservación anterior.
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

function formatearFechaConflicto(
    fechaTexto
) {
    if (!fechaTexto) {
        return "una fecha no disponible";
    }

    const fecha = new Date(
        `${fechaTexto}T00:00:00`
    );

    if (
        Number.isNaN(fecha.getTime())
    ) {
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