/* =========================================================
   AUTORENTCAR - SISTEMA DE RESERVACIONES
========================================================= */

let vehiculoReserva = null;
let descuentoReserva = 0;

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
        console.error("No se pudo cargar el vehículo.", error);
    }

    const contenedor = document.getElementById(
        "vehiculo-reserva-seleccionado"
    );

    if (!contenedor || !vehiculoReserva) {
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
                <strong>US$${vehiculoReserva.precio}</strong>
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

        asignarValor("reserva-ubicacion", busqueda.lugar);
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
        console.error("No se pudo cargar la búsqueda.", error);
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

    if (!recogida.value) {
        recogida.value = hoy;
    }

    if (!entrega.value) {
        entrega.value = manana;
    }

    recogida.addEventListener("change", () => {
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
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0")
    ].join("-");
}

function sumarDiasReserva(fechaTexto, dias) {
    const fecha = new Date(`${fechaTexto}T00:00:00`);

    fecha.setDate(fecha.getDate() + dias);

    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0")
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

    if (!recogida || !entrega || entrega <= recogida) {
        return 0;
    }

    const inicio = new Date(`${recogida}T00:00:00`);
    const final = new Date(`${entrega}T00:00:00`);

    return Math.ceil(
        (final - inicio) / (1000 * 60 * 60 * 24)
    );
}

function actualizarResumenReserva() {
    const dias = calcularDiasReserva();
    const precioDiario = vehiculoReserva?.precio || 0;
    const subtotal = precioDiario * dias;

    let adicionales = 0;

    document
        .querySelectorAll(".opcion-adicional input:checked")
        .forEach((opcion) => {
            adicionales +=
                Number(opcion.dataset.precio || 0) * dias;
        });

    const descuento = subtotal * descuentoReserva;
    const total = subtotal + adicionales - descuento;

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
        `US$${Math.max(0, total).toFixed(2)}`
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
    const boton = document.getElementById("aplicar-codigo");

    if (!boton) {
        return;
    }

    boton.addEventListener("click", () => {
        const campo = document.getElementById(
            "codigo-promocional"
        );

        const mensaje = document.getElementById(
            "mensaje-codigo"
        );

        const codigo = campo.value.trim().toUpperCase();

        if (codigo === "AUTO15") {
            descuentoReserva = 0.15;

            mensaje.textContent =
                "Código aplicado: 15 % de descuento.";

            mensaje.style.color = "#16a36a";

            mostrarNotificacion(
                "Descuento aplicado",
                "Se aplicó un 15 % de descuento al vehículo."
            );
        } else {
            descuentoReserva = 0;

            mensaje.textContent =
                "El código introducido no es válido.";

            mensaje.style.color = "#ef4444";
        }

        actualizarResumenReserva();
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

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!vehiculoReserva) {
            mostrarNotificacion(
                "Vehículo requerido",
                "Selecciona un vehículo antes de continuar."
            );

            return;
        }

        const campos = formulario.querySelectorAll(
            "input[required], select[required]"
        );

        let valido = true;

        campos.forEach((campo) => {
            if (!validarCampoReserva(campo)) {
                valido = false;
            }
        });

        const aceptar = document.getElementById(
            "aceptar-reserva"
        );

        if (!aceptar.checked) {
            mostrarNotificacion(
                "Aceptación necesaria",
                "Debes aceptar los términos y condiciones."
            );

            return;
        }

        if (!valido) {
            mostrarNotificacion(
                "Datos incompletos",
                "Revisa los campos señalados."
            );

            return;
        }

        const edad = Number(
            document.getElementById("reserva-edad").value
        );

        if (edad < 21) {
            mostrarNotificacion(
                "Edad no permitida",
                "El conductor debe tener al menos 21 años."
            );

            return;
        }

        const reservacion = construirReservacion();

        const guardadas = JSON.parse(
            localStorage.getItem("autorentcarReservaciones")
        ) || [];

        guardadas.push(reservacion);

        localStorage.setItem(
            "autorentcarReservaciones",
            JSON.stringify(guardadas)
        );

        localStorage.setItem(
            "autorentcarUltimaReservacion",
            JSON.stringify(reservacion)
        );

        mostrarNotificacion(
            "Reservación registrada",
            `Tu solicitud ${reservacion.codigo} fue registrada correctamente.`
        );

        setTimeout(() => {
            window.location.href = "confirmacion.html";
        }, 1200);
    });
}

function validarCampoReserva(campo) {
    const contenedor = campo.closest(".campo-reserva");
    const error = contenedor?.querySelector(".error-reserva");

    let mensaje = "";

    if (!campo.value.trim()) {
        mensaje = "Este campo es obligatorio.";
    }

    if (
        campo.id === "reserva-correo" &&
        campo.value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value)
    ) {
        mensaje = "Escribe un correo válido.";
    }

    if (
        campo.id === "reserva-telefono" &&
        campo.value &&
        !/^[0-9+\-()\s]{8,20}$/.test(campo.value)
    ) {
        mensaje = "Escribe un teléfono válido.";
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

function construirReservacion() {
    const dias = calcularDiasReserva();
    const precioDiario = vehiculoReserva.precio;
    const subtotal = precioDiario * dias;

    const adicionalesSeleccionados = [];
    let costoAdicionales = 0;

    document
        .querySelectorAll(".opcion-adicional input:checked")
        .forEach((opcion) => {
            const nombre = opcion
                .closest(".opcion-adicional")
                .querySelector("strong")
                .textContent;

            const precio = Number(opcion.dataset.precio);

            adicionalesSeleccionados.push({
                nombre,
                precioDiario: precio
            });

            costoAdicionales += precio * dias;
        });

    const descuento = subtotal * descuentoReserva;
    const total = subtotal + costoAdicionales - descuento;

    return {
        codigo: `AR-${Date.now().toString().slice(-8)}`,
        fechaRegistro: new Date().toISOString(),
        estado: "Pendiente de confirmación",
        vehiculo: vehiculoReserva,
        lugarRecogida:
            document.getElementById("reserva-ubicacion").value,
        lugarEntrega:
            document.getElementById(
                "reserva-entrega-lugar"
            ).value,
        fechaRecogida:
            document.getElementById(
                "reserva-fecha-recogida"
            ).value,
        fechaEntrega:
            document.getElementById(
                "reserva-fecha-entrega"
            ).value,
        horaRecogida:
            document.getElementById(
                "reserva-hora-recogida"
            ).value,
        horaEntrega:
            document.getElementById(
                "reserva-hora-entrega"
            ).value,
        cliente: {
            nombre:
                document.getElementById("reserva-nombre").value,
            documento:
                document.getElementById(
                    "reserva-documento"
                ).value,
            correo:
                document.getElementById("reserva-correo").value,
            telefono:
                document.getElementById(
                    "reserva-telefono"
                ).value,
            edad: Number(
                document.getElementById("reserva-edad").value
            ),
            licencia:
                document.getElementById(
                    "reserva-licencia"
                ).value
        },
        comentarios:
            document.getElementById(
                "reserva-comentarios"
            ).value.trim(),
        adicionales: adicionalesSeleccionados,
        dias,
        precioDiario,
        subtotal,
        costoAdicionales,
        descuento,
        total
    };
}