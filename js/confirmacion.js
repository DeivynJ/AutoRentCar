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
   DESCARGAR RESUMEN EN PDF
========================================================= */

function descargarResumenReservacion() {
    if (!ultimaReservacion) {
        mostrarNotificacion(
            "Reservación no disponible",
            "No hay una reservación para descargar."
        );

        return;
    }

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {
        console.error(
            "La biblioteca jsPDF no está disponible."
        );

        mostrarNotificacion(
            "PDF no disponible",
            "No se pudo cargar el generador de PDF. Revisa tu conexión y actualiza la página."
        );

        return;
    }

    try {
        const { jsPDF } = window.jspdf;

        const documento = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const reservacion = ultimaReservacion;
        const vehiculo =
            reservacion.vehiculo || {};

        const cliente =
            reservacion.cliente || {};

        const margenIzquierdo = 18;
        const margenDerecho = 192;
        const anchoContenido = 174;

        let posicionY = 20;

        function comprobarNuevaPagina(
            espacioNecesario = 15
        ) {
            if (
                posicionY + espacioNecesario >
                278
            ) {
                documento.addPage();
                posicionY = 20;
            }
        }

        function agregarTituloSeccion(
            titulo
        ) {
            comprobarNuevaPagina(18);

            documento.setFillColor(
                11,
                31,
                58
            );

            documento.roundedRect(
                margenIzquierdo,
                posicionY,
                anchoContenido,
                9,
                2,
                2,
                "F"
            );

            documento.setTextColor(
                255,
                255,
                255
            );

            documento.setFont(
                "helvetica",
                "bold"
            );

            documento.setFontSize(10);

            documento.text(
                titulo,
                margenIzquierdo + 4,
                posicionY + 6
            );

            posicionY += 14;

            documento.setTextColor(
                30,
                41,
                59
            );
        }

        function agregarDato(
            etiqueta,
            valor
        ) {
            comprobarNuevaPagina(12);

            const texto =
                valor === undefined ||
                valor === null ||
                valor === ""
                    ? "Sin información"
                    : String(valor);

            documento.setFont(
                "helvetica",
                "bold"
            );

            documento.setFontSize(9);

            documento.setTextColor(
                71,
                85,
                105
            );

            documento.text(
                `${etiqueta}:`,
                margenIzquierdo,
                posicionY
            );

            documento.setFont(
                "helvetica",
                "normal"
            );

            documento.setTextColor(
                15,
                23,
                42
            );

            const lineas =
                documento.splitTextToSize(
                    texto,
                    112
                );

            documento.text(
                lineas,
                margenIzquierdo + 54,
                posicionY
            );

            posicionY += Math.max(
                7,
                lineas.length * 5
            );
        }

        /* =========================
           ENCABEZADO
        ========================= */

        documento.setFillColor(
            11,
            31,
            58
        );

        documento.rect(
            0,
            0,
            210,
            42,
            "F"
        );

        documento.setTextColor(
            255,
            255,
            255
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(22);

        documento.text(
            "AutoRentCar",
            margenIzquierdo,
            18
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(11);

        documento.text(
            "Comprobante de reservación",
            margenIzquierdo,
            27
        );

        documento.setFontSize(9);

        documento.text(
            "Santiago, República Dominicana",
            margenIzquierdo,
            34
        );

        documento.setFillColor(
            245,
            158,
            11
        );

        documento.roundedRect(
            136,
            13,
            56,
            17,
            2,
            2,
            "F"
        );

        documento.setTextColor(
            255,
            255,
            255
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(8);

        documento.text(
            "CÓDIGO DE RESERVACIÓN",
            140,
            19
        );

        documento.setFontSize(10);

        documento.text(
            String(
                reservacion.codigo ||
                "Sin código"
            ),
            140,
            26
        );

        posicionY = 52;

        documento.setTextColor(
            15,
            23,
            42
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(11);

        documento.text(
            "Estado:",
            margenIzquierdo,
            posicionY
        );

        documento.setTextColor(
            22,
            163,
            106
        );

        documento.text(
            String(
                reservacion.estado ||
                "Pendiente de confirmación"
            ),
            38,
            posicionY
        );

        posicionY += 12;

        /* =========================
           VEHÍCULO
        ========================= */

        agregarTituloSeccion(
            "INFORMACIÓN DEL VEHÍCULO"
        );

        agregarDato(
            "Vehículo",
            vehiculo.nombre
        );

        agregarDato(
            "Categoría",
            vehiculo.categoriaTexto
        );

        agregarDato(
            "Transmisión",
            vehiculo.transmision
        );

        agregarDato(
            "Combustible",
            vehiculo.combustible
        );

        agregarDato(
            "Pasajeros",
            vehiculo.pasajeros
                ? `${vehiculo.pasajeros} pasajeros`
                : "Sin información"
        );

        agregarDato(
            "Precio diario",
            formatearMoneda(
                reservacion.precioDiario
            )
        );

        posicionY += 3;

        /* =========================
           ALQUILER
        ========================= */

        agregarTituloSeccion(
            "INFORMACIÓN DEL ALQUILER"
        );

        agregarDato(
            "Lugar de recogida",
            reservacion.lugarRecogida
        );

        agregarDato(
            "Lugar de entrega",
            reservacion.lugarEntrega
        );

        agregarDato(
            "Fecha de recogida",
            formatearFechaConfirmacion(
                reservacion.fechaRecogida
            )
        );

        agregarDato(
            "Hora de recogida",
            formatearHoraConfirmacion(
                reservacion.horaRecogida
            )
        );

        agregarDato(
            "Fecha de entrega",
            formatearFechaConfirmacion(
                reservacion.fechaEntrega
            )
        );

        agregarDato(
            "Hora de entrega",
            formatearHoraConfirmacion(
                reservacion.horaEntrega
            )
        );

        agregarDato(
            "Duración",
            `${Number(
                reservacion.dias || 0
            )} día(s)`
        );

        posicionY += 3;

        /* =========================
           CLIENTE
        ========================= */

        agregarTituloSeccion(
            "INFORMACIÓN DEL CLIENTE"
        );

        agregarDato(
            "Nombre",
            cliente.nombre
        );

        agregarDato(
            "Documento",
            cliente.documento
        );

        agregarDato(
            "Correo",
            cliente.correo
        );

        agregarDato(
            "Teléfono",
            cliente.telefono
        );

        agregarDato(
            "Edad",
            cliente.edad
                ? `${cliente.edad} años`
                : "Sin información"
        );

        agregarDato(
            "Licencia",
            cliente.licencia
        );

        posicionY += 3;

        /* =========================
           SERVICIOS ADICIONALES
        ========================= */

        agregarTituloSeccion(
            "SERVICIOS ADICIONALES"
        );

        const adicionales =
            Array.isArray(
                reservacion.adicionales
            )
                ? reservacion.adicionales
                : [];

        if (!adicionales.length) {
            agregarDato(
                "Servicios",
                "No se seleccionaron servicios adicionales."
            );
        } else {
            adicionales.forEach(
                (adicional) => {
                    const precioDiario =
                        Number(
                            adicional
                                ?.precioDiario ||
                            0
                        );

                    const dias = Number(
                        reservacion.dias || 0
                    );

                    agregarDato(
                        adicional?.nombre ||
                        "Servicio adicional",
                        formatearMoneda(
                            precioDiario *
                            dias
                        )
                    );
                }
            );
        }

        agregarDato(
            "Código promocional",
            reservacion.codigoPromocional ||
            "No aplicado"
        );

        posicionY += 3;

        /* =========================
           COMENTARIOS
        ========================= */

        agregarTituloSeccion(
            "COMENTARIOS"
        );

        agregarDato(
            "Observaciones",
            reservacion.comentarios ||
            "Sin comentarios adicionales."
        );

        posicionY += 3;

        /* =========================
           PRECIO
        ========================= */

        agregarTituloSeccion(
            "RESUMEN DEL PRECIO"
        );

        agregarDato(
            "Subtotal del vehículo",
            formatearMoneda(
                reservacion.subtotal
            )
        );

        agregarDato(
            "Servicios adicionales",
            formatearMoneda(
                reservacion
                    .costoAdicionales
            )
        );

        agregarDato(
            "Descuento",
            `-${formatearMoneda(
                reservacion.descuento
            )}`
        );

        comprobarNuevaPagina(25);

        documento.setFillColor(
            241,
            245,
            249
        );

        documento.roundedRect(
            margenIzquierdo,
            posicionY,
            anchoContenido,
            18,
            3,
            3,
            "F"
        );

        documento.setTextColor(
            15,
            23,
            42
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(12);

        documento.text(
            "TOTAL ESTIMADO",
            margenIzquierdo + 5,
            posicionY + 11
        );

        documento.setTextColor(
            245,
            158,
            11
        );

        documento.setFontSize(16);

        documento.text(
            formatearMoneda(
                reservacion.total
            ),
            margenDerecho - 5,
            posicionY + 12,
            {
                align: "right"
            }
        );

        posicionY += 27;

        /* =========================
           PIE DE PÁGINA
        ========================= */

        comprobarNuevaPagina(25);

        documento.setDrawColor(
            226,
            232,
            240
        );

        documento.line(
            margenIzquierdo,
            posicionY,
            margenDerecho,
            posicionY
        );

        posicionY += 8;

        documento.setTextColor(
            100,
            116,
            139
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(8);

        const nota =
            documento.splitTextToSize(
                "Este documento confirma el registro de la solicitud. La reservación permanece sujeta a validación y confirmación por parte de AutoRentCar.",
                anchoContenido
            );

        documento.text(
            nota,
            margenIzquierdo,
            posicionY
        );

        posicionY +=
            nota.length * 4 + 5;

        documento.text(
            "AutoRentCar | +1 849-276-6030 | contacto@autorentcar.com",
            margenIzquierdo,
            posicionY
        );

        /* =========================
           NUMERACIÓN
        ========================= */

        const totalPaginas =
            documento.getNumberOfPages();

        for (
            let pagina = 1;
            pagina <= totalPaginas;
            pagina += 1
        ) {
            documento.setPage(pagina);

            documento.setFont(
                "helvetica",
                "normal"
            );

            documento.setFontSize(8);

            documento.setTextColor(
                148,
                163,
                184
            );

            documento.text(
                `Página ${pagina} de ${totalPaginas}`,
                192,
                291,
                {
                    align: "right"
                }
            );
        }

        const codigoArchivo = String(
            reservacion.codigo ||
            "sin-codigo"
        )
            .trim()
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .replace(/-+/g, "-");

        documento.save(
            `reservacion-${codigoArchivo}.pdf`
        );

        mostrarNotificacion(
            "PDF descargado",
            "El comprobante fue descargado en formato PDF."
        );
    } catch (error) {
        console.error(
            "No fue posible generar el PDF.",
            error
        );

        mostrarNotificacion(
            "Error al generar PDF",
            "No fue posible crear el comprobante. Revisa la consola del navegador."
        );
    }
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