/* =========================================================
   AUTORENTCAR - CONFIRMACIÓN DE RESERVACIÓN
========================================================= */

let ultimaReservacion = null;

document.addEventListener("DOMContentLoaded", () => {

    actualizarEnlacesAgenciaConfirmacion();

    cargarConfirmacionReserva();

    configurarAccionesConfirmacion();

});

/* =========================================================
   CONTEXTO DE AGENCIA
========================================================= */

function obtenerSlugAgenciaConfirmacion() {

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


function obtenerClaveUltimaReservacionConfirmacion() {

    return `autorentcarUltimaReservacion:${obtenerSlugAgenciaConfirmacion()}`;

}


function obtenerClaveReservacionesConfirmacion() {

    return `autorentcarReservaciones:${obtenerSlugAgenciaConfirmacion()}`;

}

/* =========================================================
   CARGAR LA ÚLTIMA RESERVACIÓN
========================================================= */

function cargarConfirmacionReserva() {
    const reservacionGuardada = localStorage.getItem(
    obtenerClaveUltimaReservacionConfirmacion()
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

    const slugAgenciaActual =
    obtenerSlugAgenciaConfirmacion();


if (
    ultimaReservacion?.agencia?.slug &&
    ultimaReservacion.agencia.slug !==
        slugAgenciaActual
) {

    console.error(
        "La reservación pertenece a otra agencia."
    );


    ultimaReservacion = null;


    sinDatos?.classList.add(
        "visible"
    );

    contenido?.classList.remove(
        "visible"
    );


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
   CONSERVAR AGENCIA EN LA NAVEGACIÓN
========================================================= */

function actualizarEnlacesAgenciaConfirmacion() {

    const slug =
        obtenerSlugAgenciaConfirmacion();


    const paginasPublicas =
        new Set(
            [
                "index.html",
                "vehiculos.html",
                "reserva.html",
                "confirmacion.html",
                "mis-reservas.html",
                "nosotros.html",
                "contacto.html"
            ]
        );


    const enlaces =
        document.querySelectorAll(
            "a[href]"
        );


    enlaces.forEach(
        (enlace) => {

            const href =
                enlace.getAttribute(
                    "href"
                );


            if (!href) {

                return;

            }


            /*
             * Servicios pertenece a una sección
             * de la página de Inicio.
             */

            if (
                href === "#servicios" ||
                href === "index.html#servicios"
            ) {

                enlace.setAttribute(
                    "href",
                    `index.html?agencia=${encodeURIComponent(
                        slug
                    )}#servicios`
                );


                return;

            }


            if (
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:")
            ) {

                return;

            }


            let url;


            try {

                url =
                    new URL(
                        href,
                        window.location.href
                    );

            } catch (error) {

                return;

            }


            /*
             * No modificamos WhatsApp,
             * redes sociales ni sitios externos.
             */

            if (
                url.origin !==
                window.location.origin
            ) {

                return;

            }


            const partesRuta =
                url.pathname.split("/");


            const nombreArchivo =
                partesRuta[
                    partesRuta.length - 1
                ];


            if (
                !paginasPublicas.has(
                    nombreArchivo
                )
            ) {

                return;

            }


            url.searchParams.set(
                "agencia",
                slug
            );


            enlace.setAttribute(
                "href",
                `${url.pathname}${url.search}${url.hash}`
            );

        }
    );

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

async function descargarResumenReservacion() {
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

        const agenciaPdf =
    await obtenerAgenciaParaPdf(
        reservacion
    );


const identidadPdf =
    construirIdentidadAgenciaPdf(
        agenciaPdf
    );


const logoPdf =
    await cargarLogoPdfComoPng(
        identidadPdf.logo
    );    

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

        const colores =
    crearPaletaAgenciaPdf(
        identidadPdf.colores
    );
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

        dibujarMarcaAgenciaPdf(
    documento,
    logoPdf,
    identidadPdf.nombre,
    colores
);


documento.setTextColor(
    ...colores.blanco
);


documento.setFont(
    "helvetica",
    "bold"
);


documento.setFontSize(18);


const nombreAgenciaCabecera =
    documento
        .splitTextToSize(
            identidadPdf.nombre,
            96
        )[0];


documento.text(
    nombreAgenciaCabecera,
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
    ...colores.acentoTexto
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

        const ubicacionPdf =
    documento
        .splitTextToSize(
            identidadPdf.ubicacion,
            85
        )[0];


documento.text(
    ubicacionPdf,
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
    ...colores.acentoTexto
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
    ...colores.acentoTexto
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
    ...colores.acentoTexto
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
    ...colores.acentoFondo
);


documento.setDrawColor(
    ...colores.acentoBorde
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
    ...colores.textoSobreAcento
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
    identidadPdf.nombre,
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

        const contactoPiePdf =
    documento
        .splitTextToSize(
            identidadPdf.contactoLinea,
            105
        )[0];


documento.text(
    contactoPiePdf,
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
    `El comprobante de ${identidadPdf.nombre} fue generado correctamente.`
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
   IDENTIDAD DE AGENCIA PARA PDF
========================================================= */

async function obtenerAgenciaParaPdf(
    reservacion
) {

    const slug =
        obtenerSlugAgenciaConfirmacion();


    /*
     * app.js normalmente ya cargó la agencia.
     */

    if (
        window.AutoRentCarAgencia &&
        String(
            window.AutoRentCarAgencia.slug ||
            ""
        )
            .trim()
            .toLowerCase() ===
            slug
    ) {

        return window.AutoRentCarAgencia;

    }


    /*
     * Si todavía no terminó de cargar app.js,
     * consultamos directamente la API.
     */

    try {

        const respuesta =
            await fetch(
                `/api/agencias/${encodeURIComponent(
                    slug
                )}/catalogo`,
                {
                    headers:
                    {
                        Accept:
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        const datos =
            await respuesta.json();


        if (
            respuesta.ok &&
            datos?.ok === true &&
            datos?.agencia
        ) {

            return datos.agencia;

        }

    } catch (error) {

        console.error(
            "No fue posible obtener la agencia para el PDF.",
            error
        );

    }


    /*
     * Respaldo final para no impedir que
     * el cliente descargue su comprobante.
     */

    return {

        id:
            reservacion?.agencia?.id ||
            0,

        slug,

        nombre:
            reservacion?.agencia?.nombre ||
            "AutoRentCar",

        logo:
            "",

        colores:
        {
            primario:
                "#0b1f3a",

            secundario:
                "#ff8a00"
        },

        contacto:
        {}

    };

}


/* =========================================================
   CONSTRUIR IDENTIDAD DEL PDF
========================================================= */

function construirIdentidadAgenciaPdf(
    agencia
) {

    const contacto =
        agencia?.contacto ||
        {};


    const nombre =
        String(
            agencia?.nombre ||
            "AutoRentCar"
        ).trim();


    const telefono =
        String(
            contacto.telefono ||
            contacto.whatsapp ||
            ""
        ).trim();


    const correo =
        String(
            contacto.correo ||
            ""
        ).trim();


    const ciudad =
        String(
            contacto.ciudad ||
            ""
        ).trim();


    const provincia =
        String(
            contacto.provincia ||
            ""
        ).trim();


    const pais =
        String(
            contacto.pais ||
            ""
        ).trim();


    const partesUbicacion =
        [
            ciudad,
            provincia,
            pais
        ]
            .filter(
                Boolean
            );


    const partesUnicas =
        [];


    partesUbicacion.forEach(
        (parte) => {

            if (
                !partesUnicas.some(
                    (existente) =>
                        existente
                            .toLowerCase() ===
                        parte.toLowerCase()
                )
            ) {

                partesUnicas.push(
                    parte
                );

            }

        }
    );


    const ubicacion =
        partesUnicas.join(
            ", "
        ) ||
        "República Dominicana";


    const datosContacto =
        [
            telefono,
            correo
        ]
            .filter(
                Boolean
            );


    return {

        nombre,

        logo:
            String(
                agencia?.logo ||
                ""
            ).trim(),

        colores:
        {
            primario:
                agencia?.colores?.primario ||
                "#0b1f3a",

            secundario:
                agencia?.colores?.secundario ||
                "#ff8a00"
        },

        telefono,

        correo,

        ubicacion,

        contactoLinea:
            datosContacto.join(
                " | "
            ) ||
            ubicacion

    };

}


/* =========================================================
   PALETA DINÁMICA DEL PDF
========================================================= */

function crearPaletaAgenciaPdf(
    coloresMarca
) {

    const primario =
        convertirHexRgbPdf(
            normalizarHexPdf(
                coloresMarca?.primario
            ) ||
            "#0b1f3a"
        );


    const secundario =
        convertirHexRgbPdf(
            normalizarHexPdf(
                coloresMarca?.secundario
            ) ||
            "#ff8a00"
        );


    const luminanciaPrimario =
        calcularLuminanciaPdf(
            primario
        );


    const luminanciaSecundario =
        calcularLuminanciaPdf(
            secundario
        );


    let base;

    let acento;


    if (
        luminanciaPrimario <=
        luminanciaSecundario
    ) {

        base =
            primario;

        acento =
            secundario;

    } else {

        base =
            secundario;

        acento =
            primario;

    }


    base =
        asegurarBaseOscuraPdf(
            base
        );


    const blanco =
        {
            r: 255,
            g: 255,
            b: 255
        };


    const negro =
        {
            r: 0,
            g: 0,
            b: 0
        };


    const textoOscuro =
        {
            r: 23,
            g: 32,
            b: 51
        };


    const baseMedio =
        mezclarRgbPdf(
            base,
            blanco,
            0.20
        );


    let acentoTexto =
        {
            ...acento
        };


    let intentos =
        0;


    while (
        calcularContrastePdf(
            acentoTexto,
            blanco
        ) <
            4.5 &&
        intentos <
            12
    ) {

        acentoTexto =
            mezclarRgbPdf(
                acentoTexto,
                negro,
                0.10
            );


        intentos++;

    }


    const contrasteOscuro =
        calcularContrastePdf(
            acento,
            textoOscuro
        );


    const contrasteBlanco =
        calcularContrastePdf(
            acento,
            blanco
        );


    const textoSobreAcento =
        contrasteOscuro >
            contrasteBlanco

            ? textoOscuro
            : blanco;


    return {

        azul:
            rgbObjetoAArrayPdf(
                base
            ),

        azulMedio:
            rgbObjetoAArrayPdf(
                baseMedio
            ),

        naranja:
            rgbObjetoAArrayPdf(
                acento
            ),

        acentoTexto:
            rgbObjetoAArrayPdf(
                acentoTexto
            ),

        textoSobreAcento:
            rgbObjetoAArrayPdf(
                textoSobreAcento
            ),

        acentoFondo:
            rgbObjetoAArrayPdf(
                mezclarRgbPdf(
                    acento,
                    blanco,
                    0.90
                )
            ),

        acentoBorde:
            rgbObjetoAArrayPdf(
                mezclarRgbPdf(
                    acento,
                    blanco,
                    0.48
                )
            ),

        fondo:
            [
                246,
                248,
                252
            ],

        borde:
            [
                226,
                232,
                240
            ],

        texto:
            [
                23,
                32,
                51
            ],

        suave:
            [
                100,
                116,
                139
            ],

        blanco:
            [
                255,
                255,
                255
            ],

        verde:
            [
                22,
                163,
                106
            ]

    };

}


/* =========================================================
   NORMALIZAR HEX DEL PDF
========================================================= */

function normalizarHexPdf(
    color
) {

    let valor =
        String(
            color ||
            ""
        )
            .trim()
            .toLowerCase();


    if (!valor) {

        return "";

    }


    if (
        !valor.startsWith("#")
    ) {

        valor =
            `#${valor}`;

    }


    if (
        /^#[0-9a-f]{3}$/i.test(
            valor
        )
    ) {

        valor =
            `#${valor[1]}${valor[1]}${valor[2]}${valor[2]}${valor[3]}${valor[3]}`;

    }


    return /^#[0-9a-f]{6}$/i.test(
        valor
    )
        ? valor
        : "";

}


/* =========================================================
   HEX A RGB DEL PDF
========================================================= */

function convertirHexRgbPdf(
    color
) {

    return {

        r:
            parseInt(
                color.slice(
                    1,
                    3
                ),
                16
            ),

        g:
            parseInt(
                color.slice(
                    3,
                    5
                ),
                16
            ),

        b:
            parseInt(
                color.slice(
                    5,
                    7
                ),
                16
            )

    };

}


/* =========================================================
   RGB A ARRAY PARA JSPDF
========================================================= */

function rgbObjetoAArrayPdf(
    color
) {

    return [
        color.r,
        color.g,
        color.b
    ];

}


/* =========================================================
   MEZCLAR COLORES DEL PDF
========================================================= */

function mezclarRgbPdf(
    colorA,
    colorB,
    porcentajeColorB
) {

    const porcentaje =
        Math.max(
            0,
            Math.min(
                1,
                porcentajeColorB
            )
        );


    return {

        r:
            Math.round(
                colorA.r +
                (
                    colorB.r -
                    colorA.r
                ) *
                porcentaje
            ),

        g:
            Math.round(
                colorA.g +
                (
                    colorB.g -
                    colorA.g
                ) *
                porcentaje
            ),

        b:
            Math.round(
                colorA.b +
                (
                    colorB.b -
                    colorA.b
                ) *
                porcentaje
            )

    };

}


/* =========================================================
   LUMINANCIA DEL PDF
========================================================= */

function calcularLuminanciaPdf(
    color
) {

    const convertir =
        (canal) => {

            const valor =
                canal /
                255;


            return valor <=
                0.03928

                ? valor /
                    12.92

                : Math.pow(
                    (
                        valor +
                        0.055
                    ) /
                    1.055,
                    2.4
                );

        };


    const r =
        convertir(
            color.r
        );


    const g =
        convertir(
            color.g
        );


    const b =
        convertir(
            color.b
        );


    return (
        0.2126 *
        r
    ) +
    (
        0.7152 *
        g
    ) +
    (
        0.0722 *
        b
    );

}


/* =========================================================
   CONTRASTE DEL PDF
========================================================= */

function calcularContrastePdf(
    colorA,
    colorB
) {

    const luminanciaA =
        calcularLuminanciaPdf(
            colorA
        );


    const luminanciaB =
        calcularLuminanciaPdf(
            colorB
        );


    const mayor =
        Math.max(
            luminanciaA,
            luminanciaB
        );


    const menor =
        Math.min(
            luminanciaA,
            luminanciaB
        );


    return (
        mayor +
        0.05
    ) /
    (
        menor +
        0.05
    );

}


/* =========================================================
   ASEGURAR BASE OSCURA DEL PDF
========================================================= */

function asegurarBaseOscuraPdf(
    color
) {

    const blanco =
        {
            r: 255,
            g: 255,
            b: 255
        };


    const negro =
        {
            r: 0,
            g: 0,
            b: 0
        };


    let resultado =
        {
            ...color
        };


    let intentos =
        0;


    while (
        calcularContrastePdf(
            resultado,
            blanco
        ) <
            5 &&
        intentos <
            12
    ) {

        resultado =
            mezclarRgbPdf(
                resultado,
                negro,
                0.10
            );


        intentos++;

    }


    return resultado;

}


/* =========================================================
   LOGO PARA PDF
========================================================= */

async function cargarLogoPdfComoPng(
    ruta
) {

    if (!ruta) {

        return "";

    }


    try {

        const respuesta =
            await fetch(
                ruta,
                {
                    cache:
                        "no-store"
                }
            );


        if (!respuesta.ok) {

            return "";

        }


        const blob =
            await respuesta.blob();


        const dataUrl =
            await convertirBlobADataUrlPdf(
                blob
            );


        const imagen =
            await cargarImagenHtmlPdf(
                dataUrl
            );


        const maximo =
            600;


        const escala =
            Math.min(
                1,
                maximo /
                Math.max(
                    imagen.naturalWidth,
                    imagen.naturalHeight
                )
            );


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            Math.max(
                1,
                Math.round(
                    imagen.naturalWidth *
                    escala
                )
            );


        canvas.height =
            Math.max(
                1,
                Math.round(
                    imagen.naturalHeight *
                    escala
                )
            );


        const contexto =
            canvas.getContext(
                "2d"
            );


        if (!contexto) {

            return "";

        }


        contexto.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        contexto.drawImage(
            imagen,
            0,
            0,
            canvas.width,
            canvas.height
        );


        return canvas.toDataURL(
            "image/png"
        );

    } catch (error) {

        console.error(
            "No fue posible cargar el logo para el PDF.",
            error
        );


        return "";

    }

}


/* =========================================================
   BLOB A DATA URL
========================================================= */

function convertirBlobADataUrlPdf(
    blob
) {

    return new Promise(
        (
            resolver,
            rechazar
        ) => {

            const lector =
                new FileReader();


            lector.onload =
                () =>
                    resolver(
                        lector.result
                    );


            lector.onerror =
                rechazar;


            lector.readAsDataURL(
                blob
            );

        }
    );

}


/* =========================================================
   CARGAR IMAGEN HTML PARA PDF
========================================================= */

function cargarImagenHtmlPdf(
    ruta
) {

    return new Promise(
        (
            resolver,
            rechazar
        ) => {

            const imagen =
                new Image();


            imagen.onload =
                () =>
                    resolver(
                        imagen
                    );


            imagen.onerror =
                rechazar;


            imagen.src =
                ruta;

        }
    );

}


/* =========================================================
   DIBUJAR MARCA EN PDF
========================================================= */

function dibujarMarcaAgenciaPdf(
    documento,
    logo,
    nombre,
    colores
) {

    const x =
        13;


    const y =
        9;


    const ancho =
        18;


    const alto =
        18;


    if (logo) {

        try {

            documento.setFillColor(
                ...colores.blanco
            );


            documento.roundedRect(
                x,
                y,
                ancho,
                alto,
                3,
                3,
                "F"
            );


            const propiedades =
                documento.getImageProperties(
                    logo
                );


            const proporcion =
                propiedades.width /
                propiedades.height;


            let anchoImagen =
                14;


            let altoImagen =
                14;


            if (
                proporcion >
                1
            ) {

                altoImagen =
                    anchoImagen /
                    proporcion;

            } else {

                anchoImagen =
                    altoImagen *
                    proporcion;

            }


            documento.addImage(
                logo,
                "PNG",
                x +
                    (
                        ancho -
                        anchoImagen
                    ) /
                    2,
                y +
                    (
                        alto -
                        altoImagen
                    ) /
                    2,
                anchoImagen,
                altoImagen,
                undefined,
                "FAST"
            );


            return;

        } catch (error) {

            console.error(
                "No fue posible dibujar el logo en el PDF.",
                error
            );

        }

    }


    /*
     * Si no existe logo, mostramos las iniciales.
     */

    const iniciales =
        obtenerInicialesAgenciaPdf(
            nombre
        );


    documento.setFillColor(
        ...colores.naranja
    );


    documento.circle(
        22,
        18,
        9,
        "F"
    );


    documento.setTextColor(
        ...colores.textoSobreAcento
    );


    documento.setFont(
        "helvetica",
        "bold"
    );


    documento.setFontSize(10);


    documento.text(
        iniciales,
        22,
        20.5,
        {
            align:
                "center"
        }
    );

}


/* =========================================================
   INICIALES DE AGENCIA
========================================================= */

function obtenerInicialesAgenciaPdf(
    nombre
) {

    const palabras =
        String(
            nombre ||
            "AutoRentCar"
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        palabras.length ===
        1
    ) {

        return palabras[0]
            .slice(
                0,
                2
            )
            .toUpperCase();

    }


    return palabras
        .slice(
            0,
            2
        )
        .map(
            (palabra) =>
                palabra[0]
        )
        .join("")
        .toUpperCase();

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