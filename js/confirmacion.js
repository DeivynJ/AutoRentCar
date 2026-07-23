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
        ultimaReservacion = JSON.parse(
            reservacionGuardada
        );
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

    normalizarReservacionConfirmacion();

    sinDatos?.classList.remove("visible");
    contenido?.classList.add("visible");

    mostrarDatosConfirmacion();
}

/* =========================================================
   NORMALIZAR RESERVACIÓN
========================================================= */

function normalizarReservacionConfirmacion() {
    if (!ultimaReservacion) {
        return;
    }

    const cantidadVehiculos =
        obtenerCantidadReservada();

    const dias = obtenerDiasReservados();

    const precioDiario = obtenerNumeroSeguro(
        ultimaReservacion.precioDiario ??
        ultimaReservacion.vehiculo?.precio
    );

    ultimaReservacion.cantidadVehiculos =
        cantidadVehiculos;

    ultimaReservacion.dias = dias;
    ultimaReservacion.precioDiario =
        precioDiario;

    if (
        !Number.isFinite(
            Number(ultimaReservacion.subtotal)
        )
    ) {
        ultimaReservacion.subtotal =
            precioDiario *
            dias *
            cantidadVehiculos;
    }

    if (
        !Array.isArray(
            ultimaReservacion.adicionales
        )
    ) {
        ultimaReservacion.adicionales = [];
    }

    const costoAdicionalesCalculado =
        calcularCostoAdicionalesConfirmacion();

    if (
        !Number.isFinite(
            Number(
                ultimaReservacion
                    .costoAdicionales
            )
        )
    ) {
        ultimaReservacion.costoAdicionales =
            costoAdicionalesCalculado;
    }

    if (
        !Number.isFinite(
            Number(ultimaReservacion.descuento)
        )
    ) {
        ultimaReservacion.descuento = 0;
    }

    if (
        !Number.isFinite(
            Number(ultimaReservacion.total)
        )
    ) {
        ultimaReservacion.total =
            obtenerNumeroSeguro(
                ultimaReservacion.subtotal
            ) +
            obtenerNumeroSeguro(
                ultimaReservacion
                    .costoAdicionales
            ) -
            obtenerNumeroSeguro(
                ultimaReservacion.descuento
            );
    }
}

/* =========================================================
   MOSTRAR LOS DATOS
========================================================= */

