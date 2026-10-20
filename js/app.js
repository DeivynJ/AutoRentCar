/* =========================================================
   AUTORENTCAR - FUNCIONES GENERALES DEL SITIO
========================================================= */
document.documentElement.classList.add(
    "cargando-branding"
);

aplicarTemaAgenciaGuardado();
cargarPreferenciaVisual();

document.addEventListener("DOMContentLoaded", () => {

    configurarNavegacionMultiagencia();

    configurarVisibilidadMisReservaciones();

    configurarTransicionPaginasPublicas();

    configurarMenuMovil();
    configurarModoOscuro();
    configurarPreguntasFrecuentes();
    configurarModal();
    configurarEnlacesInternos();
    colocarAnioActual();
    configurarFormularioContacto();
    cargarIdentidadAgenciaPublica();

});

/* =========================================================
   CONTEXTO PÚBLICO DE AGENCIA
========================================================= */

function obtenerSlugAgenciaPublica() {

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


/* =========================================================
   NAVEGACIÓN MULTIAGENCIA GLOBAL
========================================================= */

function configurarNavegacionMultiagencia() {

    const slug =
        obtenerSlugAgenciaPublica();


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
                String(
                    enlace.getAttribute(
                        "href"
                    ) ||
                    ""
                ).trim();


            if (!href) {

                return;

            }


            /*
             * Los enlaces externos y acciones
             * especiales no deben modificarse.
             */

            if (
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:")
            ) {

                return;

            }


            /*
             * Si el enlace apunta a una sección de
             * la página actual, conservamos el hash.
             *
             * Ejemplo dentro de Inicio:
             * #servicios
             */

            if (
                href.startsWith("#")
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


            /*
             * Conservamos cualquier parámetro
             * existente y agregamos la agencia.
             */

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
   VISIBILIDAD DE "MIS RESERVACIONES"

   Solo se muestra cuando este navegador conserva al menos
   una reservación de la agencia pública actual.
========================================================= */

function configurarVisibilidadMisReservaciones() {

    const slug =
        obtenerSlugAgenciaPublica();


    const claveReservaciones =
        `autorentcarReservaciones:${slug}`;


    let tieneReservaciones =
        false;


    try {

        const contenido =
            localStorage.getItem(
                claveReservaciones
            );


        if (contenido) {

            const reservaciones =
                JSON.parse(
                    contenido
                );


            tieneReservaciones =
                Array.isArray(
                    reservaciones
                ) &&
                reservaciones.length > 0;

        }

    } catch (error) {

        console.error(
            "No fue posible comprobar las reservaciones guardadas.",
            error
        );


        tieneReservaciones =
            false;

    }


    document
        .querySelectorAll(
            'a[href*="mis-reservas.html"]'
        )
        .forEach(
            (enlace) => {

                enlace.hidden =
                    !tieneReservaciones;

            }
        );

}

/* =========================================================
   TRANSICIÓN ENTRE PÁGINAS PÚBLICAS
========================================================= */

function configurarTransicionPaginasPublicas() {

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


    /*
     * Si el navegador recupera una página mediante
     * Atrás / Adelante, nos aseguramos de que vuelva
     * a mostrarse normalmente.
     */

    window.addEventListener(
        "pageshow",
        () => {

            document.documentElement.classList.remove(
                "pagina-saliendo"
            );

        }
    );


    document.addEventListener(
        "click",
        (evento) => {

            /*
             * Solo navegación normal con clic izquierdo.
             */

            if (
                evento.defaultPrevented ||
                evento.button !== 0 ||
                evento.ctrlKey ||
                evento.metaKey ||
                evento.shiftKey ||
                evento.altKey
            ) {

                return;

            }


            if (
                !(evento.target instanceof Element)
            ) {

                return;

            }


            const enlace =
                evento.target.closest(
                    "a[href]"
                );


            if (!enlace) {

                return;

            }


            /*
             * No alteramos enlaces que se abren
             * en una pestaña nueva.
             */

            if (
                enlace.target === "_blank" ||
                enlace.hasAttribute("download")
            ) {

                return;

            }


            const href =
                String(
                    enlace.getAttribute(
                        "href"
                    ) ||
                    ""
                ).trim();


            if (
                !href ||
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
                        enlace.href,
                        window.location.href
                    );

            } catch (error) {

                return;

            }


            /*
             * Solo páginas internas de este sitio.
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


            /*
             * Si realmente estamos permaneciendo
             * en la misma URL, no hacemos transición.
             */

            if (
                url.href ===
                window.location.href
            ) {

                return;

            }


            /*
             * Para usuarios que prefieran reducir
             * animaciones, navegamos normalmente.
             */

            if (
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches
            ) {

                return;

            }


            evento.preventDefault();


            /*
             * Evitamos múltiples clics mientras
             * comienza la navegación.
             */

            if (
                document.documentElement.classList.contains(
                    "pagina-saliendo"
                )
            ) {

                return;

            }


            document.documentElement.classList.add(
                "pagina-saliendo"
            );


            /*
             * Damos tiempo al fade-out para comenzar
             * antes de cargar el nuevo documento.
             *
             * Debe ser ligeramente menor que los
             * 0.24 s definidos en el CSS para que
             * la navegación siga sintiéndose rápida.
             */

            window.setTimeout(
                () => {

                    window.location.href =
                        url.href;

                },
                190
            );

        }
    );

}

/* =========================================================
   IDENTIDAD PÚBLICA DE LA AGENCIA
========================================================= */

let agenciaPublicaActual = null;


async function cargarIdentidadAgenciaPublica() {

    const slug =
        obtenerSlugAgenciaPublica();


    try {

        const respuesta =
            await fetch(
                `/api/agencias/${encodeURIComponent(
                    slug
                )}/catalogo`,
                {

                    method:
                        "GET",

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
            !respuesta.ok ||
            datos?.ok !== true ||
            !datos?.agencia
        ) {

            throw new Error(
                datos?.mensaje ||
                "No fue posible cargar la información de la agencia."
            );

        }


        agenciaPublicaActual =
            datos.agencia;


        window.AutoRentCarAgencia =
            agenciaPublicaActual;


        aplicarIdentidadAgenciaPublica(
            agenciaPublicaActual
        );


        aplicarContactoAgenciaPublica(
            agenciaPublicaActual
        );


        aplicarSucursalesAgenciaPublica(
            datos?.catalogo?.sucursales
        );


        aplicarColoresAgenciaPublica(
            agenciaPublicaActual
        );


        aplicarPromocionPublicaAgencia(
            datos?.catalogo?.promociones,
            agenciaPublicaActual
        );


    } catch (error) {

        console.error(
            "No fue posible cargar la identidad pública de la agencia:",
            error
        );

    } finally {

        requestAnimationFrame(
            () => {

                requestAnimationFrame(
                    () => {

                        document.documentElement.classList.remove(
                            "cargando-branding"
                        );

                    }
                );

            }
        );

    }

}

/* =========================================================
   APLICAR PROMOCIÓN PÚBLICA DE LA AGENCIA
========================================================= */

function aplicarPromocionPublicaAgencia(
    promociones,
    agencia
) {

    const seccion =
        document.getElementById(
            "seccion-promocion-publica"
        );


    if (!seccion) {

        return;

    }


    const promocionesPublicas =
        Array.isArray(
            promociones
        )
            ? promociones
            : [];


    /*
     * El catálogo ya devuelve únicamente
     * promociones:
     *
     * - activas
     * - públicas
     * - dentro de vigencia
     */
    const promocion =
        promocionesPublicas[0];


    if (!promocion) {

        seccion.hidden =
            true;

        return;

    }


    const porcentaje =
        Number(
            promocion.porcentajeDescuento ||
            0
        );


    const codigo =
        String(
            promocion.codigo ||
            ""
        )
            .trim()
            .toUpperCase();


    if (
        !Number.isFinite(
            porcentaje
        ) ||
        porcentaje <= 0 ||
        !codigo
    ) {

        seccion.hidden =
            true;

        return;

    }


    const nombreAgencia =
        String(
            agencia?.nombre ||
            ""
        ).trim();


    const titulo =
        document.getElementById(
            "promocion-publica-titulo"
        );


    const descripcion =
        document.getElementById(
            "promocion-publica-descripcion"
        );


    const codigoElemento =
        document.getElementById(
            "promocion-publica-codigo"
        );


    if (titulo) {

        titulo.textContent =
            `Obtén un ${porcentaje} % de descuento en tu reservación`;

    }


    if (descripcion) {

        descripcion.textContent =
            nombreAgencia
                ? `Reserva tu vehículo con ${nombreAgencia} y aprovecha esta oferta especial.`
                : "Reserva tu vehículo y aprovecha esta oferta especial.";

    }


    if (codigoElemento) {

        codigoElemento.textContent =
            codigo;

    }


    seccion.hidden =
        false;

}


/* =========================================================
   APLICAR NOMBRE Y LOGO
========================================================= */

function aplicarIdentidadAgenciaPublica(
    agencia
) {

    if (!agencia) {

        return;

    }


    const nombre =
        String(
            agencia.nombre ||
            "Agencia"
        ).trim();


    const logo =
        String(
            agencia.logo ||
            ""
        ).trim();


    /* -----------------------------------------------------
   NOMBRE DINÁMICO DE LA AGENCIA
----------------------------------------------------- */

const referenciasNombreAgencia =
    document.querySelectorAll(
        "[data-agencia-nombre]"
    );


referenciasNombreAgencia.forEach(
    (elemento) => {

        elemento.textContent =
            nombre;

    }
);

    /* -----------------------------------------------------
       NOMBRE EN LOS LOGOS
    ----------------------------------------------------- */

    const nombresLogo =
        document.querySelectorAll(
            ".logo-texto"
        );


    nombresLogo.forEach(
        (elemento) => {

            elemento.textContent =
                nombre;

        }
    );


    /* -----------------------------------------------------
       ACCESIBILIDAD DE LOS LOGOS
    ----------------------------------------------------- */

    const enlacesLogo =
        document.querySelectorAll(
            "a.logo"
        );


    enlacesLogo.forEach(
        (enlace) => {

            enlace.setAttribute(
                "aria-label",
                `Ir al inicio de ${nombre}`
            );

        }
    );


    /* -----------------------------------------------------
       IMAGEN DEL LOGO
    ----------------------------------------------------- */

    if (logo) {

        const contenedoresLogo =
            document.querySelectorAll(
                ".logo-icono"
            );


        contenedoresLogo.forEach(
            (contenedor) => {

                contenedor.classList.add(
                    "logo-icono-imagen"
                );


                const imagen =
                    document.createElement(
                        "img"
                    );


                imagen.src =
                    logo;


                imagen.alt =
                    `Logo de ${nombre}`;


                imagen.loading =
                    "eager";


                contenedor.replaceChildren(
                    imagen
                );

            }
        );

    }


    /* -----------------------------------------------------
   TÍTULO DEL NAVEGADOR
----------------------------------------------------- */

const paginaActual =
    window.location.pathname
        .split("/")
        .pop();


if (
    paginaActual ===
        "index.html" ||
    paginaActual ===
        ""
) {

    document.title =
        `Inicio | ${nombre}`;

} else if (
    document.title.includes(
        "| Agencia"
    )
) {

    document.title =
        document.title.replace(
            /\|\s*Agencia\b/,
            `| ${nombre}`
        );


} else if (
    document.title.includes(
        "AutoRentCar"
    )
) {

    document.title =
        document.title.replace(
            /AutoRentCar/g,
            nombre
        );

    }

}

/* =========================================================
   CONTACTO PÚBLICO DE LA AGENCIA
========================================================= */

function aplicarContactoAgenciaPublica(
    agencia
) {

    if (!agencia) {

        return;

    }


    const contacto =
        agencia.contacto ||
        {};


    const nombre =
        String(
            agencia.nombre ||
            "Agencia"
        ).trim();


    const correo =
        String(
            contacto.correo ||
            ""
        ).trim();


    const whatsapp =
        String(
            contacto.whatsapp ||
            ""
        ).trim();


    const telefono =
        String(
            contacto.telefono ||
            whatsapp ||
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


    const direccion =
        String(
            contacto.direccion ||
            ""
        ).trim();


    const ubicacionCorta =
        construirUbicacionCortaAgencia(
            ciudad,
            provincia,
            pais
        );


    const direccionCompleta =
        construirDireccionCompletaAgencia(
            direccion,
            ciudad,
            provincia,
            pais
        );

    /* -----------------------------------------------------
   CORREO DINÁMICO DE LA AGENCIA
----------------------------------------------------- */

const referenciasCorreo =
    document.querySelectorAll(
        "[data-agencia-correo]"
    );


referenciasCorreo.forEach(
    (elemento) => {

        if (!correo) {

            elemento.hidden =
                true;


            if (
                elemento.tagName ===
                "A"
            ) {

                elemento.removeAttribute(
                    "href"
                );

            }


            return;

        }


        elemento.hidden =
            false;

        elemento.textContent =
            correo;


        if (
            elemento.tagName ===
                "A"
        ) {

            elemento.href =
                `mailto:${correo}`;

        }

    }
);


    /* -----------------------------------------------------
       BARRA SUPERIOR
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".informacion-contacto"
        )
        .forEach(
            (contenedor) => {

                const elementos =
                    contenedor.querySelectorAll(
                        "span"
                    );


               elementos.forEach(
    (elemento) => {

        if (
            elemento.querySelector(
                ".fa-phone"
            )
        ) {

            elemento.hidden =
                !telefono;


            if (telefono) {

                reemplazarTextoConIcono(
                    elemento,
                    telefono
                );

            }

        }


        if (
            elemento.querySelector(
                ".fa-envelope"
            )
        ) {

            elemento.hidden =
                !correo;


            if (correo) {

                reemplazarTextoConIcono(
                    elemento,
                    correo
                );

            }

        }


        if (
            elemento.querySelector(
                ".fa-location-dot"
            )
        ) {

            elemento.hidden =
                !ubicacionCorta;


            if (ubicacionCorta) {

                reemplazarTextoConIcono(
                    elemento,
                    ubicacionCorta
                );

            }

        }

    }
);

}
);


    /* -----------------------------------------------------
       PIE DE PÁGINA
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".pie-columna"
        )
        .forEach(
            (columna) => {

                const titulo =
                    columna.querySelector(
                        "h3"
                    );


                if (
                    !titulo ||
                    titulo.textContent
                        .trim()
                        .toLowerCase() !==
                        "contacto"
                ) {

                    return;

                }


               columna
    .querySelectorAll(
        "p"
    )
    .forEach(
        (elemento) => {

            if (
                elemento.querySelector(
                    ".fa-location-dot"
                )
            ) {

                elemento.hidden =
                    !ubicacionCorta;


                if (ubicacionCorta) {

                    reemplazarTextoConIcono(
                        elemento,
                        ubicacionCorta
                    );

                }

            }


            if (
                elemento.querySelector(
                    ".fa-phone"
                )
            ) {

                elemento.hidden =
                    !telefono;


                if (telefono) {

                    reemplazarTextoConIcono(
                        elemento,
                        telefono
                    );

                }

            }


            if (
                elemento.querySelector(
                    ".fa-envelope"
                )
            ) {

                elemento.hidden =
                    !correo;


                if (correo) {

                    reemplazarTextoConIcono(
                        elemento,
                        correo
                    );

                }

            }

        }
    );
  }
);


    /* -----------------------------------------------------
       ENLACES DE TELÉFONO
    ----------------------------------------------------- */

    if (telefono) {

        const numeroTelefono =
            normalizarTelefonoEnlaceAgencia(
                telefono,
                pais
            );


        document
            .querySelectorAll(
                'a[href^="tel:"]'
            )
            .forEach(
                (enlace) => {

                    if (numeroTelefono) {

                        enlace.href =
                            `tel:+${numeroTelefono}`;

                    }


                    enlace.textContent =
                        telefono;

                }
            );

    }


    /* -----------------------------------------------------
       ENLACES DE CORREO
    ----------------------------------------------------- */

    if (correo) {

        document
            .querySelectorAll(
                'a[href^="mailto:"]'
            )
            .forEach(
                (enlace) => {

                    enlace.href =
                        `mailto:${correo}`;


                    enlace.textContent =
                        correo;

                }
            );

    }


    /* -----------------------------------------------------
   WHATSAPP
----------------------------------------------------- */

const enlacesWhatsApp =
    document.querySelectorAll(
        [
            ".boton-whatsapp",
            'a[href*="wa.me"]',
            'a[aria-label="WhatsApp"]'
        ].join(",")
    );


const numeroWhatsApp =
    normalizarTelefonoEnlaceAgencia(
        whatsapp,
        pais
    );


if (numeroWhatsApp) {

    const mensaje =
        encodeURIComponent(
            `Hola, deseo información sobre los servicios de ${nombre}.`
        );


    const enlaceWhatsApp =
        `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;


    enlacesWhatsApp.forEach(
        (enlace) => {

            enlace.hidden =
                false;


            enlace.href =
                enlaceWhatsApp;


            enlace.setAttribute(
                "target",
                "_blank"
            );


            enlace.setAttribute(
                "rel",
                "noopener noreferrer"
            );


            enlace.setAttribute(
                "aria-label",
                `Contactar a ${nombre} por WhatsApp`
            );

        }
    );


} else {

    enlacesWhatsApp.forEach(
        (enlace) => {

            enlace.hidden =
                true;


            enlace.removeAttribute(
                "href"
            );

        }
    );

}

        /* -----------------------------------------------------
       TARJETAS DE CONTACTO
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".tarjeta-contacto"
        )
        .forEach(
            (tarjeta) => {

                /* -----------------------------------------
                   TELÉFONO
                ----------------------------------------- */

                if (
                    tarjeta.querySelector(
                        ".fa-phone"
                    )
                ) {

                    const enlace =
                        tarjeta.querySelector(
                            "a"
                        );


                    const detalle =
                        tarjeta.querySelector(
                            "small"
                        );


                    tarjeta.hidden =
                        !telefono;


                    if (!telefono) {

                        return;

                    }


                    if (enlace) {

                        const numeroTelefono =
                            normalizarTelefonoEnlaceAgencia(
                                telefono,
                                pais
                            );


                        enlace.textContent =
                            telefono;


                        if (numeroTelefono) {

                            enlace.href =
                                `tel:+${numeroTelefono}`;

                        }

                    }


                    if (detalle) {

                        detalle.textContent =
                            "Teléfono de contacto";

                    }


                    return;

                }


                /* -----------------------------------------
                   CORREO
                ----------------------------------------- */

                if (
                    tarjeta.querySelector(
                        ".fa-envelope"
                    )
                ) {

                    const enlace =
                        tarjeta.querySelector(
                            "a"
                        );


                    const detalle =
                        tarjeta.querySelector(
                            "small"
                        );


                    tarjeta.hidden =
                        !correo;


                    if (!correo) {

                        return;

                    }


                    if (enlace) {

                        enlace.hidden =
                            false;


                        enlace.href =
                            `mailto:${correo}`;


                        enlace.textContent =
                            correo;

                    }


                    if (detalle) {

                        detalle.textContent =
                            "Correo de contacto";

                    }


                    return;

                }


                /* -----------------------------------------
                   UBICACIÓN
                ----------------------------------------- */

                if (
                    tarjeta.querySelector(
                        ".fa-location-dot"
                    )
                ) {

                    const ubicacion =
                        tarjeta.querySelector(
                            "strong"
                        );


                    const detalle =
                        tarjeta.querySelector(
                            "small"
                        );


                    const tieneUbicacion =
                        Boolean(
                            ubicacionCorta ||
                            direccionCompleta
                        );


                    tarjeta.hidden =
                        !tieneUbicacion;


                    if (!tieneUbicacion) {

                        return;

                    }


                    if (ubicacion) {

                        ubicacion.textContent =
                            ubicacionCorta ||
                            direccionCompleta;

                    }


                    if (detalle) {

                        detalle.textContent =
                            direccionCompleta &&
                            direccionCompleta !==
                                ubicacionCorta
                                ? direccionCompleta
                                : "Ubicación registrada";

                    }


                    return;

                }


                /* -----------------------------------------
                   WHATSAPP
                ----------------------------------------- */

                if (
                    tarjeta.querySelector(
                        ".fa-whatsapp"
                    )
                ) {

                    const enlace =
                        tarjeta.querySelector(
                            "a"
                        );


                    const detalle =
                        tarjeta.querySelector(
                            "small"
                        );


                    tarjeta.hidden =
                        !numeroWhatsApp;


                    if (!numeroWhatsApp) {

                        return;

                    }


                    if (enlace) {

                        const mensaje =
                            encodeURIComponent(
                                `Hola, deseo información sobre los servicios de ${nombre}.`
                            );


                        enlace.href =
                            `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;


                        enlace.textContent =
                            "Escribir por WhatsApp";


                        enlace.setAttribute(
                            "target",
                            "_blank"
                        );


                        enlace.setAttribute(
                            "rel",
                            "noopener noreferrer"
                        );

                    }


                    if (detalle) {

                        detalle.textContent =
                            "WhatsApp de contacto";

                    }

                }

            }
        );


    /* -----------------------------------------------------
       COMPROBANTE EN PANTALLA
    ----------------------------------------------------- */

    const pieComprobante =
        document.querySelector(
            ".comprobante-pie > div:last-child"
        );


    if (pieComprobante) {

        const nombreComprobante =
            pieComprobante.querySelector(
                "strong"
            );


        const lineas =
            pieComprobante.querySelectorAll(
                "span"
            );


        if (nombreComprobante) {

            nombreComprobante.textContent =
                nombre;

        }


        if (
            lineas[0] &&
            ubicacionCorta
        ) {

            lineas[0].textContent =
                ubicacionCorta;

        }


        if (
            lineas[1] &&
            telefono
        ) {

            lineas[1].textContent =
                telefono;

        }

    }

}

/* =========================================================
   SUCURSALES PÚBLICAS DE LA AGENCIA
========================================================= */
function aplicarMapaSucursalPublica(
    sucursales
) {

    const seccionMapa =
        document.querySelector(
            ".mapa-contacto"
        );


    /*
     * Esta sección solamente existe
     * en contacto.html.
     */
    if (!seccionMapa) {

        return;

    }


    const lista =
        Array.isArray(
            sucursales
        )
            ? sucursales
            : [];


    /*
     * Preferimos la sucursal principal.
     *
     * Si por alguna razón no existe una marcada
     * como principal, utilizamos la primera activa
     * recibida desde el backend.
     */
    const sucursal =
        lista.find(
            (item) =>
                item?.esPrincipal ===
                true
        ) ||
        lista[0] ||
        null;


    /*
     * Nunca mostramos el mapa estático anterior
     * si la agencia no tiene una sucursal activa.
     */
    if (!sucursal) {

        seccionMapa.hidden =
            true;

        return;

    }


    const nombreSucursal =
        String(
            sucursal.nombre ||
            "Sucursal"
        ).trim();


    const partesUbicacion =
        [
            sucursal.direccion,
            sucursal.ciudad,
            sucursal.provincia,
            sucursal.pais
        ]
            .map(
                (valor) =>
                    String(
                        valor ||
                        ""
                    ).trim()
            )
            .filter(
                Boolean
            );


    /*
     * Si no existe ninguna información real
     * de ubicación, ocultamos el mapa.
     */
    if (!partesUbicacion.length) {

        seccionMapa.hidden =
            true;

        return;

    }


    const ubicacion =
        partesUbicacion.join(
            ", "
        );


    const iframe =
        seccionMapa.querySelector(
            "iframe"
        );


    const subtitulo =
        seccionMapa.querySelector(
            ".mapa-informacion .subtitulo"
        );


    const titulo =
        seccionMapa.querySelector(
            ".mapa-informacion h2"
        );


    const descripcion =
        seccionMapa.querySelector(
            ".mapa-informacion p"
        );


    const enlaceMapa =
        seccionMapa.querySelector(
            ".mapa-informacion a"
        );


    seccionMapa.hidden =
        false;


    if (iframe) {

        iframe.src =
            `https://www.google.com/maps?q=${encodeURIComponent(
                ubicacion
            )}&output=embed`;


        iframe.title =
            `Ubicación de ${nombreSucursal}`;

    }


    if (subtitulo) {

        subtitulo.textContent =
            sucursal.esPrincipal
                ? "Sucursal principal"
                : "Sucursal";

    }


    if (titulo) {

        titulo.textContent =
            `Visítanos en ${nombreSucursal}`;

    }


    if (descripcion) {

        descripcion.textContent =
            ubicacion;

    }


    if (enlaceMapa) {

        enlaceMapa.href =
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                ubicacion
            )}`;

    }

}

function aplicarSucursalesAgenciaPublica(
    sucursales
) {

    const lista =
        Array.isArray(
            sucursales
        )
            ? sucursales
            : [];


    /*
     * Actualizamos también el mapa de Contacto
     * utilizando únicamente ubicaciones reales.
     */
    aplicarMapaSucursalPublica(
        lista
    );


    const contenedor =
        document.getElementById(
            "contenedor-sucursales"
        );


    if (!contenedor) {

        return;

    }


    contenedor.replaceChildren();


    if (!lista.length) {

        const mensaje =
            document.createElement(
                "p"
            );


        mensaje.textContent =
            "No hay sucursales disponibles en este momento.";


        contenedor.appendChild(
            mensaje
        );


        return;

    }


    lista.forEach(
        (sucursal) => {

            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "tarjeta-sucursal";


            if (
                sucursal.esPrincipal ===
                true
            ) {

                tarjeta.classList.add(
                    "activa"
                );

            }


            /* ---------------------------------------------
               PARTE SUPERIOR
            --------------------------------------------- */

            const superior =
                document.createElement(
                    "div"
                );


            superior.className =
                "sucursal-superior";


            const icono =
                document.createElement(
                    "div"
                );


            icono.className =
                "sucursal-icono";


            const iconoElemento =
                document.createElement(
                    "i"
                );


            iconoElemento.className =
                sucursal.esPrincipal
                    ? "fa-solid fa-building"
                    : "fa-solid fa-location-dot";


            icono.appendChild(
                iconoElemento
            );


            const tipo =
                document.createElement(
                    "span"
                );


            tipo.textContent =
                sucursal.esPrincipal
                    ? "Sucursal principal"
                    : "Sucursal";


            superior.append(
                icono,
                tipo
            );


            /* ---------------------------------------------
               NOMBRE
            --------------------------------------------- */

            const titulo =
                document.createElement(
                    "h3"
                );


            titulo.textContent =
                String(
                    sucursal.nombre ||
                    "Sucursal"
                ).trim();


            /* ---------------------------------------------
               DIRECCIÓN
            --------------------------------------------- */

            const partesDireccion =
                [
                    sucursal.direccion,
                    sucursal.ciudad,
                    sucursal.provincia,
                    sucursal.pais
                ]
                    .map(
                        (valor) =>
                            String(
                                valor ||
                                ""
                            ).trim()
                    )
                    .filter(
                        Boolean
                    );


            const direccion =
                document.createElement(
                    "p"
                );


            direccion.textContent =
                partesDireccion.length
                    ? partesDireccion.join(
                        ", "
                    )
                    : "Ubicación no especificada";


            /* ---------------------------------------------
               DETALLES
            --------------------------------------------- */

            const detalles =
                document.createElement(
                    "div"
                );


            detalles.className =
                "sucursal-detalles";


            const telefono =
                String(
                    sucursal.telefono ||
                    ""
                ).trim();


            if (telefono) {

                const telefonoElemento =
                    document.createElement(
                        "span"
                    );


                const telefonoIcono =
                    document.createElement(
                        "i"
                    );


                telefonoIcono.className =
                    "fa-solid fa-phone";


                telefonoElemento.append(
                    telefonoIcono,
                    document.createTextNode(
                        ` ${telefono}`
                    )
                );


                detalles.appendChild(
                    telefonoElemento
                );

            }


            const correo =
                String(
                    sucursal.correo ||
                    ""
                ).trim();


            if (correo) {

                const correoElemento =
                    document.createElement(
                        "span"
                    );


                const correoIcono =
                    document.createElement(
                        "i"
                    );


                correoIcono.className =
                    "fa-solid fa-envelope";


                correoElemento.append(
                    correoIcono,
                    document.createTextNode(
                        ` ${correo}`
                    )
                );


                detalles.appendChild(
                    correoElemento
                );

            }


            const whatsapp =
                String(
                    sucursal.whatsapp ||
                    ""
                ).trim();


            if (whatsapp) {

                const whatsappElemento =
                    document.createElement(
                        "span"
                    );


                const whatsappIcono =
                    document.createElement(
                        "i"
                    );


                whatsappIcono.className =
                    "fa-brands fa-whatsapp";


                whatsappElemento.append(
                    whatsappIcono,
                    document.createTextNode(
                        ` ${whatsapp}`
                    )
                );


                detalles.appendChild(
                    whatsappElemento
                );

            }


            tarjeta.append(
                superior,
                titulo,
                direccion
            );


            if (
                detalles.children.length >
                0
            ) {

                tarjeta.appendChild(
                    detalles
                );

            }


            contenedor.appendChild(
                tarjeta
            );

        }
    );

}


/* =========================================================
   REEMPLAZAR TEXTO CONSERVANDO ICONO
========================================================= */

function reemplazarTextoConIcono(
    elemento,
    texto
) {

    if (
        !elemento ||
        !texto
    ) {

        return;

    }


    const icono =
        elemento.querySelector(
            "i"
        );


    elemento.replaceChildren();


    if (icono) {

        elemento.appendChild(
            icono
        );


        elemento.append(
            " "
        );

    }


    elemento.append(
        texto
    );

}


/* =========================================================
   UBICACIÓN CORTA
========================================================= */

function construirUbicacionCortaAgencia(
    ciudad,
    provincia,
    pais
) {

    const partes =
        [];


    if (ciudad) {

        partes.push(
            ciudad
        );

    } else if (provincia) {

        partes.push(
            provincia
        );

    }


    if (
        pais &&
        !partes.includes(
            pais
        )
    ) {

        partes.push(
            pais
        );

    }


    return partes.join(
        ", "
    );

}


/* =========================================================
   DIRECCIÓN COMPLETA
========================================================= */

function construirDireccionCompletaAgencia(
    direccion,
    ciudad,
    provincia,
    pais
) {

    const partes =
        [
            direccion,
            ciudad,
            provincia,
            pais
        ]
            .map(
                (parte) =>
                    String(
                        parte ||
                        ""
                    ).trim()
            )
            .filter(
                Boolean
            );


    return [
        ...new Set(
            partes
        )
    ].join(
        ", "
    );

}


/* =========================================================
   NORMALIZAR TELÉFONO PARA ENLACES
========================================================= */

function normalizarTelefonoEnlaceAgencia(
    numero,
    pais
) {

    let digitos =
        String(
            numero ||
            ""
        ).replace(
            /\D/g,
            ""
        );


    if (!digitos) {

        return "";

    }


    const paisNormalizado =
        String(
            pais ||
            ""
        )
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    /*
     * República Dominicana pertenece al código
     * internacional +1.
     */

    if (
        (
            paisNormalizado.includes(
                "republica dominicana"
            ) ||
            paisNormalizado.includes(
                "dominican republic"
            )
        ) &&
        digitos.length === 10
    ) {

        digitos =
            `1${digitos}`;

    }


    return digitos;

}

/* =========================================================
   CACHÉ VISUAL DEL TEMA DE LA AGENCIA
========================================================= */

function obtenerClaveTemaAgencia(
    slug
) {

    return `autorentcarTemaAgencia:${slug}`;

}


function guardarTemaAgencia(
    agencia
) {

    const slug =
        String(
            agencia?.slug ||
            obtenerSlugAgenciaPublica()
        )
            .trim()
            .toLowerCase();


    const primario =
        normalizarColorHexAgencia(
            agencia?.colores?.primario
        );


    const secundario =
        normalizarColorHexAgencia(
            agencia?.colores?.secundario
        );


    if (
        !slug ||
        !primario ||
        !secundario
    ) {

        return;

    }


    try {

        localStorage.setItem(
            obtenerClaveTemaAgencia(
                slug
            ),
            JSON.stringify(
                {
                    slug,
                    colores:
                    {
                        primario,
                        secundario
                    }
                }
            )
        );

    } catch (error) {

        console.error(
            "No fue posible guardar el tema de la agencia.",
            error
        );

    }

}


function aplicarTemaAgenciaGuardado() {

    const slug =
        obtenerSlugAgenciaPublica();


    try {

        const guardado =
            localStorage.getItem(
                obtenerClaveTemaAgencia(
                    slug
                )
            );


        if (!guardado) {

            return;

        }


        const tema =
            JSON.parse(
                guardado
            );


        if (
            tema?.slug !== slug ||
            !tema?.colores
        ) {

            return;

        }


        aplicarColoresAgenciaPublica(
            tema
        );

    } catch (error) {

        console.error(
            "No fue posible aplicar el tema guardado.",
            error
        );

    }

}

/* =========================================================
   COLORES PÚBLICOS DE LA AGENCIA
========================================================= */

function aplicarColoresAgenciaPublica(
    agencia
) {

    const colores =
        agencia?.colores ||
        {};


    const primarioMarca =
        normalizarColorHexAgencia(
            colores.primario
        );


    const secundarioMarca =
        normalizarColorHexAgencia(
            colores.secundario
        );


    /*
     * Si la agencia todavía no tiene sus dos colores
     * configurados, conservamos la identidad original.
     */

    if (
        !primarioMarca ||
        !secundarioMarca
    ) {

        return;

    }


    const rgbPrimarioMarca =
        convertirHexARgbAgencia(
            primarioMarca
        );


    const rgbSecundarioMarca =
        convertirHexARgbAgencia(
            secundarioMarca
        );


    if (
        !rgbPrimarioMarca ||
        !rgbSecundarioMarca
    ) {

        return;

    }


    /*
     * Nuestro diseño utiliza:
     *
     * color-principal   = base estructural oscura
     * color-secundario = acento de la marca
     *
     * Por eso seleccionamos automáticamente cuál de los
     * dos colores configurados funciona mejor para cada rol.
     */

    const luminanciaPrimario =
        calcularLuminanciaAgencia(
            rgbPrimarioMarca
        );


    const luminanciaSecundario =
        calcularLuminanciaAgencia(
            rgbSecundarioMarca
        );


    let colorBaseOriginal;

    let colorAcento;


    if (
        luminanciaPrimario <=
        luminanciaSecundario
    ) {

        colorBaseOriginal =
            rgbPrimarioMarca;

        colorAcento =
            rgbSecundarioMarca;

    } else {

        colorBaseOriginal =
            rgbSecundarioMarca;

        colorAcento =
            rgbPrimarioMarca;

    }


    /*
     * Garantizamos una base suficientemente oscura
     * para hero, banners y otras superficies que
     * utilizan textos claros.
     */

    const colorBase =
        asegurarColorBaseAgencia(
            colorBaseOriginal
        );


    const negro =
        {
            r: 0,
            g: 0,
            b: 0
        };


    const blanco =
        {
            r: 255,
            g: 255,
            b: 255
        };


    const colorPrincipalOscuro =
        mezclarColoresAgencia(
            colorBase,
            negro,
            0.32
        );


    const colorPrincipalTono1 =
        mezclarColoresAgencia(
            colorBase,
            blanco,
            0.12
        );


    const colorPrincipalTono2 =
        mezclarColoresAgencia(
            colorBase,
            blanco,
            0.24
        );


    const colorPrincipalTono3 =
        mezclarColoresAgencia(
            colorBase,
            blanco,
            0.18
        );


    const colorPrincipalTono4 =
        mezclarColoresAgencia(
            colorBase,
            blanco,
            0.15
        );


    const colorPrincipalTono5 =
        mezclarColoresAgencia(
            colorBase,
            blanco,
            0.21
        );


    const colorSecundarioOscuro =
        mezclarColoresAgencia(
            colorAcento,
            negro,
            0.14
        );


    const colorSecundarioClaro =
        mezclarColoresAgencia(
            colorAcento,
            blanco,
            0.26
        );


    const colorSecundarioClaro2 =
        mezclarColoresAgencia(
            colorAcento,
            blanco,
            0.20
        );


    const colorSecundarioSuave =
        mezclarColoresAgencia(
            colorAcento,
            blanco,
            0.56
        );


    const colorSecundarioSuave2 =
        mezclarColoresAgencia(
            colorAcento,
            blanco,
            0.45
        );


    const fondoAcentoSuave =
        mezclarColoresAgencia(
            colorAcento,
            blanco,
            0.92
        );


    const textoSobrePrincipal =
        obtenerColorContrasteAgencia(
            colorBase
        );


    const textoSobreSecundario =
        obtenerColorContrasteAgencia(
            colorAcento
        );


    const raiz =
        document.documentElement;


    raiz.style.setProperty(
        "--marca-color-primario",
        primarioMarca
    );


    raiz.style.setProperty(
        "--marca-color-secundario",
        secundarioMarca
    );


    raiz.style.setProperty(
        "--color-principal",
        convertirRgbACssAgencia(
            colorBase
        )
    );


    raiz.style.setProperty(
        "--color-principal-rgb",
        convertirRgbAListaAgencia(
            colorBase
        )
    );


    raiz.style.setProperty(
        "--color-principal-oscuro",
        convertirRgbACssAgencia(
            colorPrincipalOscuro
        )
    );


    raiz.style.setProperty(
        "--color-principal-oscuro-rgb",
        convertirRgbAListaAgencia(
            colorPrincipalOscuro
        )
    );


    raiz.style.setProperty(
        "--color-principal-tono-1",
        convertirRgbACssAgencia(
            colorPrincipalTono1
        )
    );


    raiz.style.setProperty(
        "--color-principal-tono-2",
        convertirRgbACssAgencia(
            colorPrincipalTono2
        )
    );


    raiz.style.setProperty(
        "--color-principal-tono-3",
        convertirRgbACssAgencia(
            colorPrincipalTono3
        )
    );


    raiz.style.setProperty(
        "--color-principal-tono-4",
        convertirRgbACssAgencia(
            colorPrincipalTono4
        )
    );


    raiz.style.setProperty(
        "--color-principal-tono-5",
        convertirRgbACssAgencia(
            colorPrincipalTono5
        )
    );


    raiz.style.setProperty(
        "--color-secundario",
        convertirRgbACssAgencia(
            colorAcento
        )
    );


    raiz.style.setProperty(
        "--color-secundario-rgb",
        convertirRgbAListaAgencia(
            colorAcento
        )
    );


    raiz.style.setProperty(
        "--color-secundario-oscuro",
        convertirRgbACssAgencia(
            colorSecundarioOscuro
        )
    );


    raiz.style.setProperty(
        "--color-secundario-claro",
        convertirRgbACssAgencia(
            colorSecundarioClaro
        )
    );


    raiz.style.setProperty(
        "--color-secundario-claro-2",
        convertirRgbACssAgencia(
            colorSecundarioClaro2
        )
    );


    raiz.style.setProperty(
        "--color-secundario-suave",
        convertirRgbACssAgencia(
            colorSecundarioSuave
        )
    );


    raiz.style.setProperty(
        "--color-secundario-suave-2",
        convertirRgbACssAgencia(
            colorSecundarioSuave2
        )
    );


    raiz.style.setProperty(
        "--color-azul-claro",
        convertirRgbACssAgencia(
            fondoAcentoSuave
        )
    );


    raiz.style.setProperty(
        "--color-oscuro",
        convertirRgbACssAgencia(
            colorPrincipalOscuro
        )
    );


    raiz.style.setProperty(
        "--color-texto-sobre-principal",
        convertirRgbACssAgencia(
            textoSobrePrincipal
        )
    );


    raiz.style.setProperty(
        "--color-texto-sobre-secundario",
        convertirRgbACssAgencia(
            textoSobreSecundario
        )
    );


    raiz.style.setProperty(
        "--color-texto-sobre-secundario-rgb",
        convertirRgbAListaAgencia(
            textoSobreSecundario
        )
    );

    guardarTemaAgencia(
    agencia
);

}


/* =========================================================
   NORMALIZAR COLOR HEXADECIMAL
========================================================= */

function normalizarColorHexAgencia(
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


    if (
        !/^#[0-9a-f]{6}$/i.test(
            valor
        )
    ) {

        return "";

    }


    return valor;

}


/* =========================================================
   HEX A RGB
========================================================= */

function convertirHexARgbAgencia(
    color
) {

    const normalizado =
        normalizarColorHexAgencia(
            color
        );


    if (!normalizado) {

        return null;

    }


    return {

        r:
            parseInt(
                normalizado.slice(
                    1,
                    3
                ),
                16
            ),

        g:
            parseInt(
                normalizado.slice(
                    3,
                    5
                ),
                16
            ),

        b:
            parseInt(
                normalizado.slice(
                    5,
                    7
                ),
                16
            )

    };

}


/* =========================================================
   RGB A CSS
========================================================= */

function convertirRgbACssAgencia(
    rgb
) {

    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

}


function convertirRgbAListaAgencia(
    rgb
) {

    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;

}


/* =========================================================
   MEZCLAR DOS COLORES
========================================================= */

function mezclarColoresAgencia(
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
   LUMINANCIA DEL COLOR
========================================================= */

function calcularLuminanciaAgencia(
    rgb
) {

    const convertirCanal =
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
        convertirCanal(
            rgb.r
        );


    const g =
        convertirCanal(
            rgb.g
        );


    const b =
        convertirCanal(
            rgb.b
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
   RELACIÓN DE CONTRASTE
========================================================= */

function calcularContrasteAgencia(
    colorA,
    colorB
) {

    const luminanciaA =
        calcularLuminanciaAgencia(
            colorA
        );


    const luminanciaB =
        calcularLuminanciaAgencia(
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
   COLOR DE TEXTO CON MEJOR CONTRASTE
========================================================= */

function obtenerColorContrasteAgencia(
    fondo
) {

    const blanco =
        {
            r: 255,
            g: 255,
            b: 255
        };


    const oscuro =
        {
            r: 17,
            g: 24,
            b: 39
        };


    const contrasteBlanco =
        calcularContrasteAgencia(
            fondo,
            blanco
        );


    const contrasteOscuro =
        calcularContrasteAgencia(
            fondo,
            oscuro
        );


    return contrasteOscuro >
        contrasteBlanco

        ? oscuro
        : blanco;

}


/* =========================================================
   ASEGURAR BASE ESTRUCTURAL OSCURA
========================================================= */

function asegurarColorBaseAgencia(
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
        calcularContrasteAgencia(
            resultado,
            blanco
        ) <
            5 &&
        intentos <
            10
    ) {

        resultado =
            mezclarColoresAgencia(
                resultado,
                negro,
                0.10
            );


        intentos++;

    }


    return resultado;

}

/* =========================================================
   MENÚ RESPONSIVE PARA CELULARES
========================================================= */

function configurarMenuMovil() {
    const botonMenu = document.getElementById("boton-menu");
    const menuPrincipal = document.getElementById("menu-principal");

    if (!botonMenu || !menuPrincipal) {
        return;
    }

    botonMenu.addEventListener("click", () => {
        menuPrincipal.classList.toggle("activo");

        const icono = botonMenu.querySelector("i");

        if (menuPrincipal.classList.contains("activo")) {
            icono.classList.remove("fa-bars");
            icono.classList.add("fa-xmark");
            botonMenu.setAttribute("aria-label", "Cerrar menú");
        } else {
            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
            botonMenu.setAttribute("aria-label", "Abrir menú");
        }
    });

    const enlacesMenu = menuPrincipal.querySelectorAll("a");

    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", () => {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        });
    });

    document.addEventListener("click", (evento) => {
        const clicDentroMenu = menuPrincipal.contains(evento.target);
        const clicEnBoton = botonMenu.contains(evento.target);

        if (!clicDentroMenu && !clicEnBoton) {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 920) {
            menuPrincipal.classList.remove("activo");

            const icono = botonMenu.querySelector("i");

            icono.classList.remove("fa-xmark");
            icono.classList.add("fa-bars");
        }
    });
}

/* =========================================================
   MODO CLARO Y MODO OSCURO
========================================================= */

function configurarModoOscuro() {
    const botonModo = document.getElementById(
        "boton-modo"
    );

    if (!botonModo) {
        return;
    }

    botonModo.addEventListener("click", () => {
        const modoOscuroActivo =
            document.body.classList.toggle(
                "modo-oscuro"
            );

        /*
         * Se guarda solamente cuando el usuario
         * cambia el modo manualmente.
         */
        try {
            localStorage.setItem(
                "autorentcarPreferenciaTema",
                modoOscuroActivo
                    ? "oscuro"
                    : "claro"
            );
        } catch (error) {
            console.error(
                "No fue posible guardar la preferencia visual.",
                error
            );
        }

        actualizarIconoModo();
    });
}

function cargarPreferenciaVisual() {
    let preferenciaGuardada = null;

    try {
        preferenciaGuardada =
            localStorage.getItem(
                "autorentcarPreferenciaTema"
            );
    } catch (error) {
        console.error(
            "No fue posible leer la preferencia visual.",
            error
        );
    }

    if (preferenciaGuardada === "oscuro") {
        aplicarTemaVisual(true);
        return;
    }

    if (preferenciaGuardada === "claro") {
        aplicarTemaVisual(false);
        return;
    }

    /*
     * Si el cliente nunca ha seleccionado un tema,
     * se utiliza la configuración del dispositivo.
     */
    const dispositivoUsaModoOscuro =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    aplicarTemaVisual(
        dispositivoUsaModoOscuro
    );

    configurarCambioTemaDelDispositivo();
}

function aplicarTemaVisual(usarModoOscuro) {
    document.body.classList.toggle(
        "modo-oscuro",
        Boolean(usarModoOscuro)
    );

    actualizarIconoModo();
}

function configurarCambioTemaDelDispositivo() {
    if (!window.matchMedia) {
        return;
    }

    const consultaTema = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    const actualizarTemaAutomatico = (
        evento
    ) => {
        const preferenciaManual =
            localStorage.getItem(
                "autorentcarPreferenciaTema"
            );

        /*
         * Solo sigue al dispositivo mientras
         * el cliente no haya elegido un modo.
         */
        if (preferenciaManual) {
            return;
        }

        aplicarTemaVisual(
            evento.matches
        );
    };

    if (
        typeof consultaTema.addEventListener ===
        "function"
    ) {
        consultaTema.addEventListener(
            "change",
            actualizarTemaAutomatico
        );
    } else if (
        typeof consultaTema.addListener ===
        "function"
    ) {
        consultaTema.addListener(
            actualizarTemaAutomatico
        );
    }
}

function actualizarIconoModo() {
    const botonModo = document.getElementById(
        "boton-modo"
    );

    if (!botonModo) {
        return;
    }

    const icono = botonModo.querySelector("i");

    const modoOscuroActivo =
        document.body.classList.contains(
            "modo-oscuro"
        );

    if (modoOscuroActivo) {
        icono?.classList.remove(
            "fa-moon"
        );

        icono?.classList.add(
            "fa-sun"
        );

        botonModo.setAttribute(
            "aria-label",
            "Activar modo claro"
        );

        botonModo.setAttribute(
            "title",
            "Activar modo claro"
        );

        botonModo.setAttribute(
            "aria-pressed",
            "true"
        );
    } else {
        icono?.classList.remove(
            "fa-sun"
        );

        icono?.classList.add(
            "fa-moon"
        );

        botonModo.setAttribute(
            "aria-label",
            "Activar modo oscuro"
        );

        botonModo.setAttribute(
            "title",
            "Activar modo oscuro"
        );

        botonModo.setAttribute(
            "aria-pressed",
            "false"
        );
    }
}

/* =========================================================
   PREGUNTAS FRECUENTES
========================================================= */

function configurarPreguntasFrecuentes() {
    const preguntas = document.querySelectorAll(".pregunta");

    if (!preguntas.length) {
        return;
    }

    preguntas.forEach((pregunta) => {
        const boton = pregunta.querySelector(
            ".pregunta-boton"
        );

        if (!boton) {
            return;
        }

        boton.addEventListener("click", () => {
            const estabaActiva =
                pregunta.classList.contains("activa");

            preguntas.forEach((otraPregunta) => {
                otraPregunta.classList.remove("activa");
            });

            if (!estabaActiva) {
                pregunta.classList.add("activa");
            }
        });
    });
}

/* =========================================================
   CONFIGURACIÓN DEL MODAL DE VEHÍCULOS
========================================================= */

function configurarModal() {
    const modal = document.getElementById("modal-vehiculo");

    const botonCerrar = document.getElementById(
        "cerrar-modal"
    );

    if (!modal || !botonCerrar) {
        return;
    }

    botonCerrar.addEventListener("click", () => {
        cerrarModalVehiculo();
    });

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            cerrarModalVehiculo();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("activo")
        ) {
            cerrarModalVehiculo();
        }
    });
}

/* =========================================================
   CERRAR MODAL DE VEHÍCULO
========================================================= */

function cerrarModalVehiculo() {
    const modal = document.getElementById("modal-vehiculo");

    if (!modal) {
        return;
    }

    modal.classList.remove("activo");
    document.body.style.overflow = "";
}

/* =========================================================
   DESPLAZAMIENTO SUAVE
========================================================= */

function configurarEnlacesInternos() {
    const enlacesInternos = document.querySelectorAll(
        'a[href^="#"]'
    );

    enlacesInternos.forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            const destinoTexto = enlace.getAttribute("href");

            if (!destinoTexto || destinoTexto === "#") {
                evento.preventDefault();
                return;
            }

            const destino = document.querySelector(
                destinoTexto
            );

            if (!destino) {
                return;
            }

            evento.preventDefault();

            destino.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

/* =========================================================
   AÑO AUTOMÁTICO EN EL PIE DE PÁGINA
========================================================= */

function colocarAnioActual() {
    const elementoAnio = document.getElementById(
        "anio-actual"
    );

    if (!elementoAnio) {
        return;
    }

    elementoAnio.textContent =
        new Date().getFullYear();
}

/* =========================================================
   NOTIFICACIONES GENERALES
========================================================= */

let temporizadorNotificacion;

function mostrarNotificacion(titulo, mensaje) {
    const notificacion = document.getElementById(
        "notificacion"
    );

    const tituloElemento = document.getElementById(
        "notificacion-titulo"
    );

    const mensajeElemento = document.getElementById(
        "notificacion-mensaje"
    );

    if (
        !notificacion ||
        !tituloElemento ||
        !mensajeElemento
    ) {
        return;
    }

    tituloElemento.textContent = titulo;
    mensajeElemento.textContent = mensaje;

    notificacion.classList.add("visible");

    clearTimeout(temporizadorNotificacion);

    temporizadorNotificacion = setTimeout(() => {
        notificacion.classList.remove("visible");
    }, 3500);
}

/* =========================================================
   EFECTO DEL MENÚ AL DESPLAZARSE
========================================================= */

window.addEventListener("scroll", () => {
    const navegacion = document.querySelector(
        ".navegacion"
    );

    if (!navegacion) {
        return;
    }

    if (window.scrollY > 40) {
        navegacion.classList.add(
            "navegacion-desplazada"
        );
    } else {
        navegacion.classList.remove(
            "navegacion-desplazada"
        );
    }
});

/* =========================================================
   FORMULARIO DE CONTACTO
========================================================= */

function configurarFormularioContacto() {
    const formulario = document.getElementById(
        "formulario-contacto"
    );

    if (!formulario) {
        return;
    }

    const nombre = document.getElementById(
        "nombre-contacto"
    );

    const telefono = document.getElementById(
        "telefono-contacto"
    );

    const correo = document.getElementById(
        "correo-contacto"
    );

    const asunto = document.getElementById(
        "asunto-contacto"
    );

    const mensaje = document.getElementById(
        "mensaje-contacto"
    );

    const aceptarTerminos = document.getElementById(
        "aceptar-terminos"
    );

    const contador = document.getElementById(
        "contador-caracteres"
    );

    if (mensaje && contador) {
        mensaje.maxLength = 500;

        mensaje.addEventListener("input", () => {
            contador.textContent =
                `${mensaje.value.length} / 500`;
        });
    }

    const campos = [
        nombre,
        telefono,
        correo,
        asunto,
        mensaje
    ];

    campos.forEach((campo) => {
        if (!campo) {
            return;
        }

        campo.addEventListener("blur", () => {
            validarCampoContacto(campo);
        });

        campo.addEventListener("input", () => {
            const contenedor = campo.closest(
                ".campo-contacto"
            );

            if (
                contenedor &&
                contenedor.classList.contains("error")
            ) {
                validarCampoContacto(campo);
            }
        });
    });

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const camposValidos = campos
            .map(validarCampoContacto)
            .every(Boolean);

        if (!aceptarTerminos.checked) {
            mostrarNotificacion(
                "Aceptación necesaria",
                "Debes aceptar el uso de tus datos para enviar el mensaje."
            );

            return;
        }

        if (!camposValidos) {
            mostrarNotificacion(
                "Revisa el formulario",
                "Completa correctamente los campos señalados."
            );

            return;
        }

        const agencia =
    agenciaPublicaActual;

const contacto =
    agencia?.contacto ||
    {};

const whatsapp =
    String(
        contacto.whatsapp ||
        ""
    ).trim();

const pais =
    String(
        contacto.pais ||
        ""
    ).trim();

const numeroWhatsApp =
    normalizarTelefonoEnlaceAgencia(
        whatsapp,
        pais
    );

if (!numeroWhatsApp) {
    mostrarNotificacion(
        "WhatsApp no disponible",
        "Esta agencia no tiene un número de WhatsApp configurado."
    );

    return;
}

const textoMensaje =
    [
        `Hola, soy ${nombre.value.trim()}.`,
        `Teléfono: ${telefono.value.trim()}`,
        `Correo: ${correo.value.trim()}`,
        `Motivo: ${asunto.value}`,
        "",
        mensaje.value.trim()
    ].join("\n");

const enlaceWhatsApp =
    `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
        textoMensaje
    )}`;

window.location.href =
    enlaceWhatsApp;

        campos.forEach((campo) => {
            const contenedor = campo.closest(
                ".campo-contacto"
            );

            if (contenedor) {
                contenedor.classList.remove(
                    "correcto",
                    "error"
                );
            }
        });

        if (contador) {
            contador.textContent = "0 / 500";
        }
    });
}

/* =========================================================
   VALIDAR CAMPOS DEL FORMULARIO DE CONTACTO
========================================================= */

function validarCampoContacto(campo) {
    const valor = campo.value.trim();

    let mensajeError = "";

    if (!valor) {
        mensajeError =
            "Este campo es obligatorio.";
    } else if (
        campo.id === "nombre-contacto" &&
        valor.length < 3
    ) {
        mensajeError =
            "Escribe un nombre válido.";
    } else if (
        campo.id === "telefono-contacto" &&
        !/^[0-9+\-()\s]{8,20}$/.test(valor)
    ) {
        mensajeError =
            "Escribe un teléfono válido.";
    } else if (
        campo.id === "correo-contacto" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
    ) {
        mensajeError =
            "Escribe un correo válido.";
    } else if (
        campo.id === "mensaje-contacto" &&
        valor.length < 10
    ) {
        mensajeError =
            "El mensaje debe tener al menos 10 caracteres.";
    }

    const contenedor = campo.closest(
        ".campo-contacto"
    );

    const error = contenedor?.querySelector(
        ".mensaje-error"
    );

    if (!contenedor) {
        return false;
    }

    if (mensajeError) {
        contenedor.classList.add("error");
        contenedor.classList.remove("correcto");

        if (error) {
            error.textContent = mensajeError;
        }

        return false;
    }

    contenedor.classList.remove("error");
    contenedor.classList.add("correcto");

    if (error) {
        error.textContent = "";
    }

    return true;
}