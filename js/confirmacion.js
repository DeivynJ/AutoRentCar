/* =========================================================
   AUTORENTCAR - CONFIRMACIÓN DE RESERVACIÓN
========================================================= */

let ultimaReservacion = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarConfirmacionReserva();
    configurarAccionesConfirmacion();
});

/* =========================================================
   CARGAR LA ÚLTIMA RESERVACIÓN
========================================================= */

function cargarConfirmacionReserva() {
    const reservacionGuardada = localStorage.getItem(
        "autorentcarUltimaReservacion"
    );

    const contenido = document.getElementById(
        "confirmacion-contenido"
    );

    const sinDatos = document.getElementById(
        "confirmacion-sin-datos"
    );

    if (!reservacionGuardada) {
        sinDatos?.classList.add("visible");
        contenido?.classList.remove("visible");
        return;
    }

    try {
        ultimaReservacion = JSON.parse(reservacionGuardada);
    } catch (error) {
        console.error(
            "No fue posible cargar la reservación.",
            error
        );

        sinDatos?.classList.add("visible");
        contenido?.classList.remove("visible");
        return;
    }

    if (
        !ultimaReservacion ||
        !ultimaReservacion.vehiculo ||
        !ultimaReservacion.cliente
    ) {
        sinDatos?.classList.add("visible");
        contenido?.classList.remove("visible");
        return;
    }

    sinDatos?.classList.remove("visible");
    contenido?.classList.add("visible");

    mostrarDatosConfirmacion();
}

/* =========================================================
   MOSTRAR LOS DATOS
========================================================= */

function mostrarDatosConfirmacion() {
    const reservacion = ultimaReservacion;
    const vehiculo = reservacion.vehiculo;
    const cliente = reservacion.cliente;

    colocarConfirmacion(
        "confirmacion-codigo",
        reservacion.codigo
    );

    colocarConfirmacion(
        "confirmacion-estado",
        reservacion.estado
    );

    const imagenVehiculo = document.getElementById(
        "confirmacion-vehiculo-imagen"
    );

    if (imagenVehiculo) {
        imagenVehiculo.src = vehiculo.imagen;
        imagenVehiculo.alt = vehiculo.nombre;
    }

    colocarConfirmacion(
        "confirmacion-vehiculo-categoria",
        vehiculo.categoriaTexto
    );

    colocarConfirmacion(
        "confirmacion-vehiculo-nombre",
        vehiculo.nombre
    );

    colocarConfirmacion(
        "confirmacion-transmision",
        vehiculo.transmision
    );

    colocarConfirmacion(
        "confirmacion-pasajeros",
        `${vehiculo.pasajeros} pasajeros`
    );

    colocarConfirmacion(
        "confirmacion-combustible",
        vehiculo.combustible
    );

    colocarConfirmacion(
        "confirmacion-precio-diario",
        formatearMoneda(reservacion.precioDiario)
    );

    colocarConfirmacion(
        "confirmacion-lugar-recogida",
        reservacion.lugarRecogida
    );

    colocarConfirmacion(
        "confirmacion-lugar-entrega",
        reservacion.lugarEntrega
    );

    colocarConfirmacion(
        "confirmacion-fecha-recogida",
        formatearFechaConfirmacion(reservacion.fechaRecogida)
    );

    colocarConfirmacion(
        "confirmacion-fecha-entrega",
        formatearFechaConfirmacion(reservacion.fechaEntrega)
    );

    colocarConfirmacion(
        "confirmacion-hora-recogida",
        formatearHoraConfirmacion(reservacion.horaRecogida)
    );

    colocarConfirmacion(
        "confirmacion-dias",
        reservacion.dias === 1
            ? "1 día"
            : `${reservacion.dias} días`
    );

    colocarConfirmacion(
        "confirmacion-cliente-nombre",
        cliente.nombre
    );

    colocarConfirmacion(
        "confirmacion-cliente-documento",
        cliente.documento
    );

    colocarConfirmacion(
        "confirmacion-cliente-correo",
        cliente.correo
    );

    colocarConfirmacion(
        "confirmacion-cliente-telefono",
        cliente.telefono
    );

    colocarConfirmacion(
        "confirmacion-cliente-edad",
        `${cliente.edad} años`
    );

    colocarConfirmacion(
        "confirmacion-cliente-licencia",
        cliente.licencia
    );

    colocarConfirmacion(
        "confirmacion-subtotal",
        formatearMoneda(reservacion.subtotal)
    );

    colocarConfirmacion(
        "confirmacion-adicionales",
        formatearMoneda(reservacion.costoAdicionales)
    );

    colocarConfirmacion(
        "confirmacion-descuento",
        `-${formatearMoneda(reservacion.descuento)}`
    );

    colocarConfirmacion(
        "confirmacion-total",
        formatearMoneda(reservacion.total)
    );

    mostrarServiciosAdicionales();
    mostrarComentariosConfirmacion();
}