function mostrarDatosConfirmacion() {
    const reservacion = ultimaReservacion;
    const vehiculo = reservacion.vehiculo || {};
    const cliente = reservacion.cliente || {};

    const cantidadVehiculos =
        obtenerCantidadReservada();

    const dias =
        obtenerDiasReservados();

    const textoCantidad =
        formatearCantidadReservada(
            cantidadVehiculos
        );

    colocarConfirmacion(
        "confirmacion-codigo",
        reservacion.codigo ||
        "Sin código"
    );

    colocarConfirmacion(
        "confirmacion-estado",
        reservacion.estado ||
        "Pendiente de confirmación"
    );

    const imagenVehiculo = document.getElementById(
        "confirmacion-vehiculo-imagen"
    );

    if (imagenVehiculo) {
        imagenVehiculo.src =
            vehiculo.imagen || "";

        imagenVehiculo.alt =
            vehiculo.nombre ||
            "Vehículo reservado";
    }

    colocarConfirmacion(
        "confirmacion-vehiculo-categoria",
        vehiculo.categoriaTexto ||
        vehiculo.categoria ||
        "Sin categoría"
    );

    colocarConfirmacion(
        "confirmacion-vehiculo-nombre",
        vehiculo.nombre ||
        "Vehículo"
    );

    colocarConfirmacion(
        "confirmacion-transmision",
        vehiculo.transmision ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-pasajeros",
        `${Number(
            vehiculo.pasajeros || 0
        )} pasajeros`
    );

    colocarConfirmacion(
        "confirmacion-combustible",
        vehiculo.combustible ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-precio-diario",
        formatearMoneda(
            reservacion.precioDiario
        )
    );

    colocarConfirmacion(
        "confirmacion-cantidad-vehiculos",
        textoCantidad
    );

    colocarConfirmacion(
        "confirmacion-cantidad",
        textoCantidad
    );

    colocarConfirmacion(
        "confirmacion-precio-unitario",
        formatearMoneda(
            reservacion.precioDiario
        )
    );

    colocarConfirmacion(
        "confirmacion-desglose-vehiculo",
        `${textoCantidad} × ${formatearDiasConfirmacion(
            dias
        )}`
    );

    colocarConfirmacion(
        "confirmacion-lugar-recogida",
        reservacion.lugarRecogida ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-lugar-entrega",
        reservacion.lugarEntrega ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-fecha-recogida",
        formatearFechaConfirmacion(
            reservacion.fechaRecogida
        )
    );

    colocarConfirmacion(
        "confirmacion-fecha-entrega",
        formatearFechaConfirmacion(
            reservacion.fechaEntrega
        )
    );

    colocarConfirmacion(
        "confirmacion-hora-recogida",
        formatearHoraConfirmacion(
            reservacion.horaRecogida
        )
    );

    colocarConfirmacion(
        "confirmacion-dias",
        formatearDiasConfirmacion(
            dias
        )
    );

    colocarConfirmacion(
        "confirmacion-cliente-nombre",
        cliente.nombre ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-cliente-documento",
        cliente.documento ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-cliente-correo",
        cliente.correo ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-cliente-telefono",
        cliente.telefono ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-cliente-edad",
        cliente.edad
            ? `${cliente.edad} años`
            : "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-cliente-licencia",
        cliente.licencia ||
        "Sin información"
    );

    colocarConfirmacion(
        "confirmacion-subtotal",
        formatearMoneda(
            reservacion.subtotal
        )
    );

    colocarConfirmacion(
        "confirmacion-adicionales",
        formatearMoneda(
            reservacion.costoAdicionales
        )
    );

    colocarConfirmacion(
        "confirmacion-descuento",
        `-${formatearMoneda(
            reservacion.descuento
        )}`
    );

    colocarConfirmacion(
        "confirmacion-total",
        formatearMoneda(
            reservacion.total
        )
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

    const adicionales = Array.isArray(
        ultimaReservacion?.adicionales
    )
        ? ultimaReservacion.adicionales
        : [];

    if (!adicionales.length) {
        contenedor.innerHTML = `
            <div class="sin-adicionales-confirmacion">
                No se seleccionaron servicios adicionales.
            </div>
        `;

        return;
    }

    const cantidadVehiculos =
        obtenerCantidadReservada();

    const dias =
        obtenerDiasReservados();

    contenedor.innerHTML = adicionales
        .map((adicional) => {
            const costoTotal =
                obtenerCostoTotalAdicional(
                    adicional
                );

            const detalleCosto =
                adicional?.aplicaPorVehiculo ===
                    false
                    ? `${formatearMoneda(
                        adicional.precioDiario
                    )} por día`
                    : `${formatearMoneda(
                        adicional.precioDiario
                    )} × ${dias} día(s) × ${cantidadVehiculos} vehículo(s)`;

            return `
                <article class="adicional-confirmacion">

                    <div>

                        <i class="fa-solid fa-circle-check"></i>

                        <span>
                            ${escaparHTML(
                                adicional?.nombre ||
                                "Servicio adicional"
                            )}
                        </span>

                    </div>

                    <div>

                        <small>
                            ${escaparHTML(
                                detalleCosto
                            )}
                        </small>

                        <strong>
                            ${formatearMoneda(
                                costoTotal
                            )}
                        </strong>

                    </div>

                </article>
            `;
        })
        .join("");
}

function obtenerCostoTotalAdicional(
    adicional
) {
    const costoGuardado = Number(
        adicional?.costoTotal
    );

    if (
        Number.isFinite(costoGuardado) &&
        costoGuardado >= 0
    ) {
        return costoGuardado;
    }

    const precioDiario = obtenerNumeroSeguro(
        adicional?.precioDiario
    );

    const dias =
        obtenerDiasReservados();

    const cantidadVehiculos =
        adicional?.aplicaPorVehiculo ===
            false
            ? 1
            : obtenerCantidadReservada();

    return (
        precioDiario *
        dias *
        cantidadVehiculos
    );
}

function calcularCostoAdicionalesConfirmacion() {
    const adicionales = Array.isArray(
        ultimaReservacion?.adicionales
    )
        ? ultimaReservacion.adicionales
        : [];

    return adicionales.reduce(
        (total, adicional) =>
            total +
            obtenerCostoTotalAdicional(
                adicional
            ),
        0
    );
}

/* =========================================================
   COMENTARIOS
========================================================= */

function mostrarComentariosConfirmacion() {
    const comentario =
        ultimaReservacion?.comentarios
            ?.trim();

    colocarConfirmacion(
        "confirmacion-comentarios",
        comentario ||
        "Sin comentarios adicionales."
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

    botonImprimir?.addEventListener(
        "click",
        () => {
            if (!ultimaReservacion) {
                return;
            }

            window.print();
        }
    );

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
        copiarTextoAlternativo(
            ultimaReservacion.codigo
        );
    }
}

function copiarTextoAlternativo(texto) {
    const campoTemporal =
        document.createElement("textarea");

    campoTemporal.value = texto;
    campoTemporal.style.position = "fixed";
    campoTemporal.style.opacity = "0";

    document.body.appendChild(
        campoTemporal
    );

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

        const reservacion =
            ultimaReservacion;

        const vehiculo =
            reservacion.vehiculo || {};

        const cliente =
            reservacion.cliente || {};

        const adicionales = Array.isArray(
            reservacion.adicionales
        )
            ? reservacion.adicionales
            : [];

        const cantidadVehiculos =
            obtenerCantidadReservada();

        const dias =
            obtenerDiasReservados();

        const textoCantidad =
            formatearCantidadReservada(
                cantidadVehiculos
            );

        const colores = {
            azul: [11, 31, 58],
            azulMedio: [24, 68, 115],
            naranja: [255, 138, 0],
            fondo: [246, 248, 252],
            borde: [226, 232, 240],
            texto: [23, 32, 51],
            suave: [100, 116, 139],
            blanco: [255, 255, 255],
            verde: [22, 163, 106]
        };

        const paginaAncho = 210;
        const margen = 12;

        const anchoContenido =
            paginaAncho -
            margen * 2;

        const espacioColumnas = 4;

        const anchoColumna =
            (
                anchoContenido -
                espacioColumnas
            ) / 2;

        function textoSeguro(
            valor,
            alternativa = "Sin información"
        ) {
            if (
                valor === undefined ||
                valor === null ||
                valor === ""
            ) {
                return alternativa;
            }

            return String(valor);
        }

        function recortarTexto(
            texto,
            maximo = 115
        ) {
            const limpio = textoSeguro(
                texto,
                "Sin comentarios adicionales."
            )
                .replace(/\s+/g, " ")
                .trim();

            if (limpio.length <= maximo) {
                return limpio;
            }

            return (
                limpio
                    .slice(
                        0,
                        maximo - 3
                    )
                    .trim() +
                "..."
            );
        }

        function dibujarTituloSeccion(
            x,
            y,
            titulo,
            ancho
        ) {
            documento.setFillColor(
                ...colores.azul
            );

            documento.roundedRect(
                x,
                y,
                ancho,
                8,
                2,
                2,
                "F"
            );

            documento.setTextColor(
                ...colores.blanco
            );

            documento.setFont(
                "helvetica",
                "bold"
            );

            documento.setFontSize(8.5);

            documento.text(
                titulo,
                x + 4,
                y + 5.5
            );
        }

        function dibujarEtiquetaValor(
            x,
            y,
            etiqueta,
            valor,
            ancho,
            opciones = {}
        ) {
            const {
                alto = 13,
                fondo = colores.fondo,
                valorTamano = 8.2,
                valorNegrita = true
            } = opciones;

            documento.setFillColor(
                ...fondo
            );

            documento.setDrawColor(
                ...colores.borde
            );

            documento.roundedRect(
                x,
                y,
                ancho,
                alto,
                2,
                2,
                "FD"
            );

            documento.setTextColor(
                ...colores.suave
            );

            documento.setFont(
                "helvetica",
                "bold"
            );

            documento.setFontSize(6.5);

            documento.text(
                etiqueta.toUpperCase(),
                x + 3,
                y + 4.2
            );

            documento.setTextColor(
                ...colores.texto
            );

            documento.setFont(
                "helvetica",
                valorNegrita
                    ? "bold"
                    : "normal"
            );

            documento.setFontSize(
                valorTamano
            );

            const lineas =
                documento
                    .splitTextToSize(
                        textoSeguro(valor),
                        ancho - 6
                    )
                    .slice(0, 2);

            documento.text(
                lineas,
                x + 3,
                y + 9.3
            );
        }

        /* =====================================================
           ENCABEZADO PRINCIPAL
        ===================================================== */

        documento.setFillColor(
            ...colores.azul
        );

        documento.rect(
            0,
            0,
            paginaAncho,
            37,
            "F"
        );

        documento.setFillColor(
            ...colores.naranja
        );

        documento.circle(
            22,
            18.5,
            9,
            "F"
        );

        documento.setTextColor(
            ...colores.blanco
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(12);

        documento.text(
            "AR",
            22,
            21,
            {
                align: "center"
            }
        );

        documento.setFontSize(18);

        documento.text(
            "AutoRentCar",
            35,
            16
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(8.5);

        documento.setTextColor(
            203,
            213,
            225
        );

        documento.text(
            "Comprobante profesional de reservación",
            35,
            22
        );

        documento.setFillColor(
            ...colores.blanco
        );

        documento.roundedRect(
            139,
            8,
            59,
            21,
            3,
            3,
            "F"
        );

        documento.setTextColor(
            ...colores.suave
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(6.5);

        documento.text(
            "CÓDIGO DE RESERVACIÓN",
            143,
            13
        );

        documento.setTextColor(
            ...colores.naranja
        );

        documento.setFontSize(12);

        documento.text(
            textoSeguro(
                reservacion.codigo,
                "SIN-CÓDIGO"
            ),
            143,
            19
        );

        documento.setTextColor(
            ...colores.azul
        );

        documento.setFontSize(7);

        documento.text(
            textoSeguro(
                reservacion.estado,
                "Pendiente de confirmación"
            ),
            143,
            25
        );

        documento.setFillColor(
            ...colores.naranja
        );

        documento.rect(
            0,
            37,
            paginaAncho,
            5,
            "F"
        );

        documento.setTextColor(
            ...colores.suave
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(7);

        documento.text(
            `Emitido: ${formatearFechaHoraRegistro(
                reservacion.fechaRegistro
            )}`,
            margen,
            47
        );

        documento.text(
            "Santiago, República Dominicana",
            paginaAncho - margen,
            47,
            {
                align: "right"
            }
        );

        /* =====================================================
           VEHÍCULO
        ===================================================== */

        let y = 52;

        dibujarTituloSeccion(
            margen,
            y,
            "VEHÍCULO RESERVADO",
            anchoContenido
        );

        y += 10;

        documento.setFillColor(
            ...colores.fondo
        );

        documento.setDrawColor(
            ...colores.borde
        );

        documento.roundedRect(
            margen,
            y,
            anchoContenido,
            34,
            3,
            3,
            "FD"
        );

        documento.setFillColor(
            ...colores.azulMedio
        );

        documento.roundedRect(
            margen + 4,
            y + 5,
            34,
            24,
            3,
            3,
            "F"
        );

        documento.setTextColor(
            ...colores.blanco
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(10);

        documento.text(
            "VEHÍCULO",
            margen + 21,
            y + 18,
            {
                align: "center"
            }
        );

        documento.setTextColor(
            ...colores.texto
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(13);

        documento.text(
            textoSeguro(
                vehiculo.nombre,
                "Vehículo"
            ),
            margen + 43,
            y + 9
        );

        documento.setTextColor(
            ...colores.naranja
        );

        documento.setFontSize(8);

        documento.text(
            textoSeguro(
                vehiculo.categoriaTexto ||
                vehiculo.categoria,
                "Sin categoría"
            ),
            margen + 43,
            y + 15
        );

        documento.setTextColor(
            ...colores.suave
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(7.5);

        documento.text(
            `${textoSeguro(
                vehiculo.transmision
            )} | ${textoSeguro(
                vehiculo.combustible
            )} | ${textoSeguro(
                vehiculo.pasajeros,
                "0"
            )} pasajeros`,
            margen + 43,
            y + 21
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setTextColor(
            ...colores.azulMedio
        );

        documento.text(
            `Cantidad reservada: ${textoCantidad}`,
            margen + 43,
            y + 27
        );

        documento.setTextColor(
            ...colores.texto
        );

        documento.setFontSize(7);

        documento.text(
            "PRECIO POR VEHÍCULO/DÍA",
            190,
            y + 8,
            {
                align: "right"
            }
        );

        documento.setTextColor(
            ...colores.naranja
        );

        documento.setFontSize(14);

        documento.text(
            formatearMoneda(
                reservacion.precioDiario
            ),
            190,
            y + 16,
            {
                align: "right"
            }
        );

        documento.setTextColor(
            ...colores.suave
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(6.5);

        documento.text(
            `${cantidadVehiculos} vehículo(s) × ${dias} día(s)`,
            190,
            y + 22,
            {
                align: "right"
            }
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setTextColor(
            ...colores.texto
        );

        documento.setFontSize(7);

        documento.text(
            `Subtotal: ${formatearMoneda(
                reservacion.subtotal
            )}`,
            190,
            y + 28,
            {
                align: "right"
            }
        );

        /* =====================================================
           DATOS DEL ALQUILER Y CLIENTE
        ===================================================== */

        y += 39;

        dibujarTituloSeccion(
            margen,
            y,
            "INFORMACIÓN DEL ALQUILER",
            anchoColumna
        );

        dibujarTituloSeccion(
            margen +
                anchoColumna +
                espacioColumnas,
            y,
            "DATOS DEL CLIENTE",
            anchoColumna
        );

        y += 10;

        const xIzquierda = margen;

        const xDerecha =
            margen +
            anchoColumna +
            espacioColumnas;

        const medioAncho =
            (
                anchoColumna -
                3
            ) / 2;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Recogida",
            reservacion.lugarRecogida,
            anchoColumna
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Cliente",
            cliente.nombre,
            anchoColumna
        );

        y += 15;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Fecha y hora de recogida",
            `${formatearFechaConfirmacion(
                reservacion.fechaRecogida
            )} - ${formatearHoraConfirmacion(
                reservacion.horaRecogida
            )}`,
            anchoColumna
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Documento",
            cliente.documento,
            medioAncho
        );

        dibujarEtiquetaValor(
            xDerecha +
                medioAncho +
                3,
            y,
            "Edad",
            cliente.edad
                ? `${cliente.edad} años`
                : "Sin información",
            medioAncho
        );

        y += 15;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Entrega",
            reservacion.lugarEntrega,
            anchoColumna
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Teléfono",
            cliente.telefono,
            medioAncho
        );

        dibujarEtiquetaValor(
            xDerecha +
                medioAncho +
                3,
            y,
            "Licencia",
            cliente.licencia,
            medioAncho
        );

        y += 15;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Fecha y hora de entrega",
            `${formatearFechaConfirmacion(
                reservacion.fechaEntrega
            )} - ${formatearHoraConfirmacion(
                reservacion.horaEntrega
            )}`,
            anchoColumna
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Correo",
            cliente.correo,
            anchoColumna,
            {
                valorTamano: 7.2
            }
        );

        y += 15;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Duración",
            formatearDiasConfirmacion(
                dias
            ),
            medioAncho
        );

        dibujarEtiquetaValor(
            xIzquierda +
                medioAncho +
                3,
            y,
            "Cantidad",
            textoCantidad,
            medioAncho
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Comentarios",
            recortarTexto(
                reservacion.comentarios
            ),
            anchoColumna,
            {
                valorTamano: 6.8,
                valorNegrita: false
            }
        );

        y += 15;

        dibujarEtiquetaValor(
            xIzquierda,
            y,
            "Promoción",
            reservacion.codigoPromocional ||
            "No aplicada",
            medioAncho
        );

        dibujarEtiquetaValor(
            xIzquierda +
                medioAncho +
                3,
            y,
            "Precio unitario",
            formatearMoneda(
                reservacion.precioDiario
            ),
            medioAncho
        );

        dibujarEtiquetaValor(
            xDerecha,
            y,
            "Estado",
            reservacion.estado ||
            "Pendiente",
            anchoColumna
        );

        /* =====================================================
           SERVICIOS Y RESUMEN ECONÓMICO
        ===================================================== */

        y += 18;

        dibujarTituloSeccion(
            margen,
            y,
            "SERVICIOS ADICIONALES",
            anchoColumna
        );

        dibujarTituloSeccion(
            xDerecha,
            y,
            "RESUMEN ECONÓMICO",
            anchoColumna
        );

        y += 10;

        documento.setFillColor(
            ...colores.fondo
        );

        documento.setDrawColor(
            ...colores.borde
        );

        documento.roundedRect(
            margen,
            y,
            anchoColumna,
            43,
            3,
            3,
            "FD"
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(7.5);

        if (!adicionales.length) {
            documento.setTextColor(
                ...colores.suave
            );

            documento.text(
                "No se seleccionaron servicios adicionales.",
                margen + 4,
                y + 9
            );
        } else {
            adicionales
                .slice(0, 4)
                .forEach(
                    (
                        adicional,
                        indice
                    ) => {
                        const totalAdicional =
                            obtenerCostoTotalAdicional(
                                adicional
                            );

                        const posicionLinea =
                            y +
                            8 +
                            indice * 8;

                        documento.setFillColor(
                            ...colores.verde
                        );

                        documento.circle(
                            margen + 5,
                            posicionLinea - 1,
                            1.2,
                            "F"
                        );

                        documento.setTextColor(
                            ...colores.texto
                        );

                        documento.setFont(
                            "helvetica",
                            "normal"
                        );

                        documento.text(
                            recortarTexto(
                                adicional?.nombre ||
                                "Servicio adicional",
                                34
                            ),
                            margen + 9,
                            posicionLinea
                        );

                        documento.setFont(
                            "helvetica",
                            "bold"
                        );

                        documento.text(
                            formatearMoneda(
                                totalAdicional
                            ),
                            margen +
                                anchoColumna -
                                4,
                            posicionLinea,
                            {
                                align: "right"
                            }
                        );
                    }
                );

            if (
                adicionales.length > 4
            ) {
                documento.setTextColor(
                    ...colores.suave
                );

                documento.setFont(
                    "helvetica",
                    "italic"
                );

                documento.setFontSize(6.5);

                documento.text(
                    `+ ${
                        adicionales.length -
                        4
                    } servicio(s) adicional(es)`,
                    margen + 4,
                    y + 39
                );
            }
        }

        documento.setFillColor(
            ...colores.fondo
        );

        documento.setDrawColor(
            ...colores.borde
        );

        documento.roundedRect(
            xDerecha,
            y,
            anchoColumna,
            43,
            3,
            3,
            "FD"
        );

        const filasPrecio = [
            [
                `${cantidadVehiculos} vehículo(s) × ${dias} día(s)`,
                formatearMoneda(
                    reservacion.subtotal
                )
            ],
            [
                "Servicios adicionales",
                formatearMoneda(
                    reservacion
                        .costoAdicionales
                )
            ],
            [
                "Descuento",
                `-${formatearMoneda(
                    reservacion.descuento
                )}`
            ]
        ];

        filasPrecio.forEach(
            (
                [etiqueta, valor],
                indice
            ) => {
                const posicion =
                    y +
                    7 +
                    indice * 8;

                documento.setTextColor(
                    ...colores.suave
                );

                documento.setFont(
                    "helvetica",
                    "normal"
                );

                documento.setFontSize(7.3);

                documento.text(
                    etiqueta,
                    xDerecha + 4,
                    posicion
                );

                documento.setTextColor(
                    ...colores.texto
                );

                documento.setFont(
                    "helvetica",
                    "bold"
                );

                documento.text(
                    valor,
                    xDerecha +
                        anchoColumna -
                        4,
                    posicion,
                    {
                        align: "right"
                    }
                );
            }
        );

        documento.setDrawColor(
            ...colores.borde
        );

        documento.line(
            xDerecha + 4,
            y + 31,
            xDerecha +
                anchoColumna -
                4,
            y + 31
        );

        documento.setTextColor(
            ...colores.texto
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(8.5);

        documento.text(
            "TOTAL ESTIMADO",
            xDerecha + 4,
            y + 39
        );

        documento.setTextColor(
            ...colores.naranja
        );

        documento.setFontSize(14);

        documento.text(
            formatearMoneda(
                reservacion.total
            ),
            xDerecha +
                anchoColumna -
                4,
            y + 39,
            {
                align: "right"
            }
        );

        /* =====================================================
           AVISO IMPORTANTE
        ===================================================== */

        y += 48;

        documento.setFillColor(
            255,
            247,
            237
        );

        documento.setDrawColor(
            253,
            186,
            116
        );

        documento.roundedRect(
            margen,
            y,
            anchoContenido,
            19,
            3,
            3,
            "FD"
        );

        documento.setFillColor(
            ...colores.naranja
        );

        documento.circle(
            margen + 7,
            y + 9.5,
            3,
            "F"
        );

        documento.setTextColor(
            ...colores.blanco
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(7);

        documento.text(
            "i",
            margen + 7,
            y + 11,
            {
                align: "center"
            }
        );

        documento.setTextColor(
            ...colores.texto
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(7.5);

        documento.text(
            "Importante",
            margen + 13,
            y + 7
        );

        documento.setTextColor(
            ...colores.suave
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setFontSize(6.8);

        const textoAviso =
            documento.splitTextToSize(
                "Este comprobante confirma el registro de la solicitud. La reservación queda sujeta a validación y confirmación por parte de la agencia.",
                anchoContenido - 18
            );

        documento.text(
            textoAviso,
            margen + 13,
            y + 11
        );

        /* =====================================================
           PIE DEL DOCUMENTO
        ===================================================== */

        documento.setFillColor(
            ...colores.azul
        );

        documento.rect(
            0,
            278,
            paginaAncho,
            19,
            "F"
        );

        documento.setTextColor(
            ...colores.blanco
        );

        documento.setFont(
            "helvetica",
            "bold"
        );

        documento.setFontSize(7.2);

        documento.text(
            "AutoRentCar",
            margen,
            286
        );

        documento.setFont(
            "helvetica",
            "normal"
        );

        documento.setTextColor(
            203,
            213,
            225
        );

        documento.setFontSize(6.7);

        documento.text(
            "+1 849-276-6030 | contacto@autorentcar.com",
            margen,
            291
        );

        documento.text(
            "Documento generado electrónicamente",
            paginaAncho - margen,
            286,
            {
                align: "right"
            }
        );

        documento.text(
            "Página 1 de 1",
            paginaAncho - margen,
            291,
            {
                align: "right"
            }
        );

        const codigoArchivo = String(
            reservacion.codigo ||
            "sin-codigo"
        )
            .trim()
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            );

        documento.save(
            `reservacion-${codigoArchivo}.pdf`
        );

        mostrarNotificacion(
            "PDF descargado",
            "El comprobante fue descargado con la cantidad de vehículos reservados."
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
   CANTIDAD Y DÍAS
========================================================= */

function obtenerCantidadReservada() {
    const cantidad = Number(
        ultimaReservacion?.cantidadVehiculos
    );

    /*
     * Las reservaciones anteriores a la
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

function obtenerDiasReservados() {
    const dias = Number(
        ultimaReservacion?.dias
    );

    if (
        !Number.isInteger(dias) ||
        dias < 0
    ) {
        return 0;
    }

    return dias;
}

function formatearCantidadReservada(
    cantidad
) {
    const total = Number(cantidad) || 0;

    if (total === 1) {
        return "1 vehículo";
    }

    return `${total} vehículos`;
}

function formatearDiasConfirmacion(
    cantidad
) {
    const dias = Number(cantidad) || 0;

    if (dias === 1) {
        return "1 día";
    }

    return `${dias} días`;
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function colocarConfirmacion(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent =
            valor ??
            "Sin información";
    }
}

function obtenerNumeroSeguro(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function formatearMoneda(valor) {
    const numero =
        obtenerNumeroSeguro(valor);

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(numero);
}

function formatearFechaConfirmacion(
    fechaTexto
) {
    if (!fechaTexto) {
        return "Sin información";
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

function formatearHoraConfirmacion(
    horaTexto
) {
    if (!horaTexto) {
        return "Sin información";
    }

    const partes =
        horaTexto.split(":");

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

function formatearFechaHoraRegistro(
    fechaTexto
) {
    if (!fechaTexto) {
        return "Sin información";
    }

    const fecha = new Date(
        fechaTexto
    );

    if (
        Number.isNaN(fecha.getTime())
    ) {
        return fechaTexto;
    }

    return fecha.toLocaleString(
        "es-DO",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function escaparHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto ?? "");

    return elemento.innerHTML;
}