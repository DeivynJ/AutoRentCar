/* =========================================================
   AUTORENTCAR - INTERFAZ ADMINISTRATIVA
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const body = document.body;

    /* =====================================================
   MODO CLARO / OSCURO
===================================================== */

const botonTema =
    document.getElementById(
        "admin-theme-toggle"
    );


const CLAVE_TEMA_ADMIN =
    "autorentcar-admin-tema";


function obtenerTemaAdminActual() {

    return (
        document
            .documentElement
            .dataset
            .adminTema ===
        "oscuro"
    )
        ? "oscuro"
        : "claro";

}


function actualizarBotonTemaAdmin() {

    if (!botonTema) {
        return;
    }


    const temaOscuro =
        obtenerTemaAdminActual() ===
        "oscuro";


    const icono =
        botonTema.querySelector(
            "i"
        );


    botonTema.setAttribute(
        "aria-pressed",
        temaOscuro
            ? "true"
            : "false"
    );


    botonTema.setAttribute(
        "aria-label",
        temaOscuro
            ? "Activar modo claro"
            : "Activar modo oscuro"
    );


    botonTema.setAttribute(
        "title",
        temaOscuro
            ? "Modo claro"
            : "Modo oscuro"
    );


    if (icono) {

        icono.className =
            temaOscuro
                ? "fa-regular fa-sun"
                : "fa-regular fa-moon";

    }

}


function aplicarTemaAdmin(
    tema,
    guardar = true
) {

    const temaSeguro =
        tema === "oscuro"
            ? "oscuro"
            : "claro";


    document
        .documentElement
        .dataset
        .adminTema =
        temaSeguro;


    document
        .documentElement
        .style
        .colorScheme =
        temaSeguro ===
            "oscuro"
            ? "dark"
            : "light";


    if (guardar) {

        try {

            localStorage.setItem(
                CLAVE_TEMA_ADMIN,
                temaSeguro
            );

        } catch (error) {

            console.error(
                "No fue posible guardar el tema administrativo.",
                error
            );

        }

    }


    actualizarBotonTemaAdmin();

}


aplicarTemaAdmin(
    obtenerTemaAdminActual(),
    false
);


botonTema?.addEventListener(
    "click",
    () => {

        const siguienteTema =
            obtenerTemaAdminActual() ===
                "oscuro"
                ? "claro"
                : "oscuro";


        aplicarTemaAdmin(
            siguienteTema
        );

    }
);

    const botonColapsar = document.getElementById(
        "sidebar-collapse-btn"
    );

    const botonMenuMovil = document.getElementById(
        "topbar-menu-mobile"
    );

    const overlay = document.getElementById(
        "sidebar-overlay"
    );

    const usuario = document.querySelector(
        ".topbar-user"
    );

    const botonUsuario = document.getElementById(
        "topbar-user-button"
    );


    /* =====================================================
       SIDEBAR - ESTADO GUARDADO
    ===================================================== */

    const estadoSidebar = localStorage.getItem(
        "autorentcar-admin-sidebar"
    );

    if (estadoSidebar === "collapsed") {
        body.classList.add("sidebar-collapsed");
    }


    /* =====================================================
       COLAPSAR SIDEBAR
    ===================================================== */

    if (botonColapsar) {

        botonColapsar.addEventListener("click", () => {

            body.classList.toggle(
                "sidebar-collapsed"
            );

            const colapsado =
                body.classList.contains(
                    "sidebar-collapsed"
                );

            localStorage.setItem(
                "autorentcar-admin-sidebar",
                colapsado
                    ? "collapsed"
                    : "expanded"
            );

        });

    }


    /* =====================================================
       SIDEBAR MÓVIL
    ===================================================== */

    function abrirMenuMovil() {

        body.classList.add(
            "sidebar-mobile-open"
        );

    }


    function cerrarMenuMovil() {

        body.classList.remove(
            "sidebar-mobile-open"
        );

    }


    if (botonMenuMovil) {

        botonMenuMovil.addEventListener(
            "click",
            abrirMenuMovil
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            cerrarMenuMovil
        );

    }


    /* =====================================================
       MENÚ DE USUARIO
    ===================================================== */

    if (botonUsuario && usuario) {

        botonUsuario.addEventListener(
            "click",
            (evento) => {

                evento.stopPropagation();

                usuario.classList.toggle(
                    "open"
                );

                const abierto =
                    usuario.classList.contains(
                        "open"
                    );

                botonUsuario.setAttribute(
                    "aria-expanded",
                    abierto
                        ? "true"
                        : "false"
                );

            }
        );

    }


    /* =====================================================
       CERRAR MENÚ AL HACER CLIC FUERA
    ===================================================== */

    document.addEventListener(
        "click",
        (evento) => {

            if (
                usuario &&
                !usuario.contains(evento.target)
            ) {

                usuario.classList.remove(
                    "open"
                );

                if (botonUsuario) {

                    botonUsuario.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }

        }
    );


    /* =====================================================
       TECLA ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        (evento) => {

            if (evento.key !== "Escape") {
                return;
            }

            cerrarMenuMovil();

            if (usuario) {

                usuario.classList.remove(
                    "open"
                );

            }

            if (botonUsuario) {

                botonUsuario.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       CERRAR SIDEBAR MÓVIL AL CAMBIAR DE PÁGINA
    ===================================================== */

    const enlacesSidebar = document.querySelectorAll(
        ".sidebar-link"
    );

    enlacesSidebar.forEach((enlace) => {

        enlace.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 980) {

                    cerrarMenuMovil();

                }

            }
        );

    });


    /* =====================================================
       ANIMACIONES DE ENTRADA
    ===================================================== */

    const elementosAnimados =
        document.querySelectorAll(
            "[data-animate]"
        );

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                (entradas) => {

                    entradas.forEach(
                        (entrada) => {

                            if (
                                entrada.isIntersecting
                            ) {

                                entrada.target.classList.add(
                                    "is-visible"
                                );

                                observer.unobserve(
                                    entrada.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.08
                }
            );


        elementosAnimados.forEach(
            (elemento) => {

                observer.observe(
                    elemento
                );

            }
        );

    } else {

        elementosAnimados.forEach(
            (elemento) => {

                elemento.classList.add(
                    "is-visible"
                );

            }
        );

    }
    /* =====================================================
       AJUSTE AL CAMBIAR TAMAÑO DE PANTALLA
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 980) {

                cerrarMenuMovil();

            }

        }
    );

});