/* =========================================================
   SERVICIOS ADICIONALES
========================================================= */

function mostrarServiciosAdicionales() {
    const contenedor = document.getElementById(
        "lista-adicionales-confirmacion"
    );

    if (!contenedor) {
        return;
    }

    const adicionales = ultimaReservacion.adicionales || [];

    if (!adicionales.length) {
        contenedor.innerHTML = `
            <div class="sin-adicionales-confirmacion">
                No se seleccionaron servicios adicionales.
            </div>
        `;

        return;
    }

    contenedor.innerHTML = adicionales
        .map((adicional) => {
            const costoTotal =
                adicional.precioDiario *
                ultimaReservacion.dias;

            return `
                <article class="adicional-confirmacion">

                    <div>
                        <i class="fa-solid fa-circle-check"></i>

                        <span>
                            ${escaparHTML(adicional.nombre)}
                        </span>
                    </div>

                    <strong>
                        ${formatearMoneda(costoTotal)}
                    </strong>

                </article>
            `;
        })
        .join("");
}

/* =========================================================
   COMENTARIOS
========================================================= */

function mostrarComentariosConfirmacion() {
    const comentario = ultimaReservacion.comentarios?.trim();

    colocarConfirmacion(
        "confirmacion-comentarios",
        comentario || "Sin comentarios adicionales."
    );
}

/* =========================================================
   ACCIONES
========================================================= */

function configurarAccionesConfirmacion() {
    const botonCopiar = document.getElementById(
        "copiar-codigo-reserva"
    );

    const botonImprimir = document.getElementById(
        "boton-imprimir-reserva"
    );

    const botonDescargar = document.getElementById(
        "boton-descargar-reserva"
    );

    botonCopiar?.addEventListener(
        "click",
        copiarCodigoReservacion
    );

    botonImprimir?.addEventListener("click", () => {
        if (!ultimaReservacion) {
            return;
        }

        window.print();
    });

    botonDescargar?.addEventListener(
        "click",
        descargarResumenReservacion
    );
}

/* =========================================================
   COPIAR CÓDIGO
========================================================= */

async function copiarCodigoReservacion() {
    if (!ultimaReservacion?.codigo) {
        return;
    }

    try {
        await navigator.clipboard.writeText(
            ultimaReservacion.codigo
        );

        mostrarNotificacion(
            "Código copiado",
            "El código de la reservación fue copiado."
        );
    } catch (error) {
        copiarTextoAlternativo(ultimaReservacion.codigo);
    }
}

function copiarTextoAlternativo(texto) {
    const campoTemporal = document.createElement("textarea");

    campoTemporal.value = texto;
    campoTemporal.style.position = "fixed";
    campoTemporal.style.opacity = "0";

    document.body.appendChild(campoTemporal);

    campoTemporal.select();
    document.execCommand("copy");

    campoTemporal.remove();

    mostrarNotificacion(
        "Código copiado",
        "El código de la reservación fue copiado."
    );
}

/* =========================================================
   DESCARGAR RESUMEN
========================================================= */

