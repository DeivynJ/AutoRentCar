/* =========================================================
   AUTORENTCAR - PANEL DE AGENCIA
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const body =
            document.body;


        const html =
            document.documentElement;


        const slug =
            html.dataset
                .panelAgencia ||
            "autorentcar";


        const CLAVE_TEMA =
            `autorentcar-panel-tema:${slug}`;


        const CLAVE_SIDEBAR =
            `autorentcar-panel-sidebar:${slug}`;


        const botonTema =
            document.getElementById(
                "panel-theme-toggle"
            );


        const botonColapsar =
            document.getElementById(
                "panel-sidebar-collapse"
            );


        const botonMenuMovil =
            document.getElementById(
                "panel-menu-mobile"
            );


        const overlay =
            document.getElementById(
                "panel-sidebar-overlay"
            );


        const usuario =
            document.querySelector(
                ".panel-topbar-user"
            );


        const botonUsuario =
            document.getElementById(
                "panel-user-button"
            );

        const notificaciones =
    document.getElementById(
        "panel-notifications"
    );


const botonNotificaciones =
    document.getElementById(
        "panel-notification-button"
    );


const filtrosNotificaciones =
    document.querySelectorAll(
        "[data-notification-filter]"
    );


const itemsNotificaciones =
    document.querySelectorAll(
        "[data-notification-category]"
    );


const mensajeFiltroVacio =
    document.getElementById(
        "panel-notification-filter-empty"
    );


        /* =================================================
           TEMA
        ================================================= */

        function temaActual() {

            return html.dataset
                .panelTema ===
                "oscuro"
                ? "oscuro"
                : "claro";

        }


        function actualizarBotonTema() {

            if (!botonTema) {
                return;
            }


            const oscuro =
                temaActual() ===
                "oscuro";


            const icono =
                botonTema.querySelector(
                    "i"
                );


            botonTema.setAttribute(
                "aria-pressed",
                oscuro
                    ? "true"
                    : "false"
            );


            botonTema.setAttribute(
                "aria-label",
                oscuro
                    ? "Activar modo claro"
                    : "Activar modo oscuro"
            );


            botonTema.title =
                oscuro
                    ? "Modo claro"
                    : "Modo oscuro";


            if (icono) {

                icono.className =
                    oscuro
                        ? "fa-regular fa-sun"
                        : "fa-regular fa-moon";

            }

        }


        botonTema?.addEventListener(
            "click",
            () => {

                const nuevoTema =
                    temaActual() ===
                        "oscuro"
                        ? "claro"
                        : "oscuro";


                html.dataset.panelTema =
                    nuevoTema;


                html.style.colorScheme =
                    nuevoTema ===
                        "oscuro"
                        ? "dark"
                        : "light";


                try {

                    localStorage.setItem(
                        CLAVE_TEMA,
                        nuevoTema
                    );

                } catch (error) {

                    console.error(
                        "No fue posible guardar el tema del panel.",
                        error
                    );

                }


                actualizarBotonTema();

            }
        );


        html.style.colorScheme =
            temaActual() ===
                "oscuro"
                ? "dark"
                : "light";


        actualizarBotonTema();


        /* =================================================
           SIDEBAR
        ================================================= */

        try {

            if (
                localStorage.getItem(
                    CLAVE_SIDEBAR
                ) === "collapsed"
            ) {

                body.classList.add(
                    "panel-sidebar-collapsed"
                );

            }

        } catch (error) {

            console.error(
                "No fue posible recuperar el estado del menú.",
                error
            );

        }


        botonColapsar?.addEventListener(
            "click",
            () => {

                body.classList.toggle(
                    "panel-sidebar-collapsed"
                );


                const colapsado =
                    body.classList.contains(
                        "panel-sidebar-collapsed"
                    );


                try {

                    localStorage.setItem(
                        CLAVE_SIDEBAR,
                        colapsado
                            ? "collapsed"
                            : "expanded"
                    );

                } catch (error) {

                    console.error(
                        "No fue posible guardar el estado del menú.",
                        error
                    );

                }

            }
        );


        /* =================================================
           MENÚ MÓVIL
        ================================================= */

        function cerrarMenuMovil() {

            body.classList.remove(
                "panel-mobile-open"
            );

        }


        botonMenuMovil?.addEventListener(
            "click",
            () => {

                body.classList.add(
                    "panel-mobile-open"
                );

            }
        );


        overlay?.addEventListener(
            "click",
            cerrarMenuMovil
        );

        /* =================================================
   NOTIFICACIONES
================================================= */

