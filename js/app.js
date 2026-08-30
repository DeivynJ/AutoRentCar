/* =========================================================
   AUTORENTCAR - FUNCIONES GENERALES DEL SITIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    configurarNavegacionMultiagencia();

    configurarMenuMovil();
    configurarModoOscuro();
    configurarPreguntasFrecuentes();
    configurarModal();
    configurarEnlacesInternos();
    colocarAnioActual();
    cargarPreferenciaVisual();
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


        /*
         * También dejamos disponible la agencia
         * globalmente para las funciones que
         * añadiremos después:
         *
         * contacto
         * colores
         * PDF
         * WhatsApp
         * branding
         */

        window.AutoRentCarAgencia =
            agenciaPublicaActual;


        aplicarIdentidadAgenciaPublica(
            agenciaPublicaActual
        );

        aplicarContactoAgenciaPublica(
            agenciaPublicaActual
        
        );


    } catch (error) {

        /*
         * Si por alguna razón falla la API,
         * mantenemos la identidad original
         * de AutoRentCar y no rompemos la página.
         */

        console.error(
            "No fue posible cargar la identidad pública de la agencia:",
            error
        );

    }

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
            "AutoRentCar"
        ).trim();


    const logo =
        String(
            agencia.logo ||
            ""
        ).trim();
        


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

    if (
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
            "AutoRentCar"
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
                            ) &&
                            telefono
                        ) {

                            reemplazarTextoConIcono(
                                elemento,
                                telefono
                            );

                        }


                        if (
                            elemento.querySelector(
                                ".fa-envelope"
                            ) &&
                            correo
                        ) {

                            reemplazarTextoConIcono(
                                elemento,
                                correo
                            );

                        }


                        if (
                            elemento.querySelector(
                                ".fa-location-dot"
                            ) &&
                            ubicacionCorta
                        ) {

                            reemplazarTextoConIcono(
                                elemento,
                                ubicacionCorta
                            );

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
                                ) &&
                                ubicacionCorta
                            ) {

                                reemplazarTextoConIcono(
                                    elemento,
                                    ubicacionCorta
                                );

                            }


                            if (
                                elemento.querySelector(
                                    ".fa-phone"
                                ) &&
                                telefono
                            ) {

                                reemplazarTextoConIcono(
                                    elemento,
                                    telefono
                                );

                            }


                            if (
                                elemento.querySelector(
                                    ".fa-envelope"
                                ) &&
                                correo
                            ) {

                                reemplazarTextoConIcono(
                                    elemento,
                                    correo
                                );

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

    if (whatsapp) {

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


            const enlacesWhatsApp =
                document.querySelectorAll(
                    [
                        ".boton-whatsapp",
                        'a[href*="wa.me"]',
                        'a[aria-label="WhatsApp"]'
                    ].join(",")
                );


            enlacesWhatsApp.forEach(
                (enlace) => {

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

        }

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

                if (
                    tarjeta.querySelector(
                        ".fa-phone"
                    )
                ) {

                    const enlace =
                        tarjeta.querySelector(
                            'a[href^="tel:"]'
                        );


                    if (
                        enlace &&
                        telefono
                    ) {

                        enlace.textContent =
                            telefono;

                    }

                }


                if (
                    tarjeta.querySelector(
                        ".fa-envelope"
                    )
                ) {

                    const enlace =
                        tarjeta.querySelector(
                            'a[href^="mailto:"]'
                        );


                    if (
                        enlace &&
                        correo
                    ) {

                        enlace.textContent =
                            correo;

                    }

                }


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


                    if (
                        ubicacion &&
                        ubicacionCorta
                    ) {

                        ubicacion.textContent =
                            ubicacionCorta;

                    }


                    if (
                        detalle &&
                        direccionCompleta
                    ) {

                        detalle.textContent =
                            direccionCompleta;

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

        const solicitud = {
            nombre: nombre.value.trim(),
            telefono: telefono.value.trim(),
            correo: correo.value.trim(),
            asunto: asunto.value,
            mensaje: mensaje.value.trim(),
            fecha: new Date().toISOString()
        };

        let solicitudesGuardadas = [];

        try {
            solicitudesGuardadas = JSON.parse(
                localStorage.getItem(
                    "autorentcarContactos"
                )
            ) || [];
        } catch (error) {
            solicitudesGuardadas = [];

            console.error(
                "No fue posible leer los mensajes guardados.",
                error
            );
        }

        solicitudesGuardadas.push(solicitud);

        localStorage.setItem(
            "autorentcarContactos",
            JSON.stringify(solicitudesGuardadas)
        );

        mostrarNotificacion(
            "Mensaje enviado",
            "Recibimos tu solicitud. Nuestro equipo se comunicará contigo."
        );

        formulario.reset();

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