function descargarResumenReservacion() {
    if (!ultimaReservacion) {
        return;
    }

    const reservacion = ultimaReservacion;
    const vehiculo = reservacion.vehiculo;
    const cliente = reservacion.cliente;

    const adicionales = reservacion.adicionales?.length
        ? reservacion.adicionales
            .map((adicional) => {
                const total =
                    adicional.precioDiario * reservacion.dias;

                return (
                    `- ${adicional.nombre}: ` +
                    `${formatearMoneda(total)}`
                );
            })
            .join("\n")
        : "Ninguno";

    const contenido = `
AUTORENTCAR
COMPROBANTE DE RESERVACIÓN

Código: ${reservacion.codigo}
Estado: ${reservacion.estado}
Fecha de registro: ${formatearFechaHoraRegistro(
        reservacion.fechaRegistro
    )}

VEHÍCULO
Nombre: ${vehiculo.nombre}
Categoría: ${vehiculo.categoriaTexto}
Transmisión: ${vehiculo.transmision}
Combustible: ${vehiculo.combustible}
Pasajeros: ${vehiculo.pasajeros}
Precio diario: ${formatearMoneda(reservacion.precioDiario)}

INFORMACIÓN DEL ALQUILER
Lugar de recogida: ${reservacion.lugarRecogida}
Lugar de entrega: ${reservacion.lugarEntrega}
Fecha de recogida: ${formatearFechaConfirmacion(
        reservacion.fechaRecogida
    )}
Hora de recogida: ${formatearHoraConfirmacion(
        reservacion.horaRecogida
    )}
Fecha de entrega: ${formatearFechaConfirmacion(
        reservacion.fechaEntrega
    )}
Hora de entrega: ${formatearHoraConfirmacion(
        reservacion.horaEntrega
    )}
Duración: ${reservacion.dias} día(s)

CLIENTE
Nombre: ${cliente.nombre}
Documento: ${cliente.documento}
Correo: ${cliente.correo}
Teléfono: ${cliente.telefono}
Edad: ${cliente.edad}
Licencia: ${cliente.licencia}

SERVICIOS ADICIONALES
${adicionales}

COMENTARIOS
${reservacion.comentarios || "Sin comentarios adicionales."}

RESUMEN DEL PRECIO
Subtotal del vehículo: ${formatearMoneda(
        reservacion.subtotal
    )}
Servicios adicionales: ${formatearMoneda(
        reservacion.costoAdicionales
    )}
Descuento: -${formatearMoneda(reservacion.descuento)}
Total estimado: ${formatearMoneda(reservacion.total)}

Esta solicitud está pendiente de confirmación.

AutoRentCar
Santiago, República Dominicana
+1 809-555-2026
contacto@autorentcar.com
`.trim();

    const archivo = new Blob(
        [contenido],
        {
            type: "text/plain;charset=utf-8"
        }
    );

    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(archivo);
    enlace.download =
        `reservacion-${reservacion.codigo}.txt`;

    document.body.appendChild(enlace);

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(enlace.href);

    mostrarNotificacion(
        "Resumen descargado",
        "El comprobante fue descargado como archivo de texto."
    );
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function colocarConfirmacion(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor ?? "Sin información";
    }
}

function formatearMoneda(valor) {
    const numero = Number(valor) || 0;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(numero);
}

function formatearFechaConfirmacion(fechaTexto) {
    if (!fechaTexto) {
        return "Sin información";
    }

    const fecha = new Date(`${fechaTexto}T00:00:00`);

    return fecha.toLocaleDateString("es-DO", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function formatearHoraConfirmacion(horaTexto) {
    if (!horaTexto) {
        return "Sin información";
    }

    const partes = horaTexto.split(":");

    const fecha = new Date();

    fecha.setHours(
        Number(partes[0]),
        Number(partes[1]),
        0,
        0
    );

    return fecha.toLocaleTimeString("es-DO", {
        hour: "numeric",
        minute: "2-digit"
    });
}

function formatearFechaHoraRegistro(fechaTexto) {
    if (!fechaTexto) {
        return "Sin información";
    }

    return new Date(fechaTexto).toLocaleString("es-DO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function escaparHTML(texto) {
    const elemento = document.createElement("div");

    elemento.textContent = texto ?? "";

    return elemento.innerHTML;
}