function cerrarNotificaciones() {

    notificaciones?.classList.remove(
        "open"
    );


    botonNotificaciones?.setAttribute(
        "aria-expanded",
        "false"
    );

}


function aplicarFiltroNotificaciones(
    categoria
) {

    let visibles =
        0;


    itemsNotificaciones.forEach(
        (
            item
        ) => {

            const categoriaItem =
                item.dataset
                    .notificationCategory;


            const mostrar =
                categoria ===
                    "todas" ||
                categoriaItem ===
                    categoria;


            item.hidden =
                !mostrar;


            if (
                mostrar
            ) {

                visibles +=
                    1;

            }

        }
    );


    filtrosNotificaciones.forEach(
        (
            filtro
        ) => {

            const activo =
                filtro.dataset
                    .notificationFilter ===
                categoria;


            filtro.classList.toggle(
                "activo",
                activo
            );


            filtro.setAttribute(
                "aria-pressed",
                activo
                    ? "true"
                    : "false"
            );

        }
    );


    if (
        mensajeFiltroVacio
    ) {

        mensajeFiltroVacio.hidden =
            visibles !==
            0;

    }

}


botonNotificaciones?.addEventListener(
    "click",
    (
        evento
    ) => {

        evento.stopPropagation();


        const abrir =
            !notificaciones
                ?.classList
                .contains(
                    "open"
                );


        cerrarNotificaciones();


        usuario?.classList.remove(
            "open"
        );


        botonUsuario?.setAttribute(
            "aria-expanded",
            "false"
        );


        if (
            abrir
        ) {

            notificaciones?.classList.add(
                "open"
            );


            botonNotificaciones.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    }
);


filtrosNotificaciones.forEach(
    (
        filtro
    ) => {

        filtro.addEventListener(
            "click",
            (
                evento
            ) => {

                evento.stopPropagation();


                aplicarFiltroNotificaciones(
                    filtro.dataset
                        .notificationFilter
                );

            }
        );

    }
);


        /* =================================================
           MENÚ USUARIO
        ================================================= */

        botonUsuario?.addEventListener(
            "click",
            (evento) => {

                evento.stopPropagation();

                cerrarNotificaciones();


                usuario?.classList.toggle(
                    "open"
                );


                botonUsuario.setAttribute(
                    "aria-expanded",
                    usuario?.classList.contains(
                        "open"
                    )
                        ? "true"
                        : "false"
                );

            }
        );


        document.addEventListener(
    "click",
    (
        evento
    ) => {

        if (
            usuario &&
            !usuario.contains(
                evento.target
            )
        ) {

            usuario.classList.remove(
                "open"
            );


            botonUsuario?.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        if (
            notificaciones &&
            !notificaciones.contains(
                evento.target
            )
        ) {

            cerrarNotificaciones();

        }

    }
);


        document.addEventListener(
            "keydown",
            (evento) => {

                if (
                    evento.key !==
                    "Escape"
                ) {

                    return;

                }


                cerrarMenuMovil();
                
                cerrarNotificaciones();
                
                
                usuario?.classList.remove(
                    "open"
                
                );

                botonUsuario?.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }
        );


        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    980
                ) {

                    cerrarMenuMovil();

                }

            }
        );

    